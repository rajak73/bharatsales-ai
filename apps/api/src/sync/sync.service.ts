import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Order, Visit, Product, PriceList, Outlet } from '../schemas';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class SyncService {
  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Visit') private visitModel: Model<Visit>,
    @InjectModel('Product') private productModel: Model<Product>,
    @InjectModel('PriceList') private priceListModel: Model<PriceList>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
    private ordersService: OrdersService
  ) {}

  async pull(organizationId: string, userId: string, lastSyncTimestamp?: string) {
    const query = lastSyncTimestamp ? { updatedAt: { $gt: new Date(lastSyncTimestamp) } } : {};
    const orgQuery = { organizationId, ...query };

    const [products, prices, outlets, schemes, targets, beats, orders, visits] = await Promise.all([
      this.productModel.find(orgQuery).exec(),
      this.priceListModel.find(orgQuery).exec(),
      this.outletModel.find(orgQuery).exec(),
      this.orderModel.db.model('Scheme').find(orgQuery).exec(),
      this.orderModel.db.model('Target').find({ ...orgQuery, entityType: 'User', entityId: userId }).exec(),
      this.orderModel.db.model('BeatSchedule').find({ ...orgQuery, user: userId }).populate('beat').exec(),
      this.orderModel.find({ ...orgQuery, createdByUserId: userId }).exec(),
      this.visitModel.find({ ...orgQuery, user: userId }).exec()
    ]);

    return {
      products,
      prices,
      outlets,
      schemes,
      targets,
      beats,
      orders,
      visits,
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
          // Route through OrdersService.create() instead of direct DB write
          // This ensures MOQ, Credit limits, and FEFO inventory rules apply
          try {
             // We pass idempotencyKey to prevent duplicate syncs
             order.idempotencyKey = order.idempotencyKey || `sync-${order._id || Date.now()}`;
             await this.ordersService.create(organizationId, userId, order);
          } catch (e: any) {
             conflicts.push({ type: 'Order', id: order._id || 'new', reason: e.message });
          }
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
        // Feature removed per BRD
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
