import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getModelToken } from '@nestjs/mongoose';
import { InventoryService } from '../inventory/inventory.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { DispatchService } from '../dispatch/dispatch.service';
import { BadRequestException } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { HierarchyService } from '../hierarchy/hierarchy.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockOrderModel = {
    findOne: jest.fn(),
  };

  const mockOutletModel = {
    findById: jest.fn(),
  };

  const mockSchemeModel = {
    find: jest.fn(),
  };

  const mockDistributorModel = {};
  
  const mockProductModel = {
    find: jest.fn(),
  };

  const mockInventoryService = {};
  const mockApprovalsService = {};
  const mockHierarchyService = {
    getDescendantTerritoryIds: jest.fn().mockResolvedValue(['t1', 't2']),
  };
  
  const mockConnection = {
    startSession: jest.fn(),
  };

  class MockOrder {
    save: any;
    constructor(private data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken('Order'),
          useValue: mockOrderModel,
        },
        {
          provide: getModelToken('Outlet'),
          useValue: mockOutletModel,
        },
        {
          provide: getModelToken('Scheme'),
          useValue: mockSchemeModel,
        },
        {
          provide: getModelToken('Distributor'),
          useValue: mockDistributorModel,
        },
        {
          provide: getModelToken('Product'),
          useValue: mockProductModel,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
        {
          provide: ModuleRef,
          useValue: { get: jest.fn() },
        },
        {
          provide: ApprovalsService,
          useValue: mockApprovalsService,
        },
        {
          provide: HierarchyService,
          useValue: mockHierarchyService,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    // override constructor
    (service as any).orderModel = function(data: any) {
      this.save = jest.fn().mockResolvedValue(data);
    };
    Object.assign((service as any).orderModel, mockOrderModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scheme validation', () => {
    it('should throw BadRequestException if scheme is inactive', async () => {
      mockOrderModel.findOne.mockResolvedValue(null);
      mockOutletModel.findById.mockResolvedValue({ _id: 'outlet1', location: { state: 'KA' }, commercial: { creditLimit: 10000, outstandingBalance: 0 } });
      
      mockProductModel.find.mockResolvedValue([{
        _id: 'prod1',
        sku: 'SKU1',
        name: 'Product 1',
        pricing: { basePrice: 100, gstPercentage: 18 },
        moq: 1
      }]);

      mockSchemeModel.find.mockResolvedValue([{
        _id: 'scheme1',
        name: 'Diwali Scheme',
        isActive: false,
        validFrom: '2023-01-01',
        validUntil: '2025-01-01'
      }]);

      await expect(
        service.create('org1', 'user1', {
          idempotencyKey: 'test1',
          outletId: 'outlet1',
          items: [{ productId: 'prod1', quantity: 2, unitPrice: 100, appliedSchemeId: 'scheme1' }]
        } as any)
      ).rejects.toThrow('Scheme Diwali Scheme is not active');
    });

    it('should throw BadRequestException if scheme is expired', async () => {
      mockOrderModel.findOne.mockResolvedValue(null);
      mockOutletModel.findById.mockResolvedValue({ _id: 'outlet1', location: { state: 'KA' }, commercial: { creditLimit: 10000, outstandingBalance: 0 } });
      
      mockProductModel.find.mockResolvedValue([{
        _id: 'prod1',
        sku: 'SKU1',
        name: 'Product 1',
        pricing: { basePrice: 100, gstPercentage: 18 },
        moq: 1
      }]);

      mockSchemeModel.find.mockResolvedValue([{
        _id: 'scheme1',
        name: 'Expired Scheme',
        isActive: true,
        validFrom: '2020-01-01',
        validUntil: '2021-01-01'
      }]);

      await expect(
        service.create('org1', 'user1', {
          idempotencyKey: 'test2',
          outletId: 'outlet1',
          items: [{ productId: 'prod1', quantity: 2, unitPrice: 100, appliedSchemeId: 'scheme1' }]
        } as any)
      ).rejects.toThrow('Scheme Expired Scheme is expired or not yet started');
    });
  });

  describe('syncOfflineOrders', () => {
    it('should process multiple orders and return summary', async () => {
      jest.spyOn(service, 'create').mockImplementation(async (orgId, userId, data) => {
        if (data.idempotencyKey === 'fail') throw new Error('Simulated failure');
        return { _id: '123' } as any;
      });

      const result = await service.syncOfflineOrders('org1', 'user1', [
        { idempotencyKey: 'success1' },
        { idempotencyKey: 'fail' },
        { idempotencyKey: 'success2' }
      ] as any[]);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].idempotencyKey).toBe('fail');
    });
  });
});
