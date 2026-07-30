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
  const mockTargetModel: any = {
    find: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({}),
  };
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
