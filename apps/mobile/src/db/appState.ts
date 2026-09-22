import { getById, upsertRow } from './client';

// Last-known values of small live-only data, so the app can still show them
// after being restarted without a connection. Stored in the per-user cache
// (cleared on logout like every other cached table).

export async function readAppState<T>(key: string): Promise<T | undefined> {
  try {
    const row = await getById<{ id: string; value: T }>('appState', key);
    return row ? row.value : undefined;
  } catch {
    return undefined;
  }
}

export async function writeAppState<T>(key: string, value: T): Promise<void> {
  try {
    await upsertRow('appState', { id: key, value });
  } catch (err) {
    console.warn(`[appState] could not save ${key}`, err);
  }
}

/** True for a failure where the server never answered (offline, DNS, timeout). */
export function isNoResponseError(error: unknown): boolean {
  return typeof (error as any)?.response?.status !== 'number';
}
