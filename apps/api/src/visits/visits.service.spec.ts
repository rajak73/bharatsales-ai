import { VisitsService } from './visits.service';
import { BadRequestException } from '../core/http-errors';

describe('VisitsService', () => {
  let service: VisitsService;

  const mockVisitModel = {
    findOne: jest.fn(),
  };

  const mockOutletModel = {
    findOne: jest.fn(),
  };

  class MockVisit {
    save: any;
    constructor(private data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
    }
  }

  beforeEach(async () => {
    service = new VisitsService(mockVisitModel as any, mockOutletModel as any, { findOne: jest.fn() } as any);
    // override constructor
    (service as any).visitModel = function(data: any) {
      this.save = jest.fn().mockResolvedValue(data);
    };
    Object.assign((service as any).visitModel, mockVisitModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIn', () => {
    it('should throw BadRequestException if photoUrl is missing', async () => {
      mockVisitModel.findOne.mockResolvedValue(null);
      mockOutletModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          location: { latitude: 1, longitude: 1 }
        })
      });

      await expect(
        service.checkIn('user1', 'org1', { outletId: '507f1f77bcf86cd799439011', lat: 1, lng: 1, accuracy: 10, deviceTimestamp: new Date().toISOString() })
      ).rejects.toThrow('A shopfront photo is mandatory for check-in.');
    });

    it('should succeed if photoUrl is provided', async () => {
      mockVisitModel.findOne.mockResolvedValue(null);
      mockOutletModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          location: { latitude: 1, longitude: 1 }
        })
      });

      const result = await service.checkIn('user1', 'org1', { outletId: '507f1f77bcf86cd799439011', lat: 1, lng: 1, accuracy: 10, deviceTimestamp: new Date().toISOString(), photoUrl: 'http://photo' });
      expect(result.photoUrl).toBe('http://photo');
    });

    it('should scope the existing-active-visit lookup by organizationId', async () => {
      mockVisitModel.findOne.mockResolvedValue(null);
      mockOutletModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ location: { latitude: 1, longitude: 1 } }) });

      await service.checkIn('user1', 'org1', { outletId: '507f1f77bcf86cd799439011', lat: 1, lng: 1, accuracy: 10, photoUrl: 'http://photo' });

      expect(mockVisitModel.findOne).toHaveBeenCalledWith({ user: 'user1', organizationId: 'org1', status: 'Active' });
    });
  });

  describe('checkOut', () => {
    it('should scope the active-visit lookup by organizationId, not just user', async () => {
      mockVisitModel.findOne.mockResolvedValue(null);

      await expect(service.checkOut('user1', 'org1', 'visit1')).rejects.toThrow('Active visit not found');

      expect(mockVisitModel.findOne).toHaveBeenCalledWith({ _id: 'visit1', user: 'user1', organizationId: 'org1', status: 'Active' });
    });
  });

  describe('addActivity', () => {
    it('should scope the active-visit lookup by organizationId, not just user', async () => {
      mockVisitModel.findOne.mockResolvedValue(null);

      await expect(service.addActivity('user1', 'org1', 'visit1', { type: 'note' })).rejects.toThrow('Active visit not found or already completed');

      expect(mockVisitModel.findOne).toHaveBeenCalledWith({ _id: 'visit1', user: 'user1', organizationId: 'org1', status: 'Active' });
    });
  });
});
