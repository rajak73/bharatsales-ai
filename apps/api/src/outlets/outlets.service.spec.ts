import { OutletsService } from './outlets.service';
import type { HierarchyService } from '../hierarchy/hierarchy.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException } from '../core/http-errors';

describe('OutletsService', () => {
  let service: OutletsService;

  const mockOutletModel = {
    findOne: jest.fn(),
  };
  const mockOrderModel = {};
  const mockVisitModel = {};
  const mockUserModel = {
    find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) })
  };
  const mockTenantModel = {
    findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) })
  };

  class MockOutlet {
    save: any;
    constructor(private data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
    }
  }

  beforeEach(async () => {
    service = new OutletsService(
      mockOutletModel as any,
      mockOrderModel as any,
      mockVisitModel as any,
      mockTenantModel as any,
      mockUserModel as any,
      { getDescendantTerritoryIds: jest.fn().mockResolvedValue(['t1', 't2']) } as unknown as HierarchyService,
      { create: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService,
    );
    // override constructor
    (service as any).outletModel = function(data: any) {
      this.save = jest.fn().mockResolvedValue(data);
    };
    Object.assign((service as any).outletModel, mockOutletModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if duplicate mobile or gstin exists', async () => {
      mockOutletModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: '123' })
      });

      await expect(
        service.create('org1', 'user1', { mobile: '1234567890', tax: { gstin: 'GSTIN123' } } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should save with Pending Approval status if no status is provided', async () => {
      mockOutletModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      const result = await service.create('org1', 'user1', { mobile: '1234567890' } as any);
      expect(result.status).toBe('Pending Approval');
    });
  });
});
