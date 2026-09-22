import Dexie, { type EntityTable } from 'dexie';
import { getCurrentUserId } from '../sync/ownership';
import type { Outlet, Product, Order, Scheme, Distributor, Invoice, PaymentCollection, Beat, BeatSchedule } from '@bharatsales/shared-types';

export interface SyncQueueItem {
  id?: number;
  action: 'CREATE_ORDER' | 'UPDATE_OUTLET' | 'CREATE_PAYMENT' | 'CREATE_LOCATION_PING' | 'CREATE_VISIT' | 'UPDATE_VISIT' | 'CLOCK_IN' | 'CLOCK_OUT';
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'COMPLETED';
  createdAt: number;
  error?: string;
  /** Failed delivery attempts so far (transient failures only). */
  attempts?: number;
  /** Epoch ms before which a backed-off PENDING item must not be retried. */
  nextAttemptAt?: number;
  /**
   * Id of the user who queued it (stamped automatically on add). Only that
   * user's session sends it; undefined = queued before ownership tracking.
   */
  userId?: string;
}

export class BharatSalesDatabase extends Dexie {
  outlets!: EntityTable<Outlet, 'id'>;
  products!: EntityTable<Product, 'id'>;
  orders!: EntityTable<Order, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  schemes!: EntityTable<Scheme, 'id'>;
  distributors!: EntityTable<Distributor, 'id'>;
  invoices!: EntityTable<Invoice, 'id'>;
  collections!: EntityTable<PaymentCollection, 'id'>;
  beats!: EntityTable<Beat, 'id'>;
  beatSchedules!: EntityTable<BeatSchedule, 'id'>;

  constructor() {
    super('BharatSalesDB');
    
    // Initial tables for v1
    this.version(1).stores({
      outlets: 'id, name, type, routeId',
      products: 'id, name, category, sku',
      orders: 'id, outletId, status, createdAt',
      syncQueue: 'id, type, status, priority, createdAt'
    });

    // Added schemes and distributors in v2
    this.version(2).stores({
      schemes: 'id, type, startDate, endDate',
      distributors: 'id, name, state'
    });

    // Added invoices and collections in v3
    this.version(3).stores({
      invoices: 'id, invoiceNumber, outletId, status',
      collections: 'id, receiptNumber, outletId, status'
    });

    // Added beats and beat schedules for offline routing in v4
    this.version(4).stores({
      beats: 'id, name, status',
      beatSchedules: 'id, date'
    });

    // v5: retry/backoff for the sync queue. Rows marked FAILED before this
    // version were failed on ANY error (including simply being offline) and
    // were never retried — give them one more classified run.
    this.version(5).stores({}).upgrade(async (tx) => {
      await tx.table('syncQueue').where('status').equals('FAILED').modify((item: SyncQueueItem) => {
        item.status = 'PENDING';
        item.attempts = 0;
        item.nextAttemptAt = 0;
      });
    });

    // v6: queue ownership — index userId. Existing rows keep no userId and
    // are claimed by the first user who syncs (see SyncEngine.triggerSync).
    this.version(6).stores({
      syncQueue: 'id, type, status, priority, createdAt, userId',
    });

    // syncQueue's primary key is a plain (non auto-increment) `id`, so an
    // add() without one throws a DataError (e.g. AttendanceContext's
    // location pings). Assign a unique numeric id when the caller omits it.
    let seq = 0;
    this.syncQueue.hook('creating', (primKey, obj) => {
      // Tag every queued item with the logged-in user, whichever screen
      // queued it.
      if (!obj.userId) {
        const userId = getCurrentUserId();
        if (userId) obj.userId = userId;
      }
      if (primKey === undefined && obj.id === undefined) {
        seq = (seq + 1) % 1000;
        obj.id = Date.now() * 1000 + seq;
        return obj.id;
      }
      return undefined;
    });
  }
}

export const db = new BharatSalesDatabase();
