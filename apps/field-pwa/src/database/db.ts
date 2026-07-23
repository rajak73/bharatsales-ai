import Dexie, { type EntityTable } from 'dexie';
import type { Outlet, Product, Order, Scheme, Distributor, Invoice, PaymentCollection, Beat, BeatSchedule } from '@bharatsales/shared-types';

export interface SyncQueueItem {
  id?: number;
  action: 'CREATE_ORDER' | 'UPDATE_OUTLET' | 'CREATE_PAYMENT' | 'CREATE_LOCATION_PING' | 'CREATE_VISIT' | 'UPDATE_VISIT' | 'CLOCK_IN' | 'CLOCK_OUT';
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'COMPLETED';
  createdAt: number;
  error?: string;
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
  }
}

export const db = new BharatSalesDatabase();
