import { getDb } from './client';
import type { SyncAction, SyncQueueRow } from './client';

export interface QueueItem {
  id: number;
  action: SyncAction;
  payload: any;
  createdAt: number;
  attempts: number;
  /** Who queued it; null for rows queued before ownership tracking. */
  userId: string | null;
}

export interface FailedQueueItem extends QueueItem {
  error: string | null;
  /**
   * Queued by a different user on this device. It is never sent with the
   * current user's session, so the only thing this user can do is Discard it
   * (or leave it for its owner to sync on their next login).
   */
  foreign: boolean;
}

/**
 * Queue ownership. Every item is stamped with the id of the user who queued
 * it, and only that user's session ever sends it — otherwise user B's token
 * would submit user A's orders/payments as B. Rows from before ownership
 * tracking have userId NULL and count as the current user's until
 * claimLegacyItems() stamps them.
 *
 * `currentUserId` null (no session / user without an id) owns only the
 * legacy NULL rows.
 */
const OWN = `(userId IS NULL OR userId = ?)`;
const FOREIGN = `(userId IS NOT NULL AND userId != ?)`;
const uid = (currentUserId: string | null | undefined) => currentUserId ?? '';

function parsePayload(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toItem(r: SyncQueueRow): QueueItem {
  return {
    id: r.id,
    action: r.action,
    payload: parsePayload(r.payload),
    createdAt: r.createdAt,
    attempts: r.attempts ?? 0,
    userId: r.userId ?? null,
  };
}

export async function enqueue(action: SyncAction, payload: any, userId: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO syncQueue (action, payload, status, createdAt, attempts, nextAttemptAt, userId) VALUES (?, ?, 'PENDING', ?, 0, 0, ?);`,
    [action, JSON.stringify(payload), Date.now(), userId ?? null]
  );
}

/**
 * Legacy rows (queued before ownership tracking) are treated as belonging to
 * the first user who syncs after the upgrade, and stamped with their id so
 * they are never picked up by anyone else afterwards.
 */
export async function claimLegacyItems(currentUserId: string | null): Promise<void> {
  if (!currentUserId) return;
  const db = await getDb();
  await db.runAsync(`UPDATE syncQueue SET userId = ? WHERE userId IS NULL;`, [currentUserId]);
}

/** The current user's PENDING items whose backoff window has elapsed, FIFO. */
export async function getPending(currentUserId: string | null, now: number = Date.now()): Promise<QueueItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SyncQueueRow>(
    `SELECT * FROM syncQueue WHERE status = 'PENDING' AND nextAttemptAt <= ? AND ${OWN} ORDER BY createdAt ASC, id ASC;`,
    [now, uid(currentUserId)]
  );
  return rows.map(toItem);
}

/** Earliest nextAttemptAt among the current user's PENDING items still backing off, or null. */
export async function getNextScheduledAttempt(currentUserId: string | null, now: number = Date.now()): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ next: number | null }>(
    `SELECT MIN(nextAttemptAt) as next FROM syncQueue WHERE status = 'PENDING' AND nextAttemptAt > ? AND ${OWN};`,
    [now, uid(currentUserId)]
  );
  return row?.next ?? null;
}

/** The current user's items not yet delivered and not given up on (PENDING incl. backing off, plus in-flight SYNCING). */
export async function getPendingCount(currentUserId: string | null): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM syncQueue WHERE status IN ('PENDING', 'SYNCING') AND ${OWN};`,
    [uid(currentUserId)]
  );
  return row?.count ?? 0;
}

/** Items needing a decision: the current user's FAILED ones plus anything queued by another user. */
export async function getFailedCount(currentUserId: string | null): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM syncQueue
       WHERE (status = 'FAILED' AND ${OWN})
          OR (status IN ('PENDING', 'SYNCING', 'FAILED') AND ${FOREIGN});`,
    [uid(currentUserId), uid(currentUserId)]
  );
  return row?.count ?? 0;
}

/** The current user's work that would be lost if their queue were wiped (PENDING, SYNCING or FAILED). */
export async function getUnsyncedCount(currentUserId: string | null): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM syncQueue WHERE status IN ('PENDING', 'SYNCING', 'FAILED') AND ${OWN};`,
    [uid(currentUserId)]
  );
  return row?.count ?? 0;
}

