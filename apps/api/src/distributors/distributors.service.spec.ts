import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DistributorsService } from './distributors.service';

describe('DistributorsService', () => {
  let service: DistributorsService;

  const mockDistributorModel = {
    find: jest.fn(),
  };
  const mockOrderModel = {
    countDocuments: jest.fn(),
  };
  const mockInventoryModel = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributorsService,
        { provide: getModelToken('Distributor'), useValue: mockDistributorModel },
        { provide: getModelToken('Order'), useValue: mockOrderModel },
        { provide: getModelToken('Inventory'), useValue: mockInventoryModel },
      ],
    }).compile();

    service = module.get<DistributorsService>(DistributorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDistributors', () => {
    it('should compute real fillRate, orderFulfillment, and pendingOrders per distributor', async () => {
      mockDistributorModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { _id: 'dist1', toObject: () => ({ id: 'dist1', name: 'Dist One' }) },
        ]),
      });
      mockOrderModel.countDocuments
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(10) }) // totalOrders
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(6) })  // deliveredOrders
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(2) }); // pendingOrders
      mockInventoryModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ stock: 5 }, { stock: 0 }, { stock: 3 }, { stock: 0 }]),
      });

      const result = await service.getDistributors('org1');

      expect(result).toEqual([
        expect.objectContaining({
          id: 'dist1',
          orderFulfillment: 60, // 6/10
          pendingOrders: 2,
          fillRate: 50, // 2 in-stock out of 4 items
        }),
      ]);
    });

    it('should return zero stats when a distributor has no orders or inventory', async () => {
      mockDistributorModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { _id: 'dist2', toObject: () => ({ id: 'dist2', name: 'New Dist' }) },
        ]),
      });
      mockOrderModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
      mockInventoryModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

      const result = await service.getDistributors('org1');

      expect(result[0]).toEqual(expect.objectContaining({
        orderFulfillment: 0,
        pendingOrders: 0,
        fillRate: 0,
      }));
    });
  });
});
