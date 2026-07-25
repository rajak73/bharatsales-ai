import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { getModelToken } from '@nestjs/mongoose';

describe('AttendanceService', () => {
  let service: AttendanceService;

  const mockAttendanceModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
  };

  const mockVisitModel = {
    updateMany: jest.fn(),
  };

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
    it('should throw error if photoUrl is missing', async () => {
      mockAttendanceModel.findOne.mockResolvedValue(null);
      await expect(
        service.startDay('user1', 'org1', { lat: 1, lng: 1, accuracy: 10, deviceTimestamp: new Date().toISOString() })
      ).rejects.toThrow('A selfie photo is mandatory for starting the day.');
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

    it('should approve regularization', async () => {
      const mockSession: any = { _id: '123', regularizationStatus: 'PENDING', save: jest.fn().mockResolvedValue(true) };
      mockAttendanceModel.findById.mockResolvedValue(mockSession);
      await service.approveRegularization('123', 'APPROVED');
      expect(mockSession.regularizationStatus).toBe('APPROVED');
    });
  });
});
