import { Model, Connection, ClientSession } from 'mongoose';
import { PaymentCollection, Outlet, Invoice, Order } from '@bharatsales/shared-types';
import { NotFoundException, BadRequestException } from '../core/http-errors';
import { HierarchyService } from '../hierarchy/hierarchy.service';

type Allocation = { invoiceId: string; amount: number };

// Payment modes whose money is in hand the moment the collection is recorded.
// Everything else (Cheque, Bank Transfer) has to be verified/cleared first,
// and must not touch invoices or the outlet's outstanding until it is.
const IMMEDIATELY_CLEARED_MODES = ['Cash', 'UPI'];

// Fields the free-form PUT /collections/:id may change. Amount, status,
// outlet and allocations are financial state and only move through
// create / PATCH :id/status / POST :id/reverse.
const EDITABLE_FIELDS = ['referenceNumber', 'notes'] as const;

export class CollectionsService {
  constructor(
    private readonly collectionModel: Model<PaymentCollection>,
    private readonly outletModel: Model<Outlet>,
    private readonly invoiceModel: Model<Invoice>,
    private readonly orderModel: Model<Order>,
    private readonly connection: Connection,
    private readonly hierarchyService: HierarchyService
  ) {}

  async findAll(organizationId: string, user?: any): Promise<PaymentCollection[]> {
    const query: any = { organizationId };

    if (user && user.role === 'Distributor') {
      // Collections/Invoices have no direct distributorId — derive the
      // distributor's outlet-set via the orders routed to them.
      const distributorOrders = await this.orderModel.find({
        organizationId,
        assignedDistributorId: user.distributorId || '__none__'
      }).select('outletId').exec();
      const distributorOutletIds = [...new Set(distributorOrders.map(o => o.outletId))];
      query.outletId = { $in: distributorOutletIds };
    } else if (user && !['Super Admin', 'Organization Admin'].includes(user.role)) {
      if (!user.territoryIds || user.territoryIds.length === 0) {
        return [];
      }
      const descendantIds = await this.hierarchyService.getDescendantTerritoryIds(organizationId, user.territoryIds);
      const accessibleOutlets = await this.outletModel.find({
        organizationId,
        territoryId: { $in: descendantIds }
      }).select('_id').exec();
      const accessibleOutletIds = accessibleOutlets.map(o => o._id.toString());
      query.outletId = { $in: accessibleOutletIds };
    }

    return this.collectionModel.find(query).sort({ createdAt: -1 }).exec();
  }

  private static invoiceStatusFor(invoice: any): 'Paid' | 'Partial' | 'Unpaid' {
    return invoice.paidAmount >= invoice.totalAmount ? 'Paid' : (invoice.paidAmount > 0 ? 'Partial' : 'Unpaid');
  }

