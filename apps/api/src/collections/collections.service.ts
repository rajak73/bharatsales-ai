import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { PaymentCollection, Outlet, Invoice } from '@bharatsales/shared-types';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel('Collection') private readonly collectionModel: Model<PaymentCollection>,
    @InjectModel('Outlet') private readonly outletModel: Model<Outlet>,
    @InjectModel('Invoice') private readonly invoiceModel: Model<Invoice>,
    @InjectConnection() private readonly connection: Connection
  ) {}

  async findAll(organizationId: string): Promise<PaymentCollection[]> {
    return this.collectionModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async create(organizationId: string, userId: string, data: Partial<PaymentCollection>): Promise<PaymentCollection> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    
    // Auto-settle cash payments on creation, else Pending
    let initialStatus = data.status || 'Pending';
    if (data.paymentMode === 'Cash' && !data.status) {
      initialStatus = 'Cleared';
    }

    const newCollection = new this.collectionModel({
      ...data,
      organizationId,
      collectedByUserId: userId,
      status: initialStatus,
      collectionDate: data.collectionDate || new Date().toISOString()
    });

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const saved = await newCollection.save({ session });

      // If cleared immediately (like cash), reduce outstanding balance
      if (saved.status === 'Cleared' && saved.amount > 0) {
        await this.outletModel.updateOne(
          { _id: saved.outletId },
          { $inc: { 'commercial.outstandingBalance': -saved.amount } },
          { session }
        );

        // Apply allocations to invoices
        if (saved.allocations && saved.allocations.length > 0) {
          for (const alloc of saved.allocations) {
            const invoice = await this.invoiceModel.findById(alloc.invoiceId).session(session);
            if (invoice) {
              invoice.paidAmount += alloc.amount;
              if (invoice.paidAmount >= invoice.totalAmount) {
                invoice.status = 'Paid';
              } else if (invoice.paidAmount > 0) {
                invoice.status = 'Partial';
              }
              await invoice.save({ session });
            }
          }
        }
      }

      await session.commitTransaction();
      return saved;
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

      const outlet = await this.outletModel.findById(collection.outletId).session(session);
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
            { _id: collection.outletId },
            { $inc: { 'commercial.outstandingBalance': balanceChange } },
            { session }
          );

          if (collection.allocations && collection.allocations.length > 0) {
            for (const alloc of collection.allocations) {
              const invoice = await this.invoiceModel.findById(alloc.invoiceId).session(session);
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

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const collection = await this.collectionModel.findOne({ _id: id, organizationId }).session(session).exec();
      if (!collection) throw new NotFoundException('Collection not found');
      
      // If we delete a cleared collection, we should reverse its impact
      if (collection.status === 'Cleared') {
        await this.outletModel.updateOne(
          { _id: collection.outletId },
          { $inc: { 'commercial.outstandingBalance': collection.amount } },
          { session }
        );

        if (collection.allocations && collection.allocations.length > 0) {
          for (const alloc of collection.allocations) {
            const invoice = await this.invoiceModel.findById(alloc.invoiceId).session(session);
            if (invoice) {
              invoice.paidAmount -= alloc.amount;
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
