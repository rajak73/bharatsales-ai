import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsService } from './collections.service';
import { getModelToken } from '@nestjs/mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { HierarchyService } from '../hierarchy/hierarchy.service';

describe('CollectionsService', () => {
  let service: CollectionsService;

  const mockCollectionModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockOutletModel = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  };

  const mockInvoiceModel = {
    findOne: jest.fn(),
  };

  const mockOrderModel = {
    find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
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
          provide: getModelToken('Order'),
          useValue: mockOrderModel,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
        {
          provide: HierarchyService,
          useValue: { getDescendantTerritoryIds: jest.fn().mockResolvedValue([]) }
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
    const mockOutlet = {
      commercial: { outstandingBalance: 1000 },
      save: jest.fn().mockResolvedValue(true)
    };

    beforeEach(() => {
      mockOutletModel.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockOutlet)
      } as any);
    });

    it('should update invoice status and paidAmount', async () => {
      const mockInvoice = {
        _id: 'inv1',
        paidAmount: 0,
        totalAmount: 1000,
        status: 'Unpaid',
        save: jest.fn().mockResolvedValue(true)
      };

      mockInvoiceModel.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockInvoice)
      } as any);

      await service.create('org1', 'user1', {
        outletId: 'outlet1',
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
        _id: 'inv1',
        paidAmount: 500,
        totalAmount: 1000,
        status: 'Partial',
        save: jest.fn().mockResolvedValue(true)
      };

      mockInvoiceModel.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(mockInvoice)
      } as any);

      await service.create('org1', 'user1', {
        outletId: 'outlet1',
        paymentMode: 'Cash',
        amount: 500,
        allocations: [{ invoiceId: 'inv1', amount: 500 }]
      } as any);

      expect(mockInvoice.paidAmount).toBe(1000);
      expect(mockInvoice.status).toBe('Paid');
    });

    it('should reject a duplicate non-cash payment reference', async () => {
      mockCollectionModel.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue({ _id: 'existing' })
      } as any);

      await expect(service.create('org1', 'user1', {
        outletId: 'outlet1',
        paymentMode: 'UPI',
        amount: 500,
        referenceNumber: 'UPI-123'
      } as any)).rejects.toThrow('Duplicate payment reference detected');
    });
  });

  describe('reverseCollection', () => {
    it('should mark the original Bounced and create a negative-amount reversal entry', async () => {
      const original = {
        _id: 'col1',
        status: 'Cleared',
        amount: 500,
        receiptNumber: 'REC-1',
        outletId: 'outlet1',
        paymentMode: 'Cash',
        allocations: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockCollectionModel.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue(original)
      } as any);
      mockOutletModel.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue({ commercial: { outstandingBalance: 0 }, save: jest.fn().mockResolvedValue(true) })
      } as any);

      await service.reverseCollection('org1', 'col1', 'user1');

      expect(original.status).toBe('Bounced');
      expect(original.save).toHaveBeenCalled();
    });

    it('should reject reversing an already-reversed collection', async () => {
      mockCollectionModel.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue({ status: 'Bounced', amount: 500 })
      } as any);

      await expect(service.reverseCollection('org1', 'col1', 'user1')).rejects.toThrow('already reversed');
    });
  });
});
