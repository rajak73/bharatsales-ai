import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { PaymentCollection, Outlet, Invoice, Order } from '@bharatsales/shared-types';
import { HierarchyService } from '../hierarchy/hierarchy.service';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel('Collection') private readonly collectionModel: Model<PaymentCollection>,
    @InjectModel('Outlet') private readonly outletModel: Model<Outlet>,
    @InjectModel('Invoice') private readonly invoiceModel: Model<Invoice>,
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectConnection() private readonly connection: Connection,
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

      // Auto-settle cash payments on creation; everything else defaults to Pending.
      let status = data.status || 'Pending';
      if (data.paymentMode === 'Cash' && !data.status) {
        status = 'Cleared';
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

      // Allocate the payment to invoices: manual allocations if provided,
      // else a single named invoice, else FIFO across the outlet's unpaid invoices.
      let unallocatedAmount = data.amount || 0;
      const actualAllocations: { invoiceId: string; amount: number }[] = [];

      if (data.allocations && data.allocations.length > 0) {
        const totalManual = data.allocations.reduce((sum: number, a: any) => sum + a.amount, 0);
        if (totalManual > unallocatedAmount) {
          throw new BadRequestException(`Manual allocations total (${totalManual}) exceeds collection amount (${unallocatedAmount})`);
        }
        for (const alloc of data.allocations) {
          const invoice = await this.invoiceModel.findOne({ _id: alloc.invoiceId, organizationId, outletId: data.outletId }).session(session);
          if (!invoice) throw new BadRequestException(`Invoice ${alloc.invoiceId} not found or does not belong to outlet`);
          const remainingAmount = invoice.totalAmount - (invoice.paidAmount || 0);
          if (alloc.amount > remainingAmount) {
            throw new BadRequestException(`Allocation ${alloc.amount} exceeds remaining balance ${remainingAmount} of invoice ${alloc.invoiceId}`);
          }
          invoice.paidAmount = (invoice.paidAmount || 0) + alloc.amount;
          invoice.status = invoice.paidAmount >= invoice.totalAmount ? 'Paid' : (invoice.paidAmount > 0 ? 'Partial' : 'Unpaid');
          await invoice.save({ session });
          unallocatedAmount -= alloc.amount;
          actualAllocations.push({ invoiceId: invoice._id.toString(), amount: alloc.amount });
        }
      } else if (data.invoiceId) {
        const invoice = await this.invoiceModel.findOne({ _id: data.invoiceId, organizationId, outletId: data.outletId }).session(session);
        if (!invoice) {
          throw new BadRequestException('Invoice not found or does not belong to the specified outlet');
        }
        const remainingAmount = invoice.totalAmount - (invoice.paidAmount || 0);
        if (unallocatedAmount > remainingAmount) {
          throw new BadRequestException(`Collection amount (${unallocatedAmount}) exceeds the remaining invoice balance (${remainingAmount})`);
        }
        invoice.paidAmount = (invoice.paidAmount || 0) + unallocatedAmount;
        invoice.status = invoice.paidAmount >= invoice.totalAmount ? 'Paid' : (invoice.paidAmount > 0 ? 'Partial' : 'Unpaid');
        await invoice.save({ session });
        actualAllocations.push({ invoiceId: invoice._id.toString(), amount: unallocatedAmount });
        unallocatedAmount = 0;
      } else {
        const unpaidInvoices = await this.invoiceModel.find({
          organizationId, outletId: data.outletId, status: { $in: ['Unpaid', 'Partial'] }
        }).sort({ createdAt: 1 }).session(session);
        for (const invoice of unpaidInvoices) {
          if (unallocatedAmount <= 0) break;
          const remainingAmount = invoice.totalAmount - (invoice.paidAmount || 0);
          const alloc = Math.min(unallocatedAmount, remainingAmount);
          invoice.paidAmount = (invoice.paidAmount || 0) + alloc;
          unallocatedAmount -= alloc;
          invoice.status = invoice.paidAmount >= invoice.totalAmount ? 'Paid' : (invoice.paidAmount > 0 ? 'Partial' : 'Unpaid');
          await invoice.save({ session });
          actualAllocations.push({ invoiceId: invoice._id.toString(), amount: alloc });
        }
      }

      collection.allocations = actualAllocations;
      await collection.save({ session });

      if (status === 'Cleared' && (data.amount || 0) > 0) {
        // Atomic $inc — avoids re-validating the whole Outlet document (which
        // may predate later-added required fields) just to adjust a balance.
        await this.outletModel.updateOne(
          { _id: data.outletId, organizationId },
          [{ $set: { 'commercial.outstandingBalance': { $max: [0, { $subtract: ['$commercial.outstandingBalance', data.amount || 0] }] } } }],
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

  async updateStatus(organizationId: string, id: string, status: PaymentCollection['status'], actorId?: string): Promise<PaymentCollection> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const collection = await this.collectionModel.findOne({ _id: id, organizationId }).session(session).exec();
      if (!collection) {
        throw new NotFoundException(`Collection with ID ${id} not found`);
      }

      if (collection.status === status) {
        await session.abortTransaction();
        session.endSession();
        return collection;
      }

      // Handle state transitions for Outlet outstanding balance
      const wasSettled = collection.status === 'Cleared';
      const isNowSettled = status === 'Cleared';
      const isNowReversed = status === 'Bounced' || status === 'Reversed';

      collection.status = status;
      const updated = await collection.save({ session });

      const outlet = await this.outletModel.findOne({ _id: collection.outletId, organizationId }).session(session);
      if (outlet) {
        let balanceChange = 0;

        if (!wasSettled && isNowSettled) {
          // Pending -> Cleared (Decrease Balance)
          balanceChange = -collection.amount;
        } else if (wasSettled && isNowReversed) {
          // Cleared -> Reversed/Bounced (Increase Balance)
          balanceChange = collection.amount;
        }

        if (balanceChange !== 0) {
          await this.outletModel.updateOne(
            { _id: collection.outletId, organizationId },
            { $inc: { 'commercial.outstandingBalance': balanceChange } },
            { session }
          );

          if (collection.allocations && collection.allocations.length > 0) {
            for (const alloc of collection.allocations) {
              const invoice = await this.invoiceModel.findOne({ _id: alloc.invoiceId, organizationId }).session(session);
              if (invoice) {
                // If it was cleared, add amount. If reversed, subtract.
                const allocChange = (!wasSettled && isNowSettled) ? alloc.amount : (wasSettled && isNowReversed ? -alloc.amount : 0);
                
                if (allocChange !== 0) {
                  invoice.paidAmount += allocChange;
                  // Ensure paidAmount doesn't go below 0
                  if (invoice.paidAmount < 0) invoice.paidAmount = 0;
                  
                  if (invoice.paidAmount >= invoice.totalAmount) {
                    invoice.status = 'Paid';
                  } else if (invoice.paidAmount > 0) {
                    invoice.status = 'Partial';
                  } else {
                    invoice.status = 'Unpaid';
                  }
                  await invoice.save({ session });
                }
              }
            }
          }
        }
      }

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
    delete data.organizationId;
    delete data._id;
    const collection = await this.collectionModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
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
