import { useQuery } from '@tanstack/react-query';
import type { Outlet, Product, Distributor, BeatSchedule, Order, Dispatch as DispatchModel, Inventory } from '@bharatsales/shared-types';
import { getAll } from '../db/client';

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

export function useLocalOrders() {
  return useQuery({ queryKey: ['local', 'orders'], queryFn: () => getAll<Order>('orders') });
}

export function useLocalDispatches() {
  return useQuery({ queryKey: ['local', 'dispatches'], queryFn: () => getAll<DispatchModel>('dispatches') });
}

export function useLocalInventory() {
  return useQuery({ queryKey: ['local', 'inventory'], queryFn: () => getAll<Inventory>('inventory') });
}
