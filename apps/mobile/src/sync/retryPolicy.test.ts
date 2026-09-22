import {
  isTransientSyncError, backoffDelayMs, decideRetry, describeSyncError,
  MAX_SYNC_ATTEMPTS, BASE_BACKOFF_MS, MAX_BACKOFF_MS,
} from './retryPolicy';

const httpError = (status: number, message?: string) =>
  Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data: message ? { message } : {} } });

describe('isTransientSyncError', () => {
  it('treats errors with no response (network down / timeout) as transient', () => {
    expect(isTransientSyncError(new Error('Network Error'))).toBe(true);
    expect(isTransientSyncError(Object.assign(new Error('timeout of 60000ms exceeded'), { code: 'ECONNABORTED' }))).toBe(true);
    expect(isTransientSyncError(undefined)).toBe(true);
  });

  it.each([500, 502, 503, 504, 408, 429])('treats HTTP %i as transient', (status) => {
    expect(isTransientSyncError(httpError(status))).toBe(true);
  });

  it.each([400, 401, 403, 404, 409, 422])('treats HTTP %i as permanent', (status) => {
    expect(isTransientSyncError(httpError(status))).toBe(false);
  });
});

describe('backoffDelayMs', () => {
  it('doubles each attempt starting from the base delay', () => {
    expect(backoffDelayMs(1)).toBe(BASE_BACKOFF_MS);
    expect(backoffDelayMs(2)).toBe(BASE_BACKOFF_MS * 2);
    expect(backoffDelayMs(3)).toBe(BASE_BACKOFF_MS * 4);
  });

  it('is capped', () => {
    expect(backoffDelayMs(50)).toBe(MAX_BACKOFF_MS);
  });

  it('treats non-positive attempts as the first attempt', () => {
    expect(backoffDelayMs(0)).toBe(BASE_BACKOFF_MS);
  });
});

describe('decideRetry', () => {
  const now = 1_000_000;

  it('schedules a retry with backoff for a transient error', () => {
    const d = decideRetry(httpError(503), 0, now);
    expect(d).toEqual({ kind: 'retry', attempts: 1, nextAttemptAt: now + BASE_BACKOFF_MS, error: expect.any(String) });
  });

  it('increments attempts and grows the delay', () => {
    const d = decideRetry(new Error('Network Error'), 2, now);
    expect(d.kind).toBe('retry');
    if (d.kind === 'retry') {
      expect(d.attempts).toBe(3);
      expect(d.nextAttemptAt).toBe(now + BASE_BACKOFF_MS * 4);
    }
  });

  it('fails immediately on a permanent 4xx', () => {
    const d = decideRetry(httpError(400, 'Credit limit exceeded'), 0, now);
    expect(d).toEqual({ kind: 'fail', attempts: 1, error: 'Credit limit exceeded (HTTP 400)' });
  });

  it('gives up after MAX_SYNC_ATTEMPTS transient failures', () => {
    expect(decideRetry(httpError(500), MAX_SYNC_ATTEMPTS - 2, now).kind).toBe('retry');
    expect(decideRetry(httpError(500), MAX_SYNC_ATTEMPTS - 1, now).kind).toBe('fail');
  });
});

describe('describeSyncError', () => {
  it('prefers the server message and joins validation arrays', () => {
    expect(describeSyncError(httpError(422, ['a', 'b'] as any))).toBe('a, b (HTTP 422)');
  });

  it('falls back to the error message', () => {
    expect(describeSyncError(new Error('Network Error'))).toBe('Network Error');
  });
});
