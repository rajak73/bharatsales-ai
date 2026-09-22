import * as SecureStore from '../storage/secureStore';

// The API has no "get my active visit" endpoint, so the id returned by
// check-in is persisted here. Without it, navigating away from the outlet
// screen (or the app restarting) lost the id and Check Out became impossible.
// The server allows only one active visit per user, so a single slot that
// records which outlet it belongs to is enough.
const ACTIVE_VISIT_KEY = 'bharatsales_active_visit';

export interface StoredActiveVisit {
  outletId: string;
  visitId: string;
  userId?: string;
  checkedInAt: number;
}

export async function getStoredActiveVisit(outletId: string, userId?: string): Promise<StoredActiveVisit | null> {
  try {
    const raw = await SecureStore.getItemAsync(ACTIVE_VISIT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredActiveVisit;
    if (parsed.outletId !== outletId) return null;
    if (userId && parsed.userId && parsed.userId !== userId) return null;
    return parsed;
  } catch (err) {
    console.warn('[ActiveVisit] read failed', err);
    return null;
  }
}

export async function setStoredActiveVisit(visit: StoredActiveVisit): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACTIVE_VISIT_KEY, JSON.stringify(visit));
  } catch (err) {
    console.warn('[ActiveVisit] write failed', err);
  }
}

export async function clearStoredActiveVisit(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACTIVE_VISIT_KEY);
  } catch (err) {
    console.warn('[ActiveVisit] clear failed', err);
  }
}

// Cheap RFC4122-ish v4 generator (no crypto.randomUUID in the RN JS engine by
// default); only needs to be unique, not cryptographically strong.
export function uuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
