import { SyncService } from './sync.service';
import type { OrdersService } from '../orders/orders.service';

describe('SyncService Security', () => {
  let service: SyncService;
  let ordersService: OrdersService;

  const mockOrdersService = {
    create: jest.fn()
  };

  const mockModel = {
    find: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnValue({ session: jest.fn().mockResolvedValue(null) }),
    session: jest.fn().mockResolvedValue(null),
    findOneAndUpdate: jest.fn(),
    db: {
      model: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      }),
      startSession: jest.fn().mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      })
    }
  };

  const mockInventoryService = {
    getInventory: jest.fn().mockResolvedValue([])
  };

  beforeEach(async () => {
    service = new SyncService(
      mockModel as any, mockModel as any, mockModel as any, mockModel as any, mockModel as any, mockModel as any,
      mockOrdersService as any, mockInventoryService as any,
    );
    ordersService = mockOrdersService as unknown as OrdersService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should route offline orders through OrdersService.create to enforce business rules', async () => {
    const payload = {
      orders: [
        {
          _id: 'offline-order-1',
          outletId: 'outlet-1',
          items: [{ productId: 'prod-1', quantity: 5000 }],
          updatedAt: new Date().toISOString()
        }
      ]
    };

    mockOrdersService.create.mockResolvedValueOnce({
      _id: 'offline-order-1',
      status: 'Hold_Stock'
    });

    const result = await service.push('org-1', 'user-1', payload as any);
    
    expect(ordersService.create).toHaveBeenCalledWith('org-1', 'user-1', expect.objectContaining({
      outletId: 'outlet-1'
    }));
    
    expect(result.conflicts).toHaveLength(0);
  });
  describe('pull scoping', () => {
    const chain = (result: any) => ({ exec: jest.fn().mockResolvedValue(result), populate: jest.fn().mockReturnThis() });
    let outletModel: any, collectionModel: any, orderModel: any, beatScheduleModel: any, beatModel: any, hierarchyService: any;

    const build = () => {
      const genericModel: any = { find: jest.fn(() => chain([])) };
      beatScheduleModel = { find: jest.fn(() => chain([])), distinct: jest.fn().mockResolvedValue(['beat-1']) };
      beatModel = { distinct: jest.fn().mockResolvedValue(['outlet-on-beat']) };
      orderModel = {
        find: jest.fn(() => chain([])),
        distinct: jest.fn().mockResolvedValue(['dist-outlet']),
        db: { model: jest.fn((name: string) => (name === 'BeatSchedule' ? beatScheduleModel : name === 'Beat' ? beatModel : genericModel)) },
      };
      outletModel = { find: jest.fn(() => chain([])) };
      collectionModel = { find: jest.fn(() => chain([])) };
      hierarchyService = { getDescendantTerritoryIds: jest.fn().mockResolvedValue(['t1', 't1-child']) };
      return new SyncService(
        orderModel, genericModel, collectionModel, genericModel, genericModel, outletModel,
        mockOrdersService as any, mockInventoryService as any, hierarchyService,
      );
    };

    it('scopes a Sales Representative to their territory/beat outlets, own collections, and no inventory', async () => {
      const svc = build();
      const res = await svc.pull('org-1', 'rep-1', '2026-01-01T00:00:00Z', { role: 'Sales Representative', territoryIds: ['t1'] });

      const outletQuery = outletModel.find.mock.calls[0][0];
      expect(outletQuery.organizationId).toBe('org-1');
      expect(outletQuery.$or).toEqual(expect.arrayContaining([
        { territoryId: { $in: ['t1', 't1-child'] } },
        { _id: { $in: ['outlet-on-beat'] } },
      ]));

      const collectionQuery = collectionModel.find.mock.calls[0][0];
      expect(collectionQuery).toMatchObject({ organizationId: 'org-1', collectedByUserId: 'rep-1' });
      expect(collectionQuery.updatedAt.$gt).toEqual(new Date('2026-01-01T00:00:00Z'));

      expect(mockInventoryService.getInventory).not.toHaveBeenCalled();
      expect(res.inventory).toEqual([]);
    });

    it('scopes a Distributor to their own distributorId', async () => {
      const svc = build();
      await svc.pull('org-1', 'dist-user', undefined, { role: 'Distributor', distributorId: 'D1' });

      expect(outletModel.find.mock.calls[0][0]).toMatchObject({ 'commercial.assignedDistributorId': 'D1' });
      expect(orderModel.distinct).toHaveBeenCalledWith('outletId', { organizationId: 'org-1', assignedDistributorId: 'D1' });
      expect(collectionModel.find.mock.calls[0][0]).toMatchObject({ outletId: { $in: ['dist-outlet'] } });
      expect(mockInventoryService.getInventory).toHaveBeenCalledWith('org-1', expect.objectContaining({ distributorId: 'D1' }));
    });

    it('gives a Sales Representative with no territories and no beats no outlets', async () => {
      const svc = build();
      beatScheduleModel.distinct.mockResolvedValue([]);
      const res = await svc.pull('org-1', 'rep-1', undefined, { role: 'Sales Representative', territoryIds: [] });
      expect(outletModel.find).not.toHaveBeenCalled();
      expect(res.outlets).toEqual([]);
    });
  });
});