  /**
   * Allocates `amount` to the outlet's invoices: manual allocations if given,
   * else a single named invoice, else FIFO across unpaid invoices.
   *
   * - strict (payment being recorded): over-allocation / unknown invoices are
   *   400s, exactly as before.
   * - lenient (a cheque clearing days later): invoices may have been paid by
   *   something else in the meantime, so allocations are capped at each
   *   invoice's remaining balance instead of blocking the clearance; any
   *   remainder stays unallocated (an advance on the outlet).
   * - persist=false only validates (used for Pending payments at creation).
   */
  private async allocateToInvoices(
    organizationId: string,
    outletId: string,
    amount: number,
    request: { allocations?: Allocation[] | null; invoiceId?: string | null },
    session: ClientSession,
    opts: { strict: boolean; persist: boolean }
  ): Promise<Allocation[]> {
    let unallocatedAmount = amount || 0;
    const actualAllocations: Allocation[] = [];

    const apply = async (invoice: any, alloc: number) => {
      if (alloc <= 0) return;
      if (opts.persist) {
        invoice.paidAmount = (invoice.paidAmount || 0) + alloc;
        invoice.status = CollectionsService.invoiceStatusFor(invoice);
        await invoice.save({ session });
      }
      unallocatedAmount -= alloc;
      actualAllocations.push({ invoiceId: invoice._id.toString(), amount: alloc });
    };

    if (request.allocations && request.allocations.length > 0) {
      const totalManual = request.allocations.reduce((sum: number, a: any) => sum + a.amount, 0);
      if (totalManual > unallocatedAmount) {
        throw new BadRequestException(`Manual allocations total (${totalManual}) exceeds collection amount (${unallocatedAmount})`);
      }
      for (const alloc of request.allocations) {
        const invoice = await this.invoiceModel.findOne({ _id: alloc.invoiceId, organizationId, outletId }).session(session);
        if (!invoice) {
          if (!opts.strict) continue;
          throw new BadRequestException(`Invoice ${alloc.invoiceId} not found or does not belong to outlet`);
        }
        const remainingAmount = invoice.totalAmount - (invoice.paidAmount || 0);
        if (alloc.amount > remainingAmount && opts.strict) {
          throw new BadRequestException(`Allocation ${alloc.amount} exceeds remaining balance ${remainingAmount} of invoice ${alloc.invoiceId}`);
        }
        await apply(invoice, Math.min(alloc.amount, remainingAmount));
      }
    } else if (request.invoiceId) {
      const invoice = await this.invoiceModel.findOne({ _id: request.invoiceId, organizationId, outletId }).session(session);
      if (!invoice) {
        if (opts.strict) {
          throw new BadRequestException('Invoice not found or does not belong to the specified outlet');
        }
      } else {
        const remainingAmount = invoice.totalAmount - (invoice.paidAmount || 0);
        if (unallocatedAmount > remainingAmount && opts.strict) {
          throw new BadRequestException(`Collection amount (${unallocatedAmount}) exceeds the remaining invoice balance (${remainingAmount})`);
        }
        await apply(invoice, Math.min(unallocatedAmount, remainingAmount));
      }
    } else if (opts.persist) {
      // FIFO can't fail validation, so there is nothing to check in a dry run.
      const unpaidInvoices = await this.invoiceModel.find({
        organizationId, outletId, status: { $in: ['Unpaid', 'Partial'] }
      }).sort({ createdAt: 1 }).session(session);
      for (const invoice of unpaidInvoices) {
        if (unallocatedAmount <= 0) break;
        const remainingAmount = invoice.totalAmount - (invoice.paidAmount || 0);
        await apply(invoice, Math.min(unallocatedAmount, remainingAmount));
      }
    }

    return actualAllocations;
  }

  /** Takes previously-applied allocations back off their invoices. */
  private async unapplyAllocations(organizationId: string, allocations: Allocation[], session: ClientSession): Promise<void> {
    for (const alloc of allocations) {
      const invoice = await this.invoiceModel.findOne({ _id: alloc.invoiceId, organizationId }).session(session);
      if (!invoice) continue;
      invoice.paidAmount = (invoice.paidAmount || 0) - alloc.amount;
      if (invoice.paidAmount < 0) invoice.paidAmount = 0;
      invoice.status = CollectionsService.invoiceStatusFor(invoice);
      await invoice.save({ session });
    }
  }

