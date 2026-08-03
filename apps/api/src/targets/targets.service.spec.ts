import { Test, TestingModule } from '@nestjs/testing';
import { TargetsService } from './targets.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from '../notifications/notifications.service';

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TargetsService,
        { provide: getModelToken('Target'), useValue: mockTargetModel },
        { provide: getModelToken('Order'), useValue: mockOrderModel },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<TargetsService>(TargetsService);
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
});
