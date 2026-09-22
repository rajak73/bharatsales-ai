import NetInfo from '@react-native-community/netinfo';
import {
  OutletsService, ProductsService, DistributorsService, BeatsService,
  DispatchService, InventoryService, OrdersService, SchemesService,
} from '@bharatsales/api-client';
import { AppState } from 'react-native';
import { replaceTable, upsertRow } from '../db/client';
import type { SyncAction } from '../db/client';
import {
  enqueue, getPending, getPendingCount, getFailedCount, getNextScheduledAttempt,
  markSyncing, markFailed, markRetry, remove, claimLegacyItems,
} from '../db/syncQueue';
import { queryClient } from '../lib/queryClient';
import { useSessionStore, getCurrentUserId } from '../store/sessionStore';
import { dispatchSyncAction } from './dispatch';
import { decideRetry } from './retryPolicy';

export interface SyncStatus { isSyncing: boolean; pendingCount: number; failedCount: number }
type SyncListener = (state: SyncStatus) => void;
const listeners = new Set<SyncListener>();
function emit(state: SyncStatus) {
  listeners.forEach((l) => l(state));
}
export function onSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Actions that change data the local cache mirrors (orders, dispatches,
// inventory, outlet balances). Once one of these reaches the server the
// cache is re-pulled, so e.g. an accepted order stops showing as Submitted
// with the Accept button still enabled until the next app restart.
const REFRESH_AFTER: ReadonlySet<SyncAction> = new Set<SyncAction>([
  'CREATE_ORDER', 'APPROVE_ORDER', 'REJECT_ORDER', 'DISPATCH_ORDER',
  'CONFIRM_DELIVERY', 'UPDATE_OUTLET', 'CREATE_PAYMENT',
]);

let isSyncing = false;
let rerunRequested = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!state.isConnected && state.isInternetReachable !== false;
}

// Every ['local', ...] query reads SQLite, so after the cache or queue
// changes, have mounted screens re-read it.
function invalidateLocalQueries() {
  queryClient.invalidateQueries({ queryKey: ['local'] }).catch(() => {});
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const userId = getCurrentUserId();
  const [pendingCount, failedCount] = await Promise.all([getPendingCount(userId), getFailedCount(userId)]);
  return { isSyncing, pendingCount, failedCount };
}

/** Recompute queue counts and notify useSyncStatus() subscribers. */
export async function refreshSyncStatus(): Promise<void> {
  try {
    emit(await getSyncStatus());
  } catch (err) {
    console.warn('[Sync] refreshSyncStatus failed', err);
  }
}

// Wakes the engine up when the earliest backed-off item becomes due, so a
// transient failure is retried without waiting for the next reconnect /
// foreground / interval trigger.
async function scheduleNextRetry() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  const next = await getNextScheduledAttempt(getCurrentUserId());
  if (next === null) return;
  const delay = Math.min(Math.max(next - Date.now(), 1_000), 30 * 60 * 1000);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    SyncEngine.triggerSync().catch(() => {});
  }, delay);
}

