/**
 * True only when running inside the Jest test runner. Test-only behaviour
 * (skipping rate limits, returning invite tokens in responses) is gated on
 * this rather than on NODE_ENV alone, because NODE_ENV=test is an accepted
 * runtime value and could be set on a deployed server by mistake; Jest's
 * JEST_WORKER_ID is never present in a normal `node dist/main.js` process.
 */
export function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' && process.env.JEST_WORKER_ID !== undefined;
}
