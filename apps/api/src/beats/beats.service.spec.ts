import { Test, TestingModule } from '@nestjs/testing';
import { BeatsService } from './beats.service';
import { getModelToken } from '@nestjs/mongoose';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { NotificationsService } from '../notifications/notifications.service';

// Chainable query stub supporting any combination of .select()/.sort()/.exec()
// used across the different callers of find()/findOne() in BeatsService.
function chainable(result: any) {
  const chain: any = {
    select: jest.fn(() => chain),
    sort: jest.fn(() => chain),
    populate: jest.fn(() => chain),
    distinct: jest.fn(() => chain),
    exec: jest.fn().mockResolvedValue(result),
  };
  return chain;
}

describe('BeatsService', () => {
  let service: BeatsService;

  const mockBeatModel = {
    findOneAndUpdate: jest.fn(),
    find: jest.fn().mockReturnValue(chainable([])),
    findOne: jest.fn(),
  };
  const mockBeatScheduleModel: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: 'newScheduleId' }),
  }));
  Object.assign(mockBeatScheduleModel, {
    findOne: jest.fn().mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) }),
    find: jest.fn(),
  });
  const mockVisitModel = { find: jest.fn().mockReturnValue(chainable([])) };
  const mockUserModel = {
    find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 'rep1' }, { _id: 'rep2' }]) }) }),
  };
  const mockLocationPingModel = { find: jest.fn().mockReturnValue(chainable([])) };
  const mockAttendanceModel = { findOne: jest.fn().mockReturnValue(chainable(null)) };
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
        { provide: getModelToken('LocationPing'), useValue: mockLocationPingModel },
        { provide: getModelToken('AttendanceSession'), useValue: mockAttendanceModel },
        { provide: HierarchyService, useValue: mockHierarchyService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<BeatsService>(BeatsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockVisitModel.find.mockReturnValue(chainable([]));
    mockLocationPingModel.find.mockReturnValue(chainable([]));
    mockAttendanceModel.findOne.mockReturnValue(chainable(null));
    mockBeatModel.find.mockReturnValue(chainable([]));
    mockBeatModel.findOne.mockReturnValue(chainable(null));
    mockHierarchyService.getTeamUserIds.mockResolvedValue([]);
  });

  describe('getAllBeats — cross-rep leak prevention', () => {
    it('should return every beat in the org for an Organization Admin', async () => {
      mockBeatModel.find.mockReturnValue(chainable([{ _id: 'beat1' }, { _id: 'beat2' }]));

      const result = await service.getAllBeats('org1', { sub: 'admin1', role: 'Organization Admin' });

      expect(mockBeatModel.find).toHaveBeenCalledWith({ organizationId: 'org1' });
      expect(result).toHaveLength(2);
    });

    it('should scope a Sales Representative to only beats scheduled to them', async () => {
      mockBeatScheduleModel.find.mockReturnValue(chainable(['beatA']));
      mockBeatModel.find.mockReturnValue(chainable([{ _id: 'beatA' }]));

      await service.getAllBeats('org1', { sub: 'rep1', role: 'Sales Representative' });

      expect(mockBeatScheduleModel.find).toHaveBeenCalledWith({ organizationId: 'org1', user: 'rep1' });
      expect(mockBeatModel.find).toHaveBeenCalledWith({ _id: { $in: ['beatA'] }, organizationId: 'org1' });
    });

    it('should scope a Sales Manager to their team\'s scheduled beats plus unassigned drafts, never another team\'s beats', async () => {
      mockHierarchyService.getTeamUserIds.mockResolvedValue(['rep1', 'rep2']);
      mockBeatScheduleModel.find.mockReturnValue(chainable(['beatA']));
      mockBeatModel.find.mockReturnValue(chainable([{ _id: 'beatA' }]));

      await service.getAllBeats('org1', { sub: 'manager1', role: 'Sales Manager' });

      expect(mockBeatScheduleModel.find).toHaveBeenCalledWith({ organizationId: 'org1', user: { $in: ['rep1', 'rep2'] } });
      expect(mockBeatModel.find).toHaveBeenCalledWith({
        organizationId: 'org1',
        $or: [{ _id: { $in: ['beatA'] } }, { status: 'Draft' }],
      });
    });

    it('should return an empty array for any other role', async () => {
      const result = await service.getAllBeats('org1', { sub: 'x', role: 'Distributor' });
      expect(result).toEqual([]);
    });
  });

  describe('assignBeat — template vs assignment ownership', () => {
    it('should reject assigning a beat that is still a Draft (must be published first)', async () => {
      mockBeatModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'beat1', name: 'Monday Route', status: 'Draft' }) });

      await expect(
        service.assignBeat('org1', { sub: 'manager1', role: 'Sales Manager' }, 'beat1', 'rep1', '2026-01-01')
      ).rejects.toThrow('Only a published (Active) beat can be assigned.');
    });

    it('should reject when the beat does not exist in this org', async () => {
      mockBeatModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(
        service.assignBeat('org1', { sub: 'manager1', role: 'Sales Manager' }, 'missingBeat', 'rep1', '2026-01-01')
      ).rejects.toThrow('Beat not found');
    });

    it('should block a Sales Manager from assigning a beat to a rep outside their team', async () => {
      mockBeatModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'beat1', name: 'Monday Route', status: 'Active' }) });
      mockHierarchyService.getTeamUserIds.mockResolvedValue(['rep1', 'rep2']);

      await expect(
        service.assignBeat('org1', { sub: 'manager1', role: 'Sales Manager' }, 'beat1', 'someoneElsesRep', '2026-01-01')
      ).rejects.toThrow('Sales Managers can only assign beats to reps on their own team.');
    });

    it('should let a Sales Manager assign a published beat to a rep on their own team, and notify them', async () => {
      mockBeatModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'beat1', name: 'Monday Route', status: 'Active' }) });
      mockHierarchyService.getTeamUserIds.mockResolvedValue(['rep1', 'rep2']);

      const result = await service.assignBeat('org1', { sub: 'manager1', role: 'Sales Manager' }, 'beat1', 'rep1', '2026-01-01');

      expect(result).toBeDefined();
      expect(mockNotificationsService.create).toHaveBeenCalledWith('org1', 'rep1', expect.objectContaining({ type: 'beat_assigned' }));
    });

    it('should let an Organization Admin assign to any rep without team scoping', async () => {
      mockBeatModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'beat1', name: 'Monday Route', status: 'Active' }) });

      const result = await service.assignBeat('org1', { sub: 'admin1', role: 'Organization Admin' }, 'beat1', 'anyRep', '2026-01-01');

      expect(result).toBeDefined();
      expect(mockHierarchyService.getTeamUserIds).not.toHaveBeenCalled();
    });
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

  describe('checkRouteDeviation — route analytics', () => {
    it('should compute total distance from consecutive GPS pings using the haversine formula', async () => {
      // Two points roughly 111km apart (1 degree of latitude).
      mockLocationPingModel.find.mockReturnValue(chainable([
        { lat: 28.5, lng: 77.2, deviceTimestamp: new Date('2026-01-01T09:00:00Z') },
        { lat: 29.5, lng: 77.2, deviceTimestamp: new Date('2026-01-01T10:00:00Z') },
      ]));

      const result = await service.checkRouteDeviation('org1', 'rep1', '2026-01-01');

      expect(result.routeAnalytics.totalDistanceKm).toBeGreaterThan(100);
      expect(result.routeAnalytics.totalDistanceKm).toBeLessThan(120);
    });

    it('should compute productive time from visit durations and travel time as the remainder of the shift', async () => {
      mockVisitModel.find.mockReturnValue(chainable([{ durationMinutes: 30 }, { durationMinutes: 20 }]));
      mockAttendanceModel.findOne.mockReturnValue(chainable({
        startTime: new Date('2026-01-01T09:00:00Z'),
        endTime: new Date('2026-01-01T11:00:00Z'),
      }));

      const result = await service.checkRouteDeviation('org1', 'rep1', '2026-01-01');

      expect(result.routeAnalytics.productiveTimeMinutes).toBe(50);
      expect(result.routeAnalytics.totalShiftMinutes).toBe(120);
      expect(result.routeAnalytics.travelTimeMinutes).toBe(70);
    });

    it('should still return routeAnalytics even when the rep has no beat plan for the day', async () => {
      const result = await service.checkRouteDeviation('org1', 'rep1', '2026-01-01');

      expect(result.hasPlan).toBe(false);
      expect(result.routeAnalytics).toBeDefined();
      expect(result.routeAnalytics.totalDistanceKm).toBe(0);
    });
  });
});
