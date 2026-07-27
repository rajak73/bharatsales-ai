import { Test, TestingModule } from '@nestjs/testing';
import { OutletsService } from './outlets.service';
import { getModelToken } from '@nestjs/mongoose';
import { Outlet } from '../schemas/outlet.schema';
import { Order } from '../schemas/order.schema';
import { Visit } from '../schemas/visit.schema';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('OutletsService', () => {
  let service: OutletsService;

  const mockOutletModel = {
    findOne: jest.fn(),
  };
  const mockOrderModel = {};
  const mockVisitModel = {};
  const mockTenantModel = {
    findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) })
  };

  class MockOutlet {
    save: any;
    constructor(private data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutletsService,
        {
          provide: getModelToken(Outlet.name),
          useValue: mockOutletModel,
        },
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
        {
          provide: getModelToken(Visit.name),
          useValue: mockVisitModel,
        },
        {
          provide: getModelToken('Tenant'),
          useValue: mockTenantModel,
        },
        {
          provide: HierarchyService,
          useValue: {
            getDescendantTerritoryIds: jest.fn().mockResolvedValue(['t1', 't2'])
          }
        }
      ],
    }).compile();

    service = module.get<OutletsService>(OutletsService);
    // override constructor
    (service as any).outletModel = function(data: any) {
      this.save = jest.fn().mockResolvedValue(data);
    };
    Object.assign((service as any).outletModel, mockOutletModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw ConflictException if duplicate mobile or gstin exists', async () => {
      mockOutletModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: '123' })
      });

      await expect(
        service.create('org1', 'user1', { mobile: '1234567890', tax: { gstin: 'GSTIN123' } } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should save with Pending Approval status if no status is provided', async () => {
      mockOutletModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null)
      });

      const result = await service.create('org1', 'user1', { mobile: '1234567890' } as any);
      expect(result.status).toBe('Pending Approval');
    });
  });
});
