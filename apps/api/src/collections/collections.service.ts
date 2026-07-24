import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { PaymentCollection, Outlet } from '@bharatsales/shared-types';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel('Collection') private readonly collectionModel: Model<PaymentCollection>,
    @InjectModel('Outlet') private readonly outletModel: Model<Outlet>,
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
