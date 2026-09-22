import { useQuery } from '@tanstack/react-query';
import type { Outlet, Product, Distributor, BeatSchedule, Order, Dispatch as DispatchModel, Inventory } from '@bharatsales/shared-types';
import { getAll } from '../db/client';
import { getUnsyncedOrders } from '../db/syncQueue';
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
async function getOrdersWithQueued(): Promise<Order[]> {
  const [orders, queued] = await Promise.all([getAll<Order>('orders'), getUnsyncedOrders(getCurrentUserId()).catch(() => [])]);
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

export function useLocalDispatches() {
  return useQuery({ queryKey: ['local', 'dispatches'], queryFn: () => getAll<DispatchModel>('dispatches') });
}

export function useLocalInventory() {
  return useQuery({ queryKey: ['local', 'inventory'], queryFn: () => getAll<Inventory>('inventory') });
}
