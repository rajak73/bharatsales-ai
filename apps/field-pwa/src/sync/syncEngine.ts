import { db } from '../database/db';
import { OrdersService, OutletsService, ProductsService, DistributorsService, SchemesService, CollectionsService, InvoicesService, BeatsService, TrackingService } from '@bharatsales/api-client';

/**
 * The core engine responsible for draining the offline sync queue
 * and pushing mutations to the backend.
 */
export class SyncEngine {
  private static isSyncing = false;

  static async pullSync(organizationId: string) {
    if (!navigator.onLine) return;
    
    console.log('[SyncEngine] Starting pullSync for org:', organizationId);
    try {
      const [outlets, products, distributors, schemes, invoices, todayBeat] = await Promise.all([
        OutletsService.getOutlets(),
        ProductsService.getProducts(),
        DistributorsService.getDistributors(organizationId),
        SchemesService.getSchemes(organizationId),
        InvoicesService.getInvoices(organizationId),
        BeatsService.getTodayBeat()
      ]);

      await db.transaction('rw', [db.outlets, db.products, db.distributors, db.schemes, db.invoices, db.beatSchedules], async () => {
        // Clear and reload to ensure offline DB matches cloud perfectly
        await db.outlets.clear();
        await db.products.clear();
        await db.distributors.clear();
        await db.schemes.clear();
        await db.invoices.clear();
        await db.beatSchedules.clear();

        await db.outlets.bulkPut(outlets);
        await db.products.bulkPut(products);
        await db.distributors.bulkPut(distributors);
        await db.schemes.bulkPut(schemes);
        await db.invoices.bulkPut(invoices);
        
        if (todayBeat) {
          // Store the assigned beat for today
          await db.beatSchedules.put(todayBeat as any);
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
