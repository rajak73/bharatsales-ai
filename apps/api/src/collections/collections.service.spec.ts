import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsService } from './collections.service';
import { getModelToken } from '@nestjs/mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('CollectionsService', () => {
  let service: CollectionsService;

  const mockCollectionModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockOutletModel = {
    findById: jest.fn(),
    updateOne: jest.fn(),
  };

  const mockInvoiceModel = {
    findById: jest.fn(),
  };

  const mockConnection = {
    startSession: jest.fn().mockResolvedValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        {
          provide: getModelToken('Collection'),
          useValue: mockCollectionModel,
        },
        {
          provide: getModelToken('Outlet'),
          useValue: mockOutletModel,
        },
        {
          provide: getModelToken('Invoice'),
          useValue: mockInvoiceModel,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    // override constructor
    (service as any).collectionModel = function(data: any) {
      this.save = jest.fn().mockResolvedValue(data);
    };
    Object.assign((service as any).collectionModel, mockCollectionModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create with invoice allocation', () => {
    it('should update invoice status and paidAmount', async () => {
      const mockInvoice = {
        paidAmount: 0,
        totalAmount: 1000,
        status: 'Unpaid',
        save: jest.fn().mockResolvedValue(true)
      };

      mockInvoiceModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockInvoice)
      } as any);

      await service.create('org1', 'user1', {
        paymentMode: 'Cash',
        amount: 500,
        allocations: [{ invoiceId: 'inv1', amount: 500 }]
      } as any);

      expect(mockInvoice.paidAmount).toBe(500);
      expect(mockInvoice.status).toBe('Partial');
      expect(mockInvoice.save).toHaveBeenCalled();
    });

    it('should set invoice status to Paid if fully paid', async () => {
      const mockInvoice = {
        paidAmount: 500,
        totalAmount: 1000,
        status: 'Partial',
        save: jest.fn().mockResolvedValue(true)
      };

      mockInvoiceModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockInvoice)
      } as any);

      await service.create('org1', 'user1', {
        paymentMode: 'Cash',
        amount: 500,
        allocations: [{ invoiceId: 'inv1', amount: 500 }]
      } as any);

      expect(mockInvoice.paidAmount).toBe(1000);
      expect(mockInvoice.status).toBe('Paid');
    });
  });
});