export const SyncEngine = {
  // Pulls read-only reference data the same way field-pwa's pullSync() does —
  // one GET per resource rather than the batch /sync/pull endpoint, so the
  // exact same per-role RBAC scoping already enforced by each individual
  // endpoint (e.g. Distributor sees only their own orders/dispatches) applies
  // here too, without re-deriving that logic client-side.
  async pullSync(role: 'Sales Representative' | 'Distributor'): Promise<void> {
    if (!(await isOnline())) return;

    if (role === 'Sales Representative') {
      const [outlets, products, distributors, beat, schemes, orders] = await Promise.allSettled([
        OutletsService.getOutlets(),
        ProductsService.getProducts(),
        DistributorsService.getDistributors(),
        BeatsService.getTodayBeat(),
        SchemesService.getSchemes(),
        OrdersService.getOrders({ mine: true }),
      ]);
      if (outlets.status === 'fulfilled') await replaceTable('outlets', outlets.value);
      if (products.status === 'fulfilled') await replaceTable('products', products.value);
      if (distributors.status === 'fulfilled') await replaceTable('distributors', distributors.value);
      if (beat.status === 'fulfilled' && beat.value) await replaceTable('beatSchedules', [beat.value as any]);
      if (schemes.status === 'fulfilled') await replaceTable('schemes', schemes.value as any);
      if (orders.status === 'fulfilled') await replaceTable('orders', orders.value);
    } else {
      const [orders, dispatches, inventory] = await Promise.allSettled([
        OrdersService.getOrders(),
        DispatchService.getDispatches(),
        InventoryService.getInventory(),
      ]);
      if (orders.status === 'fulfilled') await replaceTable('orders', orders.value);
      if (dispatches.status === 'fulfilled') await replaceTable('dispatches', dispatches.value);
      if (inventory.status === 'fulfilled') await replaceTable('inventory', inventory.value);
    }
    invalidateLocalQueries();
  },

  // Drains the offline queue in FIFO order. One item's failure never blocks
  // the rest: transient failures (network/timeout/5xx/408/429) go back to
  // PENDING with exponential backoff, permanent ones (other 4xx, or retries
  // exhausted) become FAILED and surface in the Profile screen for the user
  // to Retry or Discard.
  async triggerSync(): Promise<void> {
    if (isSyncing) {
      rerunRequested = true;
      return;
    }
    // Without a session every request would 401 and burn the item's retry
    // budget — hold the queue until someone logs back in.
    if (!useSessionStore.getState().user) return;
    if (!(await isOnline())) {
      await refreshSyncStatus();
      return;
    }

    let processed = 0;
    let needsRefresh = false;
    try {
      isSyncing = true;
      rerunRequested = false;
      // Only ever send the logged-in user's own items with their token.
      // Another user's items stay queued (shown under Sync issues) for
      // their owner's next login; pre-ownership rows are claimed here.
      const userId = getCurrentUserId();
      await claimLegacyItems(userId);
      const pending = await getPending(userId);

      if (pending.length > 0) {
        emit({ isSyncing: true, pendingCount: await getPendingCount(userId), failedCount: await getFailedCount(userId) });
      }

      for (const item of pending) {
        try {
          await markSyncing(item.id);
          await dispatchSyncAction(item.action, item.payload);
          await remove(item.id);
          if (REFRESH_AFTER.has(item.action)) needsRefresh = true;
          if (item.action === 'CREATE_ORDER' && item.payload?.id) {
            // Keep the just-synced order visible in My Orders until the
            // next pullSync replaces the cache with the server's copy.
            await upsertRow('orders', item.payload).catch(() => {});
          }
        } catch (error: unknown) {
          const decision = decideRetry(error, item.attempts);
          if (decision.kind === 'retry') {
            await markRetry(item.id, decision.attempts, decision.nextAttemptAt, decision.error);
          } else {
            await markFailed(item.id, decision.error, decision.attempts);
          }
        }
        processed++;
      }
    } finally {
      isSyncing = false;
      await refreshSyncStatus();
      if (processed > 0) invalidateLocalQueries();
      await scheduleNextRetry().catch(() => {});
    }

    if (needsRefresh) {
      const role = useSessionStore.getState().user?.role;
      if (role === 'Sales Representative' || role === 'Distributor') {
        await SyncEngine.pullSync(role).catch((err) => console.warn('[Sync] refresh after sync failed', err));
      }
    }

    if (rerunRequested) {
      rerunRequested = false;
      await SyncEngine.triggerSync();
    }
  },
};

/**
 * Queue an offline mutation and immediately try to push it, instead of
 * leaving it until the next connectivity change. Refreshes local queries so
 * optimistic "Pending Sync" rows appear straight away.
 */
export async function enqueueAndSync(action: SyncAction, payload: any): Promise<void> {
  await enqueue(action, payload, getCurrentUserId());
  invalidateLocalQueries();
  refreshSyncStatus();
  SyncEngine.triggerSync().catch((err) => console.warn('[Sync] triggerSync after enqueue failed', err));
}

// Wires an automatic triggerSync() whenever connectivity is regained,
// mirroring field-pwa's online/offline banner + background sync behavior.
// Call once at app startup; returns an unsubscribe function.
export function startAutoSync(): () => void {
  let wasOnline = true;
  const unsubscribe = NetInfo.addEventListener((state) => {
    const nowOnline = !!state.isConnected && state.isInternetReachable !== false;
    if (nowOnline && !wasOnline) {
      SyncEngine.triggerSync().catch(() => {});
    }
    wasOnline = nowOnline;
  });
  return unsubscribe;
}

export const FOREGROUND_SYNC_INTERVAL_MS = 2 * 60 * 1000;

// While a user is logged in: sync whenever the app comes to the foreground,
// and every 2 minutes while it stays there. Returns a cleanup function.
export function startForegroundSync(): () => void {
  let interval: ReturnType<typeof setInterval> | null = null;
  const startInterval = () => {
    if (interval) return;
    interval = setInterval(() => {
      SyncEngine.triggerSync().catch(() => {});
    }, FOREGROUND_SYNC_INTERVAL_MS);
  };
  const stopInterval = () => {
    if (interval) clearInterval(interval);
    interval = null;
  };

  if (AppState.currentState === 'active') startInterval();
  const sub = AppState.addEventListener('change', (next) => {
    if (next === 'active') {
      startInterval();
      SyncEngine.triggerSync().catch(() => {});
    } else {
      stopInterval();
    }
  });

  return () => {
    sub.remove();
    stopInterval();
  };
}
