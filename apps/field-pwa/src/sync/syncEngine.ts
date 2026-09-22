import { db, type SyncQueueItem } from '../database/db';
import { decideRetry, MAX_BACKOFF_MS } from './retryPolicy';
import { getCurrentUserId, isForeignItem, isOwnItem } from './ownership';
import { OrdersService, OutletsService, ProductsService, DistributorsService, CollectionsService, BeatsService, TrackingService, VisitsService, AttendanceService } from '@bharatsales/api-client';

/**
 * The core engine responsible for draining the offline sync queue
 * and pushing mutations to the backend.
 */
export class SyncEngine {
  private static isSyncing = false;
  private static rerunRequested = false;
  private static recovered = false;
  private static retryTimer: ReturnType<typeof setTimeout> | null = null;

  static async pullSync() {
    if (!navigator.onLine) return;
    
    console.log('[SyncEngine] Starting pullSync...');
    try {
      const results = await Promise.allSettled([
        OutletsService.getOutlets(),
        ProductsService.getProducts(),
        DistributorsService.getDistributors(),
        Promise.resolve([]),
        Promise.resolve([]),
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

  /**
   * Items that were left SYNCING by a previous page load (tab closed or
   * crashed mid-request) will never be picked up again — nothing in flight
   * in this page owns them. Put them back in line once per page load; the
   * backend's idempotency keys make the resend safe.
   */
  private static async recoverStuckItems() {
    if (this.recovered) return;
    this.recovered = true;
    await db.syncQueue.where('status').equals('SYNCING').modify({ status: 'PENDING' });
  }

  /**
   * pendingCount: the current user's PENDING (incl. backing off) + SYNCING.
   * failedCount: everything needing a decision — the current user's FAILED
   * items plus any item another user queued on this device.
   */
  static async countByStatus(userId: string | null = getCurrentUserId()) {
    const items = await db.syncQueue.where('status').anyOf('PENDING', 'SYNCING', 'FAILED').toArray();
    let pendingCount = 0;
    let failedCount = 0;
    for (const item of items) {
      if (isForeignItem(item, userId)) failedCount++;
      else if (item.status === 'FAILED') failedCount++;
      else pendingCount++;
    }
    return { pendingCount, failedCount };
  }

  private static async emitStatus(isSyncing: boolean) {
    try {
      const counts = await this.countByStatus();
      window.dispatchEvent(new CustomEvent('sync_status', { detail: { isSyncing, ...counts } }));
    } catch (err) {
      console.warn('[SyncEngine] Failed to compute sync status', err);
    }
  }

  // Wake up when the earliest backed-off item becomes due, so a transient
  // failure is retried without waiting for an 'online' event.
  private static async scheduleNextRetry() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    const now = Date.now();
    const userId = getCurrentUserId();
    const waiting = (await db.syncQueue.where('status').equals('PENDING').toArray())
      .filter((i) => isOwnItem(i, userId));
    const next = waiting
      .map((i) => i.nextAttemptAt ?? 0)
      .filter((t) => t > now)
      .sort((a, b) => a - b)[0];
    if (next === undefined) return;
    const delay = Math.min(Math.max(next - now, 1_000), MAX_BACKOFF_MS);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.triggerSync().catch(() => {});
    }, delay);
  }

  private static async dispatch(item: SyncQueueItem) {
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
        // Not retryable — surface it as FAILED instead of silently deleting it.
        throw Object.assign(new Error(`Unknown sync action: ${item.action}`), { response: { status: 400 } });
    }
  }

