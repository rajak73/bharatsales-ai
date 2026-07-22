import { Test, TestingModule } from '@nestjs/testing';
import { VisitsService } from './visits.service';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('VisitsService - Geofencing', () => {
  let service: VisitsService;

  const mockVisitModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockOutletModel = {
    findById: jest.fn(),
  };

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateDistance (Haversine)', () => {
    it('calculates 0m for the exact same coordinates', () => {
      // @ts-ignore - access private method for testing
      const dist = service.calculateDistance(12.9716, 77.5946, 12.9716, 77.5946);
      expect(dist).toBe(0);
    });

    it('calculates correct distance between two known points', () => {
      // Example: 12.9716, 77.5946 to 12.9720, 77.5946
      // roughly 44.47 meters
      // @ts-ignore
      const dist = service.calculateDistance(12.9716, 77.5946, 12.9720, 77.5946);
      expect(dist).toBeCloseTo(44.47, 1);
    });

    it('calculates correct distance for points over 50m apart', () => {
      // Example: 12.9716, 77.5946 to 12.9730, 77.5946
      // roughly 155 meters
      // @ts-ignore
      const dist = service.calculateDistance(12.9716, 77.5946, 12.9730, 77.5946);
      expect(dist).toBeGreaterThan(50);
    });
  });

  describe('checkIn Geofencing', () => {
    it('sets isWithinGeofence=true when distance is under 50m', async () => {
      mockVisitModel.findOne.mockResolvedValue(null);
      mockOutletModel.findById.mockResolvedValue({
        _id: 'outlet1',
        location: { latitude: 12.9716, longitude: 77.5946 }
      });
      
      const saveMock = jest.fn().mockResolvedValue({ id: 'visit1' });
      // We must override the Visit model instantiation to return an object with save()
      class MockVisit {
        constructor(public data: any) {}
        save = saveMock;
        static findOne = mockVisitModel.findOne;
        static create = mockVisitModel.create;
      }
      (service as any).visitModel = MockVisit;

      await service.checkIn('user1', 'org1', {
        outletId: 'outlet1',
        lat: 12.9716, // same coordinates, 0 distance
        lng: 77.5946,
        accuracy: 10
      });

      expect(saveMock).toHaveBeenCalled();
      const instance = saveMock.mock.instances[0] as MockVisit;
      expect(instance.data.isWithinGeofence).toBe(true);
      expect(instance.data.distanceFromOutlet).toBe(0);
    });

    it('sets isWithinGeofence=false when distance is over 50m', async () => {
      mockVisitModel.findOne.mockResolvedValue(null);
      mockOutletModel.findById.mockResolvedValue({
        _id: 'outlet1',
        location: { latitude: 12.9716, longitude: 77.5946 }
      });
      
      const saveMock = jest.fn().mockResolvedValue({ id: 'visit1' });
      class MockVisit {
        constructor(public data: any) {}
        save = saveMock;
        static findOne = mockVisitModel.findOne;
        static create = mockVisitModel.create;
      }
      (service as any).visitModel = MockVisit;

      await service.checkIn('user1', 'org1', {
        outletId: 'outlet1',
        lat: 12.9730, // 155m away
        lng: 77.5946,
        accuracy: 10
      });

      expect(saveMock).toHaveBeenCalled();
      const instance = saveMock.mock.instances[0] as MockVisit;
      expect(instance.data.isWithinGeofence).toBe(false);
      expect(instance.data.distanceFromOutlet).toBeGreaterThan(50);
    });
  });
});
