import { BadRequestException } from '../core/http-errors';
import { Model, ClientSession } from 'mongoose';
import { Order, Visit, PaymentCollection, Product, PriceList, Outlet, Inventory } from '../schemas';
import { OrdersService } from '../orders/orders.service';
import { InventoryService } from '../inventory/inventory.service';
import type { HierarchyService } from '../hierarchy/hierarchy.service';
import type { CollectionsService } from '../collections/collections.service';
import { RBAC, Action, Resource, type Role } from '@bharatsales/permissions';

// The authenticated caller (req.user) — only the fields the pull scoping reads.
export interface SyncActor {
  sub?: string;
  role: string;
  territoryIds?: string[];
  distributorId?: string;
}

export class SyncService {
  constructor(
    private orderModel: Model<Order>,
    private visitModel: Model<Visit>,
    private collectionModel: Model<PaymentCollection>,
    private productModel: Model<Product>,
    private priceListModel: Model<PriceList>,
    private outletModel: Model<Outlet>,
    private ordersService: OrdersService,
    private inventoryService: InventoryService,
    // Optional so existing wiring/specs keep working; needed for the
    // territory-scoped outlet pull of non-admin users.
    private hierarchyService?: HierarchyService,
    // Offline collections are recorded through CollectionsService.create
    // (outlet check, duplicate-reference check, status from paymentMode,
    // server-side invoice allocation).
    private collectionsService?: CollectionsService,
  ) {}

  async pull(organizationId: string, userId: string, lastSyncTimestamp?: string, user?: SyncActor) {
    const query = lastSyncTimestamp ? { updatedAt: { $gt: new Date(lastSyncTimestamp) } } : {};
    const orgQuery = { organizationId, ...query };

    // Per-role scoping (same rules as /outlets, /collections and /inventory):
    // a Sales Representative only receives outlets in their territories/beats,
    // only their own collections, and no inventory unless their role can read
    // it; a Distributor only receives data tied to their own distributorId.
    const role = user?.role;
    const isAdmin = !user || ['Super Admin', 'Organization Admin'].includes(role as string);
    const isDistributor = role === 'Distributor';
    const canReadInventory = !user || RBAC.can(role as Role, Action.Read, Resource.Inventory);

    const [products, prices, outlets, collections, inventory, schemes, targets, beats, orders, visits] = await Promise.all([
      this.productModel.find(orgQuery).exec(),
      this.priceListModel.find(orgQuery).exec(),
      this.pullOutlets(organizationId, userId, orgQuery, user, isAdmin, isDistributor),
      this.pullCollections(organizationId, userId, query, user, isAdmin, isDistributor),
      canReadInventory ? this.inventoryService.getInventory(organizationId, user) : Promise.resolve([]),
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

  private async pullOutlets(organizationId: string, userId: string, orgQuery: Record<string, any>, user: SyncActor | undefined, isAdmin: boolean, isDistributor: boolean) {
    if (isAdmin) {
      return this.outletModel.find(orgQuery).exec();
    }
    if (isDistributor) {
      return this.outletModel.find({ ...orgQuery, 'commercial.assignedDistributorId': user?.distributorId || '__none__' }).exec();
    }

    // Same territory rule OutletsService.findAllByOrgId applies to non-admins,
    // widened with the outlets on beats assigned to this user.
    const scope: any[] = [];
    const territoryIds: string[] = user?.territoryIds || [];
    if (territoryIds.length > 0) {
      const descendantIds = this.hierarchyService
        ? await this.hierarchyService.getDescendantTerritoryIds(organizationId, territoryIds)
        : territoryIds;
      scope.push(
        { territoryId: { $in: descendantIds } },
        { territoryId: { $exists: false } },
        { territoryId: null },
      );
    }
    const beatIds = await this.orderModel.db.model('BeatSchedule').distinct('beat', { organizationId, user: userId });
    if (beatIds.length > 0) {
      const beatOutletIds = await this.orderModel.db.model('Beat').distinct('outlets', { organizationId, _id: { $in: beatIds } });
      if (beatOutletIds.length > 0) scope.push({ _id: { $in: beatOutletIds } });
    }
    if (scope.length === 0) return [];
    return this.outletModel.find({ ...orgQuery, $or: scope }).exec();
  }

  private async pullCollections(organizationId: string, userId: string, query: Record<string, any>, user: SyncActor | undefined, isAdmin: boolean, isDistributor: boolean) {
    const base: any = { organizationId, ...query };
    if (isAdmin) {
      return this.collectionModel.find(base).exec();
    }
    if (isDistributor) {
      // Mirrors CollectionsService.findAll: a distributor's outlet-set is
      // derived from the orders routed to them.
      const outletIds = await this.orderModel.distinct('outletId', {
        organizationId,
        assignedDistributorId: user?.distributorId || '__none__',
      });
      return this.collectionModel.find({ ...base, outletId: { $in: outletIds } }).exec();
    }
    return this.collectionModel.find({ ...base, collectedByUserId: userId }).exec();
  }

  async push(organizationId: string, userId: string, payload: { orders?: any[], visits?: any[], collections?: any[] }, user?: SyncActor) {
    const conflicts = [];
    const connection = this.orderModel.db;
    const session = await connection.startSession();
    
    session.startTransaction();
    try {
      if (payload.orders && payload.orders.length > 0) {
        for (const order of payload.orders) {
          // If order exists and is newer on server, conflict
          if (order._id) {
            const existing = await this.orderModel.findOne({ _id: String(order._id), organizationId }).session(session);
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
          const existing = await this.visitModel.findOne({ organizationId, idempotencyKey: String(visit.idempotencyKey) }).session(session);
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
        // POST /sync/push only needs Visits:Create; recording money needs the
        // same Collections:Create that POST /collections requires.
        const canCollect = !!user && RBAC.can(user.role as Role, Action.Create, Resource.Collections);
        for (const collection of payload.collections) {
          const id = collection._id || 'new';
          if (!canCollect || !this.collectionsService) {
            conflicts.push({ type: 'Collection', id, reason: 'Not permitted to record collections' });
            continue;
          }
          if (!collection.idempotencyKey) {
            conflicts.push({ type: 'Collection', id, reason: 'idempotencyKey is required' });
            continue;
          }
          const data = { ...collection };
          delete data.organizationId;
          delete data._id;
          delete data.createdAt;
          delete data.updatedAt;
          delete data.allocations;
          delete data.status;
          delete data.collectedByUserId;
          try {
            // Idempotent on idempotencyKey; runs in its own transaction.
            await this.collectionsService.create(organizationId, userId, data);
          } catch (e: any) {
            conflicts.push({ type: 'Collection', id, reason: e.message });
          }
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
