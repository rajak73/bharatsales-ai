// Pure retry/backoff classification for the offline sync queue — kept free
// of SQLite/NetInfo imports so it can be unit-tested directly.

export const MAX_SYNC_ATTEMPTS = 8;
export const BASE_BACKOFF_MS = 5_000;
export const MAX_BACKOFF_MS = 30 * 60 * 1000;

/**
 * True when the failure is worth retrying automatically: no HTTP response at
 * all (offline, DNS, timeout, connection reset, cold-starting server), any
 * 5xx, 408 Request Timeout or 429 Too Many Requests. Any other 4xx means the
 * server looked at the request and rejected it — retrying the identical
 * payload will not help, so it needs a human (Retry/Discard in the UI).
 */
export function isTransientSyncError(error: unknown): boolean {
  const status = (error as any)?.response?.status;
  if (typeof status !== 'number') return true;
  if (status >= 500) return true;
  if (status === 408 || status === 429) return true;
  return false;
}

/** Exponential backoff: 5s, 10s, 20s, ... capped at 30 minutes. */
export function backoffDelayMs(attempts: number): number {
  const n = Math.max(1, Math.floor(attempts));
  return Math.min(BASE_BACKOFF_MS * 2 ** (n - 1), MAX_BACKOFF_MS);
}

export function describeSyncError(error: unknown): string {
  const e = error as any;
  const serverMessage = e?.response?.data?.message;
  const message = Array.isArray(serverMessage) ? serverMessage.join(', ') : serverMessage;
  const status = e?.response?.status;
  const text = message || e?.message || 'Sync failed';
  return typeof status === 'number' ? `${text} (HTTP ${status})` : String(text);
}

export type RetryDecision =
  | { kind: 'retry'; attempts: number; nextAttemptAt: number; error: string }
  | { kind: 'fail'; attempts: number; error: string };

/**
 * Decides what happens to a queue item after a failed attempt.
 * @param previousAttempts attempts already recorded before this one
 */
export function decideRetry(error: unknown, previousAttempts: number, now: number = Date.now()): RetryDecision {
  const attempts = (previousAttempts || 0) + 1;
  const message = describeSyncError(error);
  if (!isTransientSyncError(error) || attempts >= MAX_SYNC_ATTEMPTS) {
    return { kind: 'fail', attempts, error: message };
  }
  return { kind: 'retry', attempts, nextAttemptAt: now + backoffDelayMs(attempts), error: message };
}
