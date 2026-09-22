import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

// Mirrors apps/field-pwa/src/database/db.ts's Dexie table set 1:1 (outlets,
// products, orders, schemes, distributors, invoices, collections, beats,
// beatSchedules, syncQueue), but each table is a generic (id, data) JSON
// blob store rather than a rigid column-per-field schema — these entity
// shapes come straight from the backend and shift over time, so we let the
// backend stay the source of truth for structure and only index `id` for
// lookups, exactly like field-pwa's Dexie tables do for anything beyond a
// couple of filter columns.
const JSON_BLOB_TABLES = [
  'outlets', 'products', 'orders', 'schemes', 'distributors',
  'invoices', 'collections', 'beats', 'beatSchedules', 'dispatches', 'inventory',
  // Small per-user values that must survive an offline app restart (current
  // attendance session, org branding); wiped with the rest on logout.
  'appState',
] as const;
export type JsonBlobTable = typeof JSON_BLOB_TABLES[number];

export type SyncAction =
  | 'CREATE_ORDER' | 'UPDATE_OUTLET' | 'CREATE_PAYMENT' | 'CREATE_LOCATION_PING'
  | 'CREATE_VISIT' | 'UPDATE_VISIT' | 'CLOCK_IN' | 'CLOCK_OUT'
  | 'APPROVE_ORDER' | 'REJECT_ORDER' | 'DISPATCH_ORDER' | 'CONFIRM_DELIVERY';

export interface SyncQueueRow {
  id: number;
  action: SyncAction;
  payload: string; // JSON-encoded
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'COMPLETED';
  createdAt: number;
  error: string | null;
  attempts: number;
  nextAttemptAt: number;
  /** Id of the user who queued the item; NULL for rows queued before ownership tracking. */
  userId: string | null;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  for (const table of JSON_BLOB_TABLES) {
    await db.execAsync(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);`);
  }
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS syncQueue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt INTEGER NOT NULL,
      error TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      nextAttemptAt INTEGER NOT NULL DEFAULT 0,
      userId TEXT
    );
  `);

  // Installs created before retry/backoff support have the old 6-column
  // syncQueue — CREATE TABLE IF NOT EXISTS won't touch it, so add the new
  // columns in place.
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(syncQueue);`);
  const names = new Set(columns.map((c) => c.name));
  if (!names.has('attempts')) {
    await db.execAsync(`ALTER TABLE syncQueue ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;`);
  }
  if (!names.has('nextAttemptAt')) {
    await db.execAsync(`ALTER TABLE syncQueue ADD COLUMN nextAttemptAt INTEGER NOT NULL DEFAULT 0;`);
  }
  // Queue ownership: which logged-in user queued the item. Existing rows keep
  // NULL and are claimed by the next user who syncs (see claimLegacyItems).
  if (!names.has('userId')) {
    await db.execAsync(`ALTER TABLE syncQueue ADD COLUMN userId TEXT;`);
  }

  // A row can only be SYNCING while a triggerSync() run is in flight in this
  // process. On a fresh open nothing is in flight, so any SYNCING row was
  // orphaned by the app being killed mid-request — put it back in line
  // (the backend's idempotency keys make re-sending safe).
  await db.runAsync(`UPDATE syncQueue SET status = 'PENDING' WHERE status = 'SYNCING';`);
}

// expo-sqlite's web build (used only for the react-native-web preview) has no
// withExclusiveTransactionAsync; there the plain transaction on the same
// connection is used instead. Native always takes the exclusive path.
function withExclusiveTransaction(
  db: SQLite.SQLiteDatabase,
  task: (txn: SQLite.SQLiteDatabase) => Promise<void>,
): Promise<void> {
  if (Platform.OS === 'web') return db.withTransactionAsync(() => task(db));
  return db.withExclusiveTransactionAsync(task);
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('bharatsales.db').then(async (db) => {
      await migrate(db);
      return db;
    }).catch((err) => {
      // Don't cache a rejected promise forever — let the next caller retry.
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function replaceTable<T extends { id?: string; _id?: string }>(table: JsonBlobTable, items: T[]): Promise<void> {
  const db = await getDb();
  // withTransactionAsync() is not isolated: any other query issued on `db`
  // while it awaits (e.g. a screen reading this table, or a concurrent
  // replaceTable for another table) runs inside/interleaves with this
  // transaction. The exclusive variant gets its own connection, and every
  // statement must go through `txn`.
  await withExclusiveTransaction(db, async (txn) => {
    await txn.runAsync(`DELETE FROM ${table};`);
    for (const item of items) {
      const id = String(item.id ?? item._id);
      await txn.runAsync(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?);`, [id, JSON.stringify({ ...item, id })]);
    }
  });
}

export async function getAll<T = any>(table: JsonBlobTable): Promise<T[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>(`SELECT data FROM ${table};`);
  return rows.map((r) => JSON.parse(r.data) as T);
}

export async function upsertRow<T extends { id?: string; _id?: string }>(table: JsonBlobTable, item: T): Promise<void> {
  const db = await getDb();
  const id = String(item.id ?? item._id);
  await db.runAsync(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?);`, [id, JSON.stringify({ ...item, id })]);
}

export async function getById<T = any>(table: JsonBlobTable, id: string): Promise<T | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ data: string }>(`SELECT data FROM ${table} WHERE id = ?;`, [id]);
  return row ? (JSON.parse(row.data) as T) : null;
}

// Wipes every cached server entity table (used on logout so the next user on
// this device never sees the previous user's outlets/orders). The syncQueue
// is deliberately NOT touched here — unsynced work is only ever discarded by
// an explicit user choice (see clearSyncQueue / useAuth().logout).
export async function clearLocalCache(): Promise<void> {
  const db = await getDb();
  await withExclusiveTransaction(db, async (txn) => {
    for (const table of JSON_BLOB_TABLES) {
      await txn.runAsync(`DELETE FROM ${table};`);
    }
  });
}