/** The current user's FAILED items, followed by every item another user queued on this device. */
export async function getFailed(currentUserId: string | null): Promise<FailedQueueItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SyncQueueRow>(
    `SELECT *, CASE WHEN ${FOREIGN} THEN 1 ELSE 0 END AS foreign_ FROM syncQueue
       WHERE (status = 'FAILED' AND ${OWN})
          OR (status IN ('PENDING', 'SYNCING', 'FAILED') AND ${FOREIGN})
       ORDER BY foreign_ ASC, createdAt ASC, id ASC;`,
    [uid(currentUserId), uid(currentUserId), uid(currentUserId)]
  );
  return rows.map((r) => ({ ...toItem(r), error: r.error, foreign: !!(r as any).foreign_ }));
}

/** The current user's queued CREATE_ORDER items not yet on the server, for optimistic display. */
export async function getUnsyncedOrders(currentUserId: string | null): Promise<(QueueItem & { status: SyncQueueRow['status'] })[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SyncQueueRow>(
    `SELECT * FROM syncQueue WHERE action = 'CREATE_ORDER' AND status IN ('PENDING', 'SYNCING', 'FAILED') AND ${OWN} ORDER BY createdAt ASC;`,
    [uid(currentUserId)]
  );
  return rows.map((r) => ({ ...toItem(r), status: r.status }));
}

/**
 * The current user's queued distributor decisions (accept / reject /
 * dispatch an order, confirm a delivery) that haven't reached the server
 * yet, oldest first. Used to show the decision on the cached order/delivery
 * straight away and to stop it being taken twice.
 */
export async function getQueuedOrderActions(currentUserId: string | null): Promise<QueueItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SyncQueueRow>(
    `SELECT * FROM syncQueue WHERE action IN ('APPROVE_ORDER', 'REJECT_ORDER', 'DISPATCH_ORDER', 'CONFIRM_DELIVERY') AND status IN ('PENDING', 'SYNCING') AND ${OWN} ORDER BY createdAt ASC, id ASC;`,
    [uid(currentUserId)]
  );
  return rows.map(toItem);
}

export async function markSyncing(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE syncQueue SET status = 'SYNCING' WHERE id = ?;`, [id]);
}

/** Transient failure: back to PENDING, not eligible again until nextAttemptAt. */
export async function markRetry(id: number, attempts: number, nextAttemptAt: number, error: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE syncQueue SET status = 'PENDING', attempts = ?, nextAttemptAt = ?, error = ? WHERE id = ?;`,
    [attempts, nextAttemptAt, error, id]
  );
}

/** Permanent failure (or retries exhausted): needs a user decision. */
export async function markFailed(id: number, error: string, attempts?: number): Promise<void> {
  const db = await getDb();
  if (attempts === undefined) {
    await db.runAsync(`UPDATE syncQueue SET status = 'FAILED', error = ? WHERE id = ?;`, [error, id]);
  } else {
    await db.runAsync(`UPDATE syncQueue SET status = 'FAILED', error = ?, attempts = ? WHERE id = ?;`, [error, attempts, id]);
  }
}

/** User chose Retry on one of their own FAILED items: reset its attempt budget and requeue now. */
export async function retryFailed(id: number, currentUserId: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE syncQueue SET status = 'PENDING', attempts = 0, nextAttemptAt = 0, error = NULL WHERE id = ? AND status = 'FAILED' AND ${OWN};`,
    [id, uid(currentUserId)]
  );
}

/** User chose Discard: one of their own FAILED items, or any item another user queued. */
export async function discardFailed(id: number, currentUserId: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM syncQueue WHERE id = ? AND ((status = 'FAILED' AND ${OWN}) OR ${FOREIGN});`,
    [id, uid(currentUserId), uid(currentUserId)]
  );
}

export async function remove(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM syncQueue WHERE id = ?;`, [id]);
}

/**
 * Drops the current user's queued items. Only for an explicit "log out
 * anyway (discard)". Other users' items are left for their owners.
 */
export async function clearSyncQueue(currentUserId: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM syncQueue WHERE ${OWN};`, [uid(currentUserId)]);
}
