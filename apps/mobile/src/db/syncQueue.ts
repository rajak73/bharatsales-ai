import { getDb } from './client';
import type { SyncAction, SyncQueueRow } from './client';

export async function enqueue(action: SyncAction, payload: any): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO syncQueue (action, payload, status, createdAt) VALUES (?, ?, 'PENDING', ?);`,
    [action, JSON.stringify(payload), Date.now()]
  );
}

export async function getPending(): Promise<{ id: number; action: SyncAction; payload: any; createdAt: number }[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SyncQueueRow>(
    `SELECT * FROM syncQueue WHERE status = 'PENDING' ORDER BY createdAt ASC;`
  );
  return rows.map((r) => ({ id: r.id, action: r.action, payload: JSON.parse(r.payload), createdAt: r.createdAt }));
}

export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM syncQueue WHERE status = 'PENDING';`
  );
  return row?.count ?? 0;
}

export async function markSyncing(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE syncQueue SET status = 'SYNCING' WHERE id = ?;`, [id]);
}

export async function markFailed(id: number, error: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE syncQueue SET status = 'FAILED', error = ? WHERE id = ?;`, [error, id]);
}

export async function remove(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM syncQueue WHERE id = ?;`, [id]);
}
