import { CollectionsService } from './collections.service';

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
    service = new CollectionsService(
      mockCollectionModel as any,
      mockOutletModel as any,
      mockInvoiceModel as any,
      mockOrderModel as any,
      mockConnection as any,
      { getDescendantTerritoryIds: jest.fn().mockResolvedValue([]) } as any,
    );
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

  describe('Pending (cheque) collections', () => {
    const makeInvoice = (paidAmount = 0) => ({
      _id: 'inv1', paidAmount, totalAmount: 1000, status: paidAmount ? 'Partial' : 'Unpaid',
      save: jest.fn().mockResolvedValue(true),
    });

    beforeEach(() => {
      // A model mock whose instances actually carry their fields, so the
      // returned collection's status/allocations can be asserted.
      (service as any).collectionModel = function (this: any, data: any) {
        Object.assign(this, data);
        this.save = jest.fn().mockResolvedValue(this);
      };
      Object.assign((service as any).collectionModel, mockCollectionModel);
      mockOutletModel.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue({ _id: 'outlet1' }) } as any);
      mockOutletModel.updateOne.mockResolvedValue({});
    });

    it('does not touch invoices or outstanding when a Cheque is recorded, and ignores a client-supplied Cleared status', async () => {
      const invoice = makeInvoice();
      mockCollectionModel.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) } as any);
      mockInvoiceModel.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(invoice) } as any);

      const created: any = await service.create('org1', 'user1', {
        outletId: 'outlet1', paymentMode: 'Cheque', amount: 400, invoiceId: 'inv1',
        referenceNumber: 'CHQ-1', status: 'Cleared',
      } as any);

      expect(created.status).toBe('Pending');
      expect(created.allocations).toEqual([]);
      expect(invoice.paidAmount).toBe(0);
      expect(invoice.save).not.toHaveBeenCalled();
      expect(mockOutletModel.updateOne).not.toHaveBeenCalled();
    });

    it('still validates the target invoice of a Cheque at entry time', async () => {
      mockCollectionModel.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) } as any);
      mockInvoiceModel.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(makeInvoice(900)) } as any);

      await expect(service.create('org1', 'user1', {
        outletId: 'outlet1', paymentMode: 'Cheque', amount: 400, invoiceId: 'inv1', referenceNumber: 'CHQ-2',
      } as any)).rejects.toThrow('exceeds the remaining invoice balance');
    });

    it('treats Cash as Cleared even when the client sends status Pending', async () => {
      const invoice = makeInvoice();
      mockInvoiceModel.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(invoice) } as any);

      const created: any = await service.create('org1', 'user1', {
        outletId: 'outlet1', paymentMode: 'Cash', amount: 300, invoiceId: 'inv1', status: 'Pending',
      } as any);

      expect(created.status).toBe('Cleared');
      expect(invoice.paidAmount).toBe(300);
      expect(mockOutletModel.updateOne).toHaveBeenCalled();
    });

    it('allocates to the invoice and reduces outstanding when Pending -> Cleared', async () => {
      const invoice = makeInvoice();
      const collection: any = {
        _id: 'col1', status: 'Pending', amount: 400, outletId: 'outlet1', invoiceId: 'inv1', allocations: [],
        save: jest.fn().mockImplementation(function (this: any) { return Promise.resolve(this); }),
      };
      mockCollectionModel.findOne.mockReturnValue({ session: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(collection) }) } as any);
      mockInvoiceModel.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(invoice) } as any);

      await service.updateStatus('org1', 'col1', 'Cleared');

      expect(collection.status).toBe('Cleared');
      expect(invoice.paidAmount).toBe(400);
      expect(invoice.status).toBe('Partial');
      expect(collection.allocations).toEqual([{ invoiceId: 'inv1', amount: 400 }]);
      expect(mockOutletModel.updateOne).toHaveBeenCalledWith(
        { _id: 'outlet1', organizationId: 'org1' },
        { $inc: { 'commercial.outstandingBalance': -400 } },
        expect.anything(),
      );
    });

    it('leaves invoices unpaid and outstanding untouched when Pending -> Bounced', async () => {
      const invoice = makeInvoice();
      const collection: any = {
        _id: 'col1', status: 'Pending', amount: 400, outletId: 'outlet1', invoiceId: 'inv1', allocations: [],
        save: jest.fn().mockResolvedValue(true),
      };
      mockCollectionModel.findOne.mockReturnValue({ session: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(collection) }) } as any);
      mockInvoiceModel.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(invoice) } as any);

      await service.updateStatus('org1', 'col1', 'Bounced');

      expect(collection.status).toBe('Bounced');
      expect(invoice.paidAmount).toBe(0);
      expect(invoice.save).not.toHaveBeenCalled();
      expect(mockOutletModel.updateOne).not.toHaveBeenCalled();
    });

    it('refuses to reverse a Pending collection (nothing was deducted)', async () => {
      mockCollectionModel.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue({ status: 'Pending', amount: 400, save: jest.fn() })
      } as any);

      await expect(service.reverseCollection('org1', 'col1', 'user1')).rejects.toThrow('Only a Cleared collection can be reversed');
      expect(mockOutletModel.updateOne).not.toHaveBeenCalled();
    });

    it('refuses any status change on a reversal entry (would double-count the reversal)', async () => {
      const reversal: any = {
        _id: 'rev1', status: 'Cleared', amount: -400, receiptNumber: 'REV-R1', outletId: 'outlet1', allocations: [], save: jest.fn(),
      };
      mockCollectionModel.findOne.mockReturnValue({ session: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(reversal) }) } as any);

      await expect(service.updateStatus('org1', 'rev1', 'Bounced')).rejects.toThrow('Reversal and credit-note entries cannot change status');
      expect(mockOutletModel.updateOne).not.toHaveBeenCalled();
      expect(reversal.save).not.toHaveBeenCalled();
    });

    it('refuses Cleared -> Pending', async () => {
      const collection: any = { _id: 'col1', status: 'Cleared', amount: 400, outletId: 'outlet1', allocations: [], save: jest.fn() };
      mockCollectionModel.findOne.mockReturnValue({ session: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(collection) }) } as any);

      await expect(service.updateStatus('org1', 'col1', 'Pending')).rejects.toThrow('Cannot change collection status');
    });
  });

  describe('update (PUT)', () => {
    it('only $sets whitelisted non-financial fields', async () => {
      mockCollectionModel.findOne.mockResolvedValue(null);
      mockCollectionModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'col1' }) });

      await service.update('org1', 'col1', { referenceNumber: 'UTR-9', amount: 1, status: 'Cleared', allocations: [], outletId: 'x' });

      expect(mockCollectionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'col1', organizationId: 'org1' },
        { $set: { referenceNumber: 'UTR-9' } },
        { new: true },
      );
    });
  });
});
