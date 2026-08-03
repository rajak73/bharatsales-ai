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
      error TEXT
    );
  `);
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('bharatsales.db').then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}

export async function replaceTable<T extends { id?: string; _id?: string }>(table: JsonBlobTable, items: T[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM ${table};`);
    for (const item of items) {
      const id = String(item.id ?? item._id);
      await db.runAsync(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?);`, [id, JSON.stringify({ ...item, id })]);
    }
  });
}

export async function getAll<T = any>(table: JsonBlobTable): Promise<T[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>(`SELECT data FROM ${table};`);
  return rows.map((r) => JSON.parse(r.data) as T);
}

export async function getById<T = any>(table: JsonBlobTable, id: string): Promise<T | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ data: string }>(`SELECT data FROM ${table} WHERE id = ?;`, [id]);
  return row ? (JSON.parse(row.data) as T) : null;
}