  async create(organizationId: string, userId: string, data: Partial<PaymentCollection>): Promise<PaymentCollection> {
    if ((data as any).idempotencyKey) {
      const existing = await this.collectionModel.findOne({ organizationId, idempotencyKey: (data as any).idempotencyKey });
      if (existing) {
        return existing;
      }
    }

    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    delete (data as any).collectedByUserId;
    // Status is derived from the payment mode, never taken from the client:
    // a client-supplied 'Cleared' on a cheque would otherwise settle
    // invoices for money that may never arrive.
    delete (data as any).status;

    const status: PaymentCollection['status'] =
      IMMEDIATELY_CLEARED_MODES.includes(data.paymentMode as string) ? 'Cleared' : 'Pending';

    if (status === 'Pending' && data.allocations && data.allocations.length > 0) {
      throw new BadRequestException(
        `Manual allocations are only supported for payments that clear immediately (${IMMEDIATELY_CLEARED_MODES.join('/')}). ` +
        'Pass invoiceId instead; the payment is allocated when it is cleared.'
      );
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const outlet = await this.outletModel.findOne({ _id: data.outletId, organizationId }).session(session);
      if (!outlet) {
        throw new NotFoundException('Outlet not found');
      }

      if (data.paymentMode !== 'Cash' && data.referenceNumber) {
        const duplicate = await this.collectionModel.findOne({
          organizationId,
          referenceNumber: data.referenceNumber,
        }).session(session);
        if (duplicate) {
          throw new BadRequestException(`Duplicate payment reference detected: ${data.referenceNumber}`);
        }
      }

      const collection = new this.collectionModel({
        ...data,
        organizationId,
        collectedByUserId: userId,
        status,
        receiptNumber: data.receiptNumber || `REC-${Date.now()}`,
        collectionDate: data.collectionDate || new Date().toISOString()
      });
      await collection.save({ session });

      if (status === 'Cleared') {
        collection.allocations = await this.allocateToInvoices(
          organizationId, data.outletId as string, data.amount || 0,
          { allocations: data.allocations, invoiceId: data.invoiceId },
          session, { strict: true, persist: true }
        );
      } else {
        // Pending: validate the target invoice now so the user gets the error
        // at entry time, but don't touch paidAmount until it clears. An empty
        // allocations array is what marks a Pending collection as not yet
        // applied (see updateStatus).
        await this.allocateToInvoices(
          organizationId, data.outletId as string, data.amount || 0,
          { invoiceId: data.invoiceId },
          session, { strict: true, persist: false }
        );
        collection.allocations = [];
      }
      await collection.save({ session });

      if (status === 'Cleared' && (data.amount || 0) > 0) {
        // Atomic $inc — avoids re-validating the whole Outlet document (which
        // may predate later-added required fields) just to adjust a balance.
        // No zero floor: create, clear, bounce and reverse all move the
        // balance by exactly the collection amount, so the ledger stays
        // symmetric (an overpayment shows as a negative balance / advance,
        // and reversing it restores the true figure).
        await this.outletModel.updateOne(
          { _id: data.outletId, organizationId },
          { $inc: { 'commercial.outstandingBalance': -(data.amount || 0) } },
          { session }
        );
      }

      await session.commitTransaction();
      return collection;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateStatus(organizationId: string, id: string, status: PaymentCollection['status'], _actorId?: string): Promise<PaymentCollection> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const collection = await this.collectionModel.findOne({ _id: id, organizationId }).session(session).exec();
      if (!collection) {
        throw new NotFoundException(`Collection with ID ${id} not found`);
      }

      // Reversal rows (REV-*, negative amount) and system credit notes are
      // ledger entries, not payments: their status must never be changed, or
      // e.g. Bounced on a reversal would $inc the outstanding by the negative
      // amount and count the original reversal twice.
      if (
        collection.amount < 0 ||
        (collection as any).paymentMode === 'Credit Note' ||
        String(collection.receiptNumber || '').startsWith('REV-')
      ) {
        throw new BadRequestException('Reversal and credit-note entries cannot change status');
      }

      if (collection.status === status) {
        await session.abortTransaction();
        return collection;
      }

      const from = collection.status;
      // Allowed: Pending -> Cleared, Pending -> Bounced, Cleared -> Bounced.
      // Cleared -> Pending would leave the balance deducted and let a later
      // Pending -> Cleared deduct it again; a Bounced payment is final (a
      // re-presented cheque is a new collection).
      if (from === 'Bounced' || (from === 'Cleared' && status === 'Pending')) {
        throw new BadRequestException(`Cannot change collection status from ${from} to ${status}`);
      }

      const wasSettled = from === 'Cleared';
      const isNowSettled = status === 'Cleared';
      const isNowReversed = status === 'Bounced' || status === 'Reversed';
      // Collections created as Pending by older code had their allocations
      // applied to invoices at creation time; new Pending collections carry
      // an empty allocations array until they clear.
      const pendingAlreadyAllocated = from === 'Pending' && (collection.allocations?.length ?? 0) > 0;

      const outlet = await this.outletModel.findOne({ _id: collection.outletId, organizationId }).session(session);

      if (!wasSettled && isNowSettled) {
        // Pending -> Cleared: the money is real now. Allocate to invoices
        // (unless legacy data already did) and reduce outstanding.
        if (outlet) {
          if (!pendingAlreadyAllocated) {
            collection.allocations = await this.allocateToInvoices(
              organizationId, collection.outletId, collection.amount,
              { invoiceId: collection.invoiceId },
              session, { strict: false, persist: true }
            );
          }
          await this.outletModel.updateOne(
            { _id: collection.outletId, organizationId },
            { $inc: { 'commercial.outstandingBalance': -collection.amount } },
            { session }
          );
        }
      } else if (wasSettled && isNowReversed) {
        // Cleared -> Bounced: give back the outstanding and invoice payments.
        if (outlet) {
          await this.outletModel.updateOne(
            { _id: collection.outletId, organizationId },
            { $inc: { 'commercial.outstandingBalance': collection.amount } },
            { session }
          );
          await this.unapplyAllocations(organizationId, collection.allocations || [], session);
        }
      } else if (from === 'Pending' && isNowReversed) {
        // Pending -> Bounced: outstanding was never reduced. Only legacy
        // Pending rows had invoice allocations applied; undo those.
        if (pendingAlreadyAllocated) {
          await this.unapplyAllocations(organizationId, collection.allocations || [], session);
        }
      }

      collection.status = status;
      const updated = await collection.save({ session });

      await session.commitTransaction();
      return updated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async update(organizationId: string, id: string, data: any): Promise<PaymentCollection> {
    const update: Record<string, any> = {};
    for (const key of EDITABLE_FIELDS) {
      if (data && data[key] !== undefined) update[key] = data[key];
    }

    if (update.referenceNumber) {
      const duplicate = await this.collectionModel.findOne({
        organizationId,
        referenceNumber: update.referenceNumber,
        _id: { $ne: id },
      });
      if (duplicate && (duplicate as any).paymentMode !== 'Cash') {
        throw new BadRequestException(`Duplicate payment reference detected: ${update.referenceNumber}`);
      }
    }

    const collection = await this.collectionModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: update },
      { new: true }
    ).exec();
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async reverseCollection(organizationId: string, id: string, userId: string): Promise<PaymentCollection> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const original = await this.collectionModel.findOne({ _id: id, organizationId }).session(session);
      if (!original) {
        throw new NotFoundException('Collection not found');
      }

      if (original.status === 'Bounced' || original.amount < 0) {
        throw new BadRequestException('Collection is already reversed or is a reversal entry itself');
      }

      // Only a Cleared collection reduced the outstanding balance / paid
      // invoices, so only a Cleared one has anything to reverse. A Pending
      // cheque that bounces goes through PATCH :id/status { status: 'Bounced' }.
      if (original.status !== 'Cleared') {
        throw new BadRequestException(`Only a Cleared collection can be reversed (this one is ${original.status}); mark it Bounced instead`);
      }

      original.status = 'Bounced';
      await original.save({ session });

      const reversal = new this.collectionModel({
        organizationId,
        receiptNumber: `REV-${original.receiptNumber}`,
        invoiceId: original.invoiceId,
        outletId: original.outletId,
        collectedByUserId: userId,
        amount: -original.amount,
        paymentMode: original.paymentMode,
        referenceNumber: `REV-${original.referenceNumber || Date.now()}`,
        status: 'Cleared',
        collectionDate: new Date().toISOString()
      });

      await reversal.save({ session });

      await this.outletModel.updateOne(
        { _id: original.outletId, organizationId },
        { $inc: { 'commercial.outstandingBalance': original.amount } },
        { session }
      );

      if (original.allocations && original.allocations.length > 0) {
        for (const alloc of original.allocations) {
          const invoice = await this.invoiceModel.findOne({ _id: alloc.invoiceId, organizationId }).session(session);
          if (invoice) {
            invoice.paidAmount -= alloc.amount;
            if (invoice.paidAmount <= 0) {
              invoice.paidAmount = 0;
              invoice.status = 'Unpaid';
            } else {
              invoice.status = 'Partial';
            }
            await invoice.save({ session });
          }
        }
      } else if (original.invoiceId) {
        // Fallback for older data without allocations array
        const invoice = await this.invoiceModel.findOne({ _id: original.invoiceId, organizationId }).session(session);
        if (invoice) {
          invoice.paidAmount -= original.amount;
          if (invoice.paidAmount <= 0) {
            invoice.paidAmount = 0;
            invoice.status = 'Unpaid';
          } else {
            invoice.status = 'Partial';
          }
          await invoice.save({ session });
        }
      }

      await session.commitTransaction();
      return reversal;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const collection = await this.collectionModel.findOne({ _id: id, organizationId }).session(session).exec();
      if (!collection) throw new NotFoundException('Collection not found');

      if (collection.status === 'Cleared') {
        throw new BadRequestException('Cannot hard delete a Cleared collection. Use reversal entry instead to maintain immutable ledger compliance.');
      }

      // Legacy Pending rows had their allocations applied at creation;
      // don't leave those invoices marked paid by a payment that no longer exists.
      if (collection.status === 'Pending' && collection.allocations && collection.allocations.length > 0) {
        await this.unapplyAllocations(organizationId, collection.allocations, session);
      }

      await this.collectionModel.deleteOne({ _id: id, organizationId }).session(session).exec();

      await session.commitTransaction();
      return { deleted: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
