import { Test, TestingModule } from '@nestjs/testing';
import { BeatsService } from './beats.service';
import { getModelToken } from '@nestjs/mongoose';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('BeatsService', () => {
  let service: BeatsService;

  const mockBeatModel = {
    findOneAndUpdate: jest.fn(),
  };
  const mockBeatScheduleModel = {
    findOne: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) }),
    find: jest.fn(),
  };
  const mockVisitModel = { find: jest.fn() };
  const mockUserModel = {
    find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 'rep1' }, { _id: 'rep2' }]) }) }),
  };
  const mockHierarchyService = { getTeamUserIds: jest.fn().mockResolvedValue([]) };
  const mockNotificationsService = { create: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BeatsService,
        { provide: getModelToken('Beat'), useValue: mockBeatModel },
        { provide: getModelToken('BeatSchedule'), useValue: mockBeatScheduleModel },
        { provide: getModelToken('Visit'), useValue: mockVisitModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: HierarchyService, useValue: mockHierarchyService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<BeatsService>(BeatsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTeamBeatCompletion', () => {
    it('should resolve the team as all org Sales Representatives for an Organization Admin', async () => {
      const result = await service.getTeamBeatCompletion('org1', 'admin1', 'Organization Admin');

      expect(mockUserModel.find).toHaveBeenCalledWith({ organizationId: 'org1', role: 'Sales Representative' });
      expect(mockHierarchyService.getTeamUserIds).not.toHaveBeenCalled();
      expect(result.reps).toHaveLength(2);
    });

    it('should use territory-based resolution for a Sales Manager and return empty when they have no territories', async () => {
      const result = await service.getTeamBeatCompletion('org1', 'manager1', 'Sales Manager');

      expect(mockHierarchyService.getTeamUserIds).toHaveBeenCalledWith('org1', 'manager1');
      expect(result).toEqual({ teamCompletionPercentage: 0, reps: [] });
    });
  });

  describe('publishBeat', () => {
    it('should notify every user with a schedule referencing the published beat', async () => {
      mockBeatModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'beat1', name: 'Monday Route', status: 'Active' }) });
      mockBeatScheduleModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ user: 'rep1' }, { user: 'rep2' }]) }) });

      await service.publishBeat('org1', 'beat1');

      expect(mockNotificationsService.create).toHaveBeenCalledWith('org1', 'rep1', expect.objectContaining({ type: 'beat_assigned' }));
      expect(mockNotificationsService.create).toHaveBeenCalledWith('org1', 'rep2', expect.objectContaining({ type: 'beat_assigned' }));
    });
  });

  describe('notifyMissedOutlets', () => {
    it('should notify a rep who left outlets unvisited on a completed beat day', async () => {
      mockBeatScheduleModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              _id: 'sched1',
              user: 'rep1',
              organizationId: 'org1',
              beat: { outlets: ['outletA', 'outletB'] },
            },
          ]),
        }),
      });
      mockVisitModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ outlet: 'outletA' }]) }) });

      await service.notifyMissedOutlets();

      expect(mockNotificationsService.create).toHaveBeenCalledWith('org1', 'rep1', expect.objectContaining({ type: 'missed_outlet' }));
    });

    it('should not notify a rep who visited every planned outlet', async () => {
      mockBeatScheduleModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              _id: 'sched1',
              user: 'rep1',
              organizationId: 'org1',
              beat: { outlets: ['outletA'] },
            },
          ]),
        }),
      });
      mockVisitModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ outlet: 'outletA' }]) }) });

      await service.notifyMissedOutlets();

      expect(mockNotificationsService.create).not.toHaveBeenCalled();
    });
  });
});
