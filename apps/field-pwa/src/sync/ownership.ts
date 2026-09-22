import type { SyncQueueItem } from '../database/db';

/**
 * Sync queue ownership. Every queued item is stamped with the id of the user
 * who was logged in when it was queued, and only that user's session ever
 * sends it — otherwise the next user's token would submit the previous
 * user's orders/payments as their own. Items queued before ownership
 * tracking have no userId: the first user who syncs claims them.
 */

/** Id of the logged-in user from the session AuthService stored, or null. */
export function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    const id = user?.id ?? user?._id;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

/** Queued by someone other than `userId` (legacy unowned items are not foreign). */
export function isForeignItem(item: Pick<SyncQueueItem, 'userId'>, userId: string | null): boolean {
  return !!item.userId && item.userId !== userId;
}

/** May be sent with `userId`'s session (theirs, or legacy unowned). */
export function isOwnItem(item: Pick<SyncQueueItem, 'userId'>, userId: string | null): boolean {
  return !isForeignItem(item, userId);
}

export const SYNC_ACTION_LABELS: Record<SyncQueueItem['action'], string> = {
  CREATE_ORDER: 'New order',
  UPDATE_OUTLET: 'Outlet update',
  CREATE_PAYMENT: 'Payment collection',
  CREATE_LOCATION_PING: 'Location ping',
  CREATE_VISIT: 'Visit check-in',
  UPDATE_VISIT: 'Visit check-out',
  CLOCK_IN: 'Start day',
  CLOCK_OUT: 'End day',
};

export function describeSyncItem(item: SyncQueueItem): string {
  const label = SYNC_ACTION_LABELS[item.action] ?? item.action;
  const p = item.payload || {};
  const ref = p.orderNumber || p.receiptNumber || '';
  return ref ? `${label} ${ref}` : label;
}
