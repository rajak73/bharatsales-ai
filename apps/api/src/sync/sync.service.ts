import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Order, Visit, PaymentCollection, Product, PriceList, Outlet } from '../schemas';

@Injectable()
export class SyncService {
  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Visit') private visitModel: Model<Visit>,
    @InjectModel('Collection') private collectionModel: Model<PaymentCollection>,
    @InjectModel('Product') private productModel: Model<Product>,
    @InjectModel('PriceList') private priceListModel: Model<PriceList>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>
  ) {}

  async pull(organizationId: string, lastSyncTimestamp?: string) {
    const query = lastSyncTimestamp ? { updatedAt: { $gt: new Date(lastSyncTimestamp) } } : {};
    const orgQuery = { organizationId, ...query };

    const [products, prices, outlets] = await Promise.all([
      this.productModel.find(orgQuery).exec(),
      this.priceListModel.find(orgQuery).exec(),
      this.outletModel.find(orgQuery).exec()
    ]);

    return {
      products,
      prices,
      outlets,
      timestamp: new Date().toISOString()
    };
  }

  async push(organizationId: string, userId: string, payload: { orders?: any[], visits?: any[], collections?: any[] }) {
    const conflicts = [];
    const connection = this.orderModel.db;
    const session = await connection.startSession();
    
    session.startTransaction();
    try {
      if (payload.orders && payload.orders.length > 0) {
        for (const order of payload.orders) {
          // If order exists and is newer on server, conflict
          if (order._id) {
            const existing = await this.orderModel.findById(order._id).session(session);
            if (existing && (existing as any).updatedAt > new Date(order.updatedAt)) {
              conflicts.push({ type: 'Order', id: order._id, reason: 'Newer version exists on server' });
              continue;
            }
          }
          await this.orderModel.findOneAndUpdate(
            { _id: order._id || new (this.orderModel.db as any).base.Types.ObjectId() },
            { ...(() => { delete order.organizationId; delete order._id; delete order.createdAt; delete order.updatedAt; return order; })(), organizationId, salesRepId: userId },
            { upsert: true, new: true, session }
          );
        }
      }

      if (payload.visits && payload.visits.length > 0) {
        for (const visit of payload.visits) {
           await this.visitModel.findOneAndUpdate(
            { _id: visit._id || new (this.visitModel.db as any).base.Types.ObjectId() },
            { ...(() => { delete visit.organizationId; delete visit._id; delete visit.createdAt; delete visit.updatedAt; return visit; })(), organizationId, user: userId },
            { upsert: true, new: true, session }
          );
        }
      }

      if (payload.collections && payload.collections.length > 0) {
        for (const collection of payload.collections) {
           await this.collectionModel.findOneAndUpdate(
            { _id: collection._id || new (this.collectionModel.db as any).base.Types.ObjectId() },
            { ...(() => { delete collection.organizationId; delete collection._id; delete collection.createdAt; delete collection.updatedAt; return collection; })(), organizationId, collectedBy: userId },
            { upsert: true, new: true, session }
          );
        }
      }

      await session.commitTransaction();
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException('Sync failed: ' + error.message);
    } finally {
      session.endSession();
    }

    return {
      success: true,
      conflicts,
      timestamp: new Date().toISOString()
    };
  }
}
