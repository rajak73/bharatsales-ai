import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { getModelToken } from '@nestjs/mongoose';
import { OrdersService } from '../orders/orders.service';
import { InventoryService } from '../inventory/inventory.service';

describe('SyncService Security', () => {
  let service: SyncService;
  let ordersService: OrdersService;

  const mockOrdersService = {
    create: jest.fn()
  };

  const mockModel = {
    find: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockReturnThis(),
    session: jest.fn().mockResolvedValue(null),
    findOneAndUpdate: jest.fn(),
    db: {
      model: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      }),
      startSession: jest.fn().mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      })
    }
  };

  const mockInventoryService = {
    getInventory: jest.fn().mockResolvedValue([])
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: getModelToken('Order'), useValue: mockModel },
        { provide: getModelToken('Visit'), useValue: mockModel },
        { provide: getModelToken('Collection'), useValue: mockModel },
        { provide: getModelToken('Product'), useValue: mockModel },
        { provide: getModelToken('PriceList'), useValue: mockModel },
        { provide: getModelToken('Outlet'), useValue: mockModel },
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: InventoryService, useValue: mockInventoryService }
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    ordersService = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should route offline orders through OrdersService.create to enforce business rules', async () => {
    const payload = {
      orders: [
        {
          _id: 'offline-order-1',
          outletId: 'outlet-1',
          items: [{ productId: 'prod-1', quantity: 5000 }],
          updatedAt: new Date().toISOString()
        }
      ]
    };

    mockOrdersService.create.mockResolvedValueOnce({
      _id: 'offline-order-1',
      status: 'Hold_Stock'
    });

    const result = await service.push('org-1', 'user-1', payload as any);
    
    expect(ordersService.create).toHaveBeenCalledWith('org-1', 'user-1', expect.objectContaining({
      outletId: 'outlet-1'
    }));
    
    expect(result.conflicts).toHaveLength(0);
  });
});
