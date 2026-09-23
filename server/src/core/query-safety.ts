// Helpers that keep client-supplied values from acting as MongoDB operators
// once they reach a Mongoose filter or update.
//
// The global sanitize middleware already strips `$`/dotted keys from
// req.body / req.query / req.params, and every write route validates its body
// with zod. These helpers make each service safe on its own as well (and let
// static analysis see that), without changing what valid input does.

const PROTOTYPE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Coerces a request value used as an id / exact-match filter value to a
 * string, so an object such as `{ $ne: null }` or an array (implicit `$in`)
 * can never reach the filter. `undefined` / `null` are returned unchanged so
 * an absent value behaves exactly as before.
 */
export function asId<T>(value: T): string | Extract<T, undefined | null> {
  return (value === undefined || value === null ? value : String(value)) as any;
}

/**
 * Rebuilds a (zod-validated) request body into fresh plain data for a
 * Mongoose `$set`. Strings, numbers, booleans, null and dates are kept;
 * arrays and plain objects are copied recursively; anything else (functions,
 * undefined) is dropped, as Mongoose would strip undefined anyway.
 *
 * Keys starting with `$` and prototype keys are dropped at every level.
 * Dotted keys are kept at the top level only, where they are legitimate
 * `$set` paths (e.g. `'commercial.assignedDistributorId'` on outlets), and
 * dropped inside nested values.
 */
export function toSafeUpdate(value: unknown): Record<string, any> {
  const out = toPlainValue(value, 0);
  return out !== null && typeof out === 'object' && !Array.isArray(out) && !(out instanceof Date)
    ? (out as Record<string, any>)
    : {};
}

function toPlainValue(value: unknown, depth: number): unknown {
  if (value === null) return null;
  if (typeof value === 'string') return String(value);
  if (typeof value === 'number') return Number(value);
  if (typeof value === 'boolean') return value === true;
  if (value instanceof Date) return new Date(value.getTime());
  if (depth > 20 || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) {
    const arr: unknown[] = [];
    for (const item of value) arr.push(toPlainValue(item, depth + 1));
    return arr;
  }
  const entries: [string, unknown][] = [];
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || PROTOTYPE_KEYS.has(key)) continue;
    if (depth > 0 && key.includes('.')) continue;
    const plain = toPlainValue((value as Record<string, unknown>)[key], depth + 1);
    if (plain !== undefined) entries.push([key, plain]);
  }
  return Object.fromEntries(entries);
}
