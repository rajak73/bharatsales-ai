import NetInfo from '@react-native-community/netinfo';
import {
  OutletsService, ProductsService, DistributorsService, BeatsService,
  DispatchService, InventoryService, OrdersService, SchemesService,
} from '@bharatsales/api-client';
import { replaceTable } from '../db/client';
import { getPending, getPendingCount, markSyncing, markFailed, remove } from '../db/syncQueue';
import { dispatchSyncAction } from './dispatch';

type SyncListener = (state: { isSyncing: boolean; pendingCount: number }) => void;
const listeners = new Set<SyncListener>();
function emit(state: { isSyncing: boolean; pendingCount: number }) {
  listeners.forEach((l) => l(state));
}
export function onSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let isSyncing = false;

async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!state.isConnected && state.isInternetReachable !== false;
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
  },

  // Drains the offline queue in FIFO order, exactly like field-pwa's
  // triggerSync() — one item's failure marks it FAILED and moves on rather
  // than blocking the rest of the queue.
  async triggerSync(): Promise<void> {
    if (isSyncing || !(await isOnline())) return;

    try {
      isSyncing = true;
      const pending = await getPending();

      if (pending.length === 0) {
        emit({ isSyncing: false, pendingCount: 0 });
        return;
      }

      emit({ isSyncing: true, pendingCount: pending.length });

      for (const item of pending) {
        try {
          await markSyncing(item.id);
          await dispatchSyncAction(item.action, item.payload);
          await remove(item.id);
        } catch (error: any) {
          await markFailed(item.id, error?.message || 'Sync failed');
        }
      }
    } finally {
      isSyncing = false;
      const remaining = await getPendingCount();
      emit({ isSyncing: false, pendingCount: remaining });
    }
  },
};

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