  /**
   * Drains the offline queue in FIFO order. One item's failure never blocks
   * the rest: transient failures (network/timeout/5xx/408/429) go back to
   * PENDING with exponential backoff; permanent ones (other 4xx, or retries
   * exhausted) become FAILED for a user to Retry or Discard.
   */
  static async triggerSync(): Promise<void> {
    if (this.isSyncing) {
      this.rerunRequested = true;
      return;
    }
    if (!navigator.onLine) {
      await this.emitStatus(false);
      return;
    }
    // Without a logged-in user every request would 401 and burn the items'
    // retry budget — hold the queue until someone logs in.
    const userId = getCurrentUserId();
    if (!userId) {
      await this.emitStatus(false);
      return;
    }

    try {
      this.isSyncing = true;
      this.rerunRequested = false;
      await this.recoverStuckItems();
      // Items queued before ownership tracking belong to the first user who
      // syncs after the upgrade; stamp them so no one else ever sends them.
      await db.syncQueue.filter((i) => !i.userId).modify({ userId });

      // Only the logged-in user's own items are sent with their token.
      // Another user's items stay queued for their owner's next login and
      // surface under Sync issues.
      const now = Date.now();
      const pendingItems = (await db.syncQueue.where('status').equals('PENDING').sortBy('createdAt'))
        .filter((i) => i.userId === userId && (i.nextAttemptAt ?? 0) <= now);

      if (pendingItems.length > 0) {
        await this.emitStatus(true);
        console.log(`[SyncEngine] Starting sync of ${pendingItems.length} items...`);
      }

      for (const item of pendingItems) {
        if (item.id === undefined) continue;

        try {
          // Mark as currently syncing to prevent double processing
          await db.syncQueue.update(item.id, { status: 'SYNCING' });
          await this.dispatch(item);
          // If successful, remove it from the queue entirely
          await db.syncQueue.delete(item.id);
        } catch (error) {
          const decision = decideRetry(error, item.attempts ?? 0);
          if (decision.kind === 'retry') {
            console.warn(`[SyncEngine] Item ${item.id} failed (attempt ${decision.attempts}), will retry`, error);
            await db.syncQueue.update(item.id, {
              status: 'PENDING',
              attempts: decision.attempts,
              nextAttemptAt: decision.nextAttemptAt,
              error: decision.error,
            });
          } else {
            console.error(`[SyncEngine] Item ${item.id} permanently failed`, error);
            await db.syncQueue.update(item.id, {
              status: 'FAILED',
              attempts: decision.attempts,
              error: decision.error,
            });
          }
        }
      }
    } finally {
      this.isSyncing = false;
      await this.emitStatus(false);
      await this.scheduleNextRetry().catch(() => {});
    }

    if (this.rerunRequested) {
      this.rerunRequested = false;
      await this.triggerSync();
    }
  }

  /**
   * Items needing a user decision: the current user's items the server
   * permanently rejected (or that exhausted their retries), then every
   * unsent item another user queued on this device (`foreign`).
   */
  static async getFailed(userId: string | null = getCurrentUserId()): Promise<(SyncQueueItem & { foreign: boolean })[]> {
    const items = await db.syncQueue.where('status').anyOf('PENDING', 'SYNCING', 'FAILED').sortBy('createdAt');
    return items
      .map((i) => ({ ...i, foreign: isForeignItem(i, userId) }))
      .filter((i) => i.foreign || i.status === 'FAILED')
      .sort((a, b) => Number(a.foreign) - Number(b.foreign));
  }

  /** User chose Retry on one of their own FAILED items: reset the attempt budget and requeue immediately. */
  static async retryFailed(id: number): Promise<void> {
    const userId = getCurrentUserId();
    await db.syncQueue
      .where('id').equals(id)
      .and((i) => i.status === 'FAILED' && isOwnItem(i, userId))
      .modify({ status: 'PENDING', attempts: 0, nextAttemptAt: 0, error: undefined });
    await this.triggerSync();
  }

  /** User chose Discard: one of their own FAILED items, or anything another user queued. */
  static async discardFailed(id: number): Promise<void> {
    const userId = getCurrentUserId();
    await db.syncQueue
      .where('id').equals(id)
      .and((i) => i.status === 'FAILED' || isForeignItem(i, userId))
      .delete();
    await this.emitStatus(this.isSyncing);
  }
}
