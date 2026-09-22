import { useQuery } from '@tanstack/react-query';
import type { Outlet, Product, Distributor, BeatSchedule, Order, Dispatch as DispatchModel, Inventory } from '@bharatsales/shared-types';
import { getAll } from '../db/client';
import { getUnsyncedOrders, getQueuedOrderActions } from '../db/syncQueue';
import { getCurrentUserId } from '../store/sessionStore';

// Thin TanStack Query wrappers around the SQLite cache (populated by
// SyncEngine.pullSync) so screens get loading/refetch semantics for free
// without needing a network round-trip — this is what makes Beat/Catalog/
// Orders/Outlets usable offline.
export function useLocalOutlets() {
  return useQuery({ queryKey: ['local', 'outlets'], queryFn: () => getAll<Outlet>('outlets') });
}

export function useLocalProducts() {
  return useQuery({ queryKey: ['local', 'products'], queryFn: () => getAll<Product>('products') });
}

export function useLocalDistributors() {
  return useQuery({ queryKey: ['local', 'distributors'], queryFn: () => getAll<Distributor>('distributors') });
}

export function useLocalBeatSchedules() {
  return useQuery({ queryKey: ['local', 'beatSchedules'], queryFn: () => getAll<BeatSchedule>('beatSchedules') });
}

export function useLocalSchemes() {
  return useQuery({ queryKey: ['local', 'schemes'], queryFn: () => getAll<any>('schemes') });
}

export const PENDING_SYNC_STATUS = 'Pending Sync';
export const SYNC_FAILED_STATUS = 'Sync Failed';

// Cached server orders plus orders still sitting in the offline queue, so a
// rep sees what they just booked immediately (as "Pending Sync") instead of
// it being invisible until the queue drains and the next pullSync runs.
// What the order will be once a queued decision reaches the server.
const OPTIMISTIC_STATUS: Record<string, string> = {
  APPROVE_ORDER: 'Approved',
  REJECT_ORDER: 'Rejected',
  DISPATCH_ORDER: 'Dispatched',
};

/**
 * Overlays decisions still in the offline queue on the cached orders: the
 * order shows its expected status and carries `pendingAction`, so screens
 * hide the Accept / Reject / Dispatch buttons instead of letting the same
 * decision be queued twice (the second one would fail on the server).
 */
export function applyQueuedOrderActions<T extends { id?: any; status?: any }>(
  orders: T[],
  actions: { action: string; payload: any }[],
): T[] {
  if (actions.length === 0) return orders;
  const latest = new Map<string, string>();
  for (const a of actions) {
    if (!(a.action in OPTIMISTIC_STATUS)) continue;
    const orderId = a.payload?.orderId;
    if (orderId != null) latest.set(String(orderId), a.action);
  }
  return orders.map((o) => {
    const action = latest.get(String(o.id));
    if (!action) return o;
    return { ...o, status: OPTIMISTIC_STATUS[action] ?? o.status, pendingAction: action };
  });
}

async function getOrdersWithQueued(): Promise<Order[]> {
  const userId = getCurrentUserId();
  const [cached, queued, actions] = await Promise.all([
    getAll<Order>('orders'),
    getUnsyncedOrders(userId).catch(() => []),
    getQueuedOrderActions(userId).catch(() => []),
  ]);
  const orders = applyQueuedOrderActions(cached, actions);
  const known = new Set(orders.map((o: any) => String(o.id)));
  const pending = queued
    .filter((q) => q.payload && !known.has(String(q.payload.id)))
    .map((q) => ({
      ...q.payload,
      id: String(q.payload.id ?? `queued-${q.id}`),
      status: q.status === 'FAILED' ? SYNC_FAILED_STATUS : PENDING_SYNC_STATUS,
      isPendingSync: true,
    }) as unknown as Order);
  return [...pending, ...orders];
}

export function useLocalOrders() {
  return useQuery({ queryKey: ['local', 'orders'], queryFn: getOrdersWithQueued });
}

// A delivery confirmation still in the offline queue: show that delivery as
// Delivered (so it leaves the active list) until the server copy arrives.
export function applyQueuedDeliveries<T extends { id?: any; status?: any }>(
  dispatches: T[],
  actions: { action: string; payload: any }[],
): T[] {
  const confirmed = new Set(
    actions.filter((a) => a.action === 'CONFIRM_DELIVERY' && a.payload?.dispatchId != null).map((a) => String(a.payload.dispatchId)),
  );
  if (confirmed.size === 0) return dispatches;
  return dispatches.map((d) => (confirmed.has(String(d.id)) ? { ...d, status: 'Delivered', pendingAction: 'CONFIRM_DELIVERY' } : d));
}

async function getDispatchesWithQueued(): Promise<DispatchModel[]> {
  const [cached, actions] = await Promise.all([
    getAll<DispatchModel>('dispatches'),
    getQueuedOrderActions(getCurrentUserId()).catch(() => []),
  ]);
  return applyQueuedDeliveries(cached, actions);
}

export function useLocalDispatches() {
  return useQuery({ queryKey: ['local', 'dispatches'], queryFn: getDispatchesWithQueued });
}

export function useLocalInventory() {
  return useQuery({ queryKey: ['local', 'inventory'], queryFn: () => getAll<Inventory>('inventory') });
}
