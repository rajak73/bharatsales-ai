import { TargetsService } from './targets.service';

describe('TargetsService', () => {
  let service: TargetsService;

  const mockOrderModel = {
    find: jest.fn(),
    db: { model: jest.fn() },
  };
  const mockTargetModel: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: 'newTargetId', toObject: () => ({ ...data, _id: 'newTargetId' }) }),
  }));
  Object.assign(mockTargetModel, {
    find: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({}),
  });
  const mockNotificationsService = { create: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    service = new TargetsService(mockTargetModel as any, mockOrderModel as any, mockNotificationsService as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTarget — period/role gating', () => {
    it('should block a Sales Manager from creating an Annual target', async () => {
      await expect(
        service.createTarget('org1', 'Sales Manager', { period: 'Annual', entityType: 'User', entityId: 'rep1' } as any)
      ).rejects.toThrow('Only Organization Admins can create Annual targets.');
    });

    it('should let an Organization Admin create an Annual target', async () => {
      const result = await service.createTarget('org1', 'Organization Admin', { period: 'Annual', entityType: 'User', entityId: 'rep1' } as any);
      expect(result).toBeDefined();
    });

    it('should let a Sales Manager create a Monthly target', async () => {
      const result = await service.createTarget('org1', 'Sales Manager', { period: 'Monthly', entityType: 'User', entityId: 'rep1' } as any);
      expect(result).toBeDefined();
    });
  });

  describe('rollupExpiredTargets', () => {
    it('should notify the target owner when the rolled-up status becomes Achieved', async () => {
      mockTargetModel.find.mockResolvedValue([
        {
          _id: 'target1',
          organizationId: 'org1',
          entityType: 'User',
          entityId: 'rep1',
          targetMetric: 'SalesValue',
          targetValue: 100,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        },
      ]);
      mockOrderModel.find.mockResolvedValue([{ totals: { grandTotal: 150 } }]);

      await service.rollupExpiredTargets();

      expect(mockNotificationsService.create).toHaveBeenCalledWith('org1', 'rep1', expect.objectContaining({ type: 'target_achieved' }));
    });

    it('should not notify when the rolled-up status becomes Missed', async () => {
      mockTargetModel.find.mockResolvedValue([
        {
          _id: 'target1',
          organizationId: 'org1',
          entityType: 'User',
          entityId: 'rep1',
          targetMetric: 'SalesValue',
          targetValue: 100,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        },
      ]);
      mockOrderModel.find.mockResolvedValue([{ totals: { grandTotal: 10 } }]);

      await service.rollupExpiredTargets();

      expect(mockNotificationsService.create).not.toHaveBeenCalled();
    });
  });

  describe('CollectionValue actuals', () => {
    it('sums Cleared collections by collectedByUserId (User) and outletId (Outlet)', async () => {
      const collectionFind = jest.fn().mockResolvedValue([{ amount: 300 }, { amount: 200 }]);
      mockOrderModel.db.model.mockReturnValue({ find: collectionFind });
      const base = { organizationId: 'org1', targetMetric: 'CollectionValue', startDate: '2026-01-01', endDate: '2026-01-31' };

      const userActual = await (service as any).calculateActualValue({ ...base, entityType: 'User', entityId: 'rep1' });
      expect(userActual).toBe(500);
      expect(mockOrderModel.db.model).toHaveBeenCalledWith('Collection');
      expect(collectionFind).toHaveBeenLastCalledWith({
        organizationId: 'org1',
        createdAt: { $gte: '2026-01-01', $lte: '2026-01-31' },
        status: 'Cleared',
        collectedByUserId: 'rep1',
      });

      await (service as any).calculateActualValue({ ...base, entityType: 'Outlet', entityId: 'outlet1' });
      expect(collectionFind).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'Cleared', outletId: 'outlet1' }));
    });
  });

  describe('entity names', () => {
    it('adds entityName for User/Outlet targets so clients never render a raw id', async () => {
      const repId = '6ab25742714d4cd1e93ba781';
      const outletId = '6ab25742714d4cd1e93ba799';
      const exec = jest.fn()
        .mockResolvedValueOnce([{ _id: repId, name: 'Sales Rep Saket' }])
        .mockResolvedValueOnce([{ _id: outletId, name: 'Aggarwal Stores' }]);
      const nameFind = jest.fn().mockReturnValue({ select: () => ({ lean: () => ({ exec }) }) });
      mockOrderModel.db.model.mockReturnValue({ find: nameFind });
      const base = { organizationId: 'org1', targetValue: 100, status: 'Achieved', actualValue: 100, startDate: '2026-01-01', endDate: '2026-01-31' };

      const result = await (service as any).calculateForTargets([
        { ...base, _id: 't1', entityType: 'User', entityId: repId },
        { ...base, _id: 't2', entityType: 'Outlet', entityId: outletId },
        { ...base, _id: 't3', entityType: 'User', entityId: 'legacy-id' },
      ]);

      expect(result.map((t: any) => t.entityName)).toEqual(['Sales Rep Saket', 'Aggarwal Stores', undefined]);
      expect(nameFind).toHaveBeenCalledWith({ organizationId: 'org1', _id: { $in: [repId] } });
    });
  });
});
