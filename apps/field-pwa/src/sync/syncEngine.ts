import { db } from '../database/db';
import { OrdersService, OutletsService, ProductsService, DistributorsService, SchemesService, CollectionsService, InvoicesService, BeatsService, TrackingService, VisitsService, AttendanceService } from '@bharatsales/api-client';

/**
 * The core engine responsible for draining the offline sync queue
 * and pushing mutations to the backend.
 */
export class SyncEngine {
  private static isSyncing = false;

  static async pullSync() {
    if (!navigator.onLine) return;
    
    console.log('[SyncEngine] Starting pullSync...');
    try {
      const results = await Promise.allSettled([
        OutletsService.getOutlets(),
        ProductsService.getProducts(),
        DistributorsService.getDistributors(),
        SchemesService.getSchemes(),
        InvoicesService.getInvoices(),
        BeatsService.getTodayBeat()
      ]);

      await db.transaction('rw', [db.outlets, db.products, db.distributors, db.schemes, db.invoices, db.beatSchedules], async () => {
        const mapId = (items: any[]) => items.map(item => ({ ...item, id: item.id || item._id }));

        if (results[0].status === 'fulfilled') {
          await db.outlets.clear();
          await db.outlets.bulkPut(mapId(results[0].value || []));
        }
        if (results[1].status === 'fulfilled') {
          await db.products.clear();
          await db.products.bulkPut(mapId(results[1].value || []));
        }
        if (results[2].status === 'fulfilled') {
          await db.distributors.clear();
          await db.distributors.bulkPut(mapId(results[2].value || []));
        }
        if (results[3].status === 'fulfilled') {
          await db.schemes.clear();
          await db.schemes.bulkPut(mapId(results[3].value || []));
        }
        if (results[4].status === 'fulfilled') {
          await db.invoices.clear();
          await db.invoices.bulkPut(mapId(results[4].value || []));
        }
        if (results[5].status === 'fulfilled' && results[5].value) {
          const val: any = results[5].value;
          await db.beatSchedules.clear();
          await db.beatSchedules.put({ ...val, id: val.id || val._id });
        }
      });

      console.log('[SyncEngine] pullSync complete!');
    } catch (error) {
      console.error('[SyncEngine] Failed to pull sync data:', error);
      throw error;
    }
  }

  static async triggerSync() {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    try {
      this.isSyncing = true;
      
      // Get all pending items ordered by when they were created
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('PENDING')
        .sortBy('createdAt');

      if (pendingItems.length === 0) {
        return;
      }

      console.log(`[SyncEngine] Starting sync of ${pendingItems.length} items...`);

      for (const item of pendingItems) {
        if (!item.id) continue;

        try {
          // Mark as currently syncing to prevent double processing
          await db.syncQueue.update(item.id, { status: 'SYNCING' });

          switch (item.action) {
            case 'UPDATE_OUTLET':
              await OutletsService.updateOutlet(item.payload.id, item.payload);
              break;
            case 'CREATE_ORDER':
              await OrdersService.createOrder(item.payload);
              break;
            case 'CREATE_PAYMENT':
              await CollectionsService.createCollection(item.payload);
              break;
            case 'CREATE_LOCATION_PING':
              await TrackingService.bulkCreatePings([item.payload]);
              break;
            case 'CREATE_VISIT':
              await VisitsService.checkIn(item.payload);
              break;
            case 'UPDATE_VISIT':
              await VisitsService.checkOut(item.payload.id);
              break;
            case 'CLOCK_IN':
              await AttendanceService.startDay(item.payload);
              break;
            case 'CLOCK_OUT':
              await AttendanceService.endDay(item.payload);
              break;
            default:
              console.warn(`[SyncEngine] Unknown action type: ${item.action}`);
              break;
          }

          // If successful, remove it from the queue entirely
          await db.syncQueue.delete(item.id);
          console.log(`[SyncEngine] Successfully synced item ${item.id}`);

        } catch (error) {
          console.error(`[SyncEngine] Failed to sync item ${item.id}`, error);
          // Mark as failed so it can be retried later or manually reviewed
          await db.syncQueue.update(item.id, { status: 'FAILED' });
        }
      }

    } finally {
      this.isSyncing = false;
      console.log('[SyncEngine] Sync run complete.');
    }
  }
}
