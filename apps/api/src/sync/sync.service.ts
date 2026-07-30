import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Order, Visit, PaymentCollection, Product, PriceList, Outlet, Inventory } from '../schemas';
import { OrdersService } from '../orders/orders.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class SyncService {
  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Visit') private visitModel: Model<Visit>,
    @InjectModel('Collection') private collectionModel: Model<PaymentCollection>,
    @InjectModel('Product') private productModel: Model<Product>,
    @InjectModel('PriceList') private priceListModel: Model<PriceList>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
    private ordersService: OrdersService,
    private inventoryService: InventoryService
  ) {}

  async pull(organizationId: string, userId: string, lastSyncTimestamp?: string) {
    const query = lastSyncTimestamp ? { updatedAt: { $gt: new Date(lastSyncTimestamp) } } : {};
    const orgQuery = { organizationId, ...query };

    const [products, prices, outlets, collections, inventory, schemes, targets, beats, orders, visits] = await Promise.all([
      this.productModel.find(orgQuery).exec(),
      this.priceListModel.find(orgQuery).exec(),
      this.outletModel.find(orgQuery).exec(),
      this.collectionModel.find({ organizationId }).exec(),
      this.inventoryService.getInventory(organizationId),
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
      collections,
      inventory,
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
            const existing = await this.orderModel.findOne({ _id: order._id, organizationId }).session(session);
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
          if (!visit.idempotencyKey) {
            conflicts.push({ type: 'Visit', id: visit._id || 'new', reason: 'idempotencyKey is required' });
            continue;
          }
          const existing = await this.visitModel.findOne({ organizationId, idempotencyKey: visit.idempotencyKey }).session(session);
          if (existing) {
            continue; // Already synced — idempotent no-op
          }
          delete visit.organizationId;
          delete visit._id;
          delete visit.createdAt;
          delete visit.updatedAt;
          await new this.visitModel({ ...visit, organizationId, user: userId }).save({ session });
        }
      }

      if (payload.collections && payload.collections.length > 0) {
        for (const collection of payload.collections) {
          if (!collection.idempotencyKey) {
            conflicts.push({ type: 'Collection', id: collection._id || 'new', reason: 'idempotencyKey is required' });
            continue;
          }
          const existing = await this.collectionModel.findOne({ organizationId, idempotencyKey: collection.idempotencyKey }).session(session);
          if (existing) {
            continue; // Already synced — idempotent no-op
          }
          delete collection.organizationId;
          delete collection._id;
          delete collection.createdAt;
          delete collection.updatedAt;
          await new this.collectionModel({ ...collection, organizationId, collectedByUserId: userId }).save({ session });
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
