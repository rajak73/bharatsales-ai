import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { getModelToken } from '@nestjs/mongoose';
import { HierarchyService } from '../hierarchy/hierarchy.service';

describe('AttendanceService', () => {
  let service: AttendanceService;

  const mockAttendanceModel = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockVisitModel = {
    updateMany: jest.fn(),
  };

  const mockHierarchyService = { getTeamUserIds: jest.fn().mockResolvedValue([]) };

  class MockAttendance {
    save: any;
    constructor(private data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getModelToken('AttendanceSession'),
          useValue: mockAttendanceModel,
        },
        {
          provide: getModelToken('Visit'),
          useValue: mockVisitModel,
        },
        {
          provide: HierarchyService,
          useValue: mockHierarchyService,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    // override constructor
    (service as any).attendanceModel = function(data: any) {
      this.save = jest.fn().mockResolvedValue(data);
    };
    Object.assign((service as any).attendanceModel, mockAttendanceModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startDay', () => {
    it('should NOT throw error if photoUrl is missing (relaxed requirement)', async () => {
      mockAttendanceModel.findOne.mockResolvedValue(null);
      const result = await service.startDay('user1', 'org1', { lat: 1, lng: 1, accuracy: 10, deviceTimestamp: new Date().toISOString() });
      expect(result).toBeDefined();
      expect(result.photoUrl).toBeUndefined();
    });

    it('should succeed if photoUrl is present', async () => {
      mockAttendanceModel.findOne.mockResolvedValue(null);
      const result = await service.startDay('user1', 'org1', { lat: 1, lng: 1, accuracy: 10, deviceTimestamp: new Date().toISOString(), photoUrl: 'http://photo' });
      expect(result.photoUrl).toBe('http://photo');
    });
  });

  describe('regularization', () => {
    it('should request regularization', async () => {
      const mockSession: any = { _id: '123', regularizationStatus: null, save: jest.fn().mockResolvedValue(true) };
      mockAttendanceModel.findOne.mockResolvedValue(mockSession);
      await service.requestRegularization('user1', '123', 'Forgot to checkout');
      expect(mockSession.regularizationStatus).toBe('PENDING');
      expect(mockSession.regularizationReason).toBe('Forgot to checkout');
    });

    it('should approve regularization when called by an Organization Admin', async () => {
      const mockSession: any = { _id: '123', user: 'rep1', regularizationStatus: 'PENDING', save: jest.fn().mockResolvedValue(true) };
      mockAttendanceModel.findOne.mockResolvedValue(mockSession);
      await service.approveRegularization('org1', { sub: 'admin1', role: 'Organization Admin' }, '123', 'APPROVED');
      expect(mockSession.regularizationStatus).toBe('APPROVED');
    });

    it('should let a Sales Manager approve regularization for their own team member', async () => {
      const mockSession: any = { _id: '123', user: 'rep1', regularizationStatus: 'PENDING', save: jest.fn().mockResolvedValue(true) };
      mockAttendanceModel.findOne.mockResolvedValue(mockSession);
      mockHierarchyService.getTeamUserIds.mockResolvedValue(['rep1', 'rep2']);

      await service.approveRegularization('org1', { sub: 'manager1', role: 'Sales Manager' }, '123', 'APPROVED');
      expect(mockSession.regularizationStatus).toBe('APPROVED');
    });

    it('should block a Sales Manager from approving regularization for a rep outside their team', async () => {
      const mockSession: any = { _id: '123', user: 'someoneElsesRep', regularizationStatus: 'PENDING', save: jest.fn().mockResolvedValue(true) };
      mockAttendanceModel.findOne.mockResolvedValue(mockSession);
      mockHierarchyService.getTeamUserIds.mockResolvedValue(['rep1', 'rep2']);

      await expect(
        service.approveRegularization('org1', { sub: 'manager1', role: 'Sales Manager' }, '123', 'APPROVED')
      ).rejects.toThrow('Sales Managers can only approve attendance for their own team.');
    });

    it('should scope pending regularizations to a Sales Manager\'s own team', async () => {
      mockHierarchyService.getTeamUserIds.mockResolvedValue(['rep1', 'rep2']);
      mockAttendanceModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }),
      });

      await service.getPendingRegularizations('org1', { sub: 'manager1', role: 'Sales Manager' });

      expect(mockAttendanceModel.find).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 'org1',
        regularizationStatus: 'PENDING',
        user: { $in: ['rep1', 'rep2'] },
      }));
    });
  });

  describe('getHistory', () => {
    it('should return the calling user\'s own sessions, most recent first, capped at 30', async () => {
      const sort = jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 's1' }]) }) });
      mockAttendanceModel.find.mockReturnValue({ sort });

      const result = await service.getHistory('user1');

      expect(mockAttendanceModel.find).toHaveBeenCalledWith({ user: 'user1' });
      expect(sort).toHaveBeenCalledWith({ startTime: -1 });
      expect(result).toEqual([{ _id: 's1' }]);
    });
  });
});
