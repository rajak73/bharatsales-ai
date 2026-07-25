import { Test, TestingModule } from '@nestjs/testing';
import { VisitsService } from './visits.service';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';

describe('VisitsService', () => {
  let service: VisitsService;

  const mockVisitModel = {
    findOne: jest.fn(),
  };

  const mockOutletModel = {
    findById: jest.fn(),
  };

  class MockVisit {
    save: any;
    constructor(private data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitsService,
        {
          provide: getModelToken('Visit'),
          useValue: mockVisitModel,
        },
        {
          provide: getModelToken('Outlet'),
          useValue: mockOutletModel,
        },
      ],
    }).compile();

    service = module.get<VisitsService>(VisitsService);
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
      mockOutletModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          location: { latitude: 1, longitude: 1 }
        })
      });

      await expect(
        service.checkIn('user1', 'org1', { outletId: 'outlet1', lat: 1, lng: 1, accuracy: 10, deviceTimestamp: new Date().toISOString() })
      ).rejects.toThrow('A shopfront photo is mandatory for check-in.');
    });

    it('should succeed if photoUrl is provided', async () => {
      mockVisitModel.findOne.mockResolvedValue(null);
      mockOutletModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          location: { latitude: 1, longitude: 1 }
        })
      });

      const result = await service.checkIn('user1', 'org1', { outletId: 'outlet1', lat: 1, lng: 1, accuracy: 10, deviceTimestamp: new Date().toISOString(), photoUrl: 'http://photo' });
      expect(result.photoUrl).toBe('http://photo');
    });
  });
});
