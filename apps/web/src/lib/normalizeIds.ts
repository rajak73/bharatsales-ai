import { apiClient } from '@bharatsales/api-client';

/**
 * Many API endpoints return raw Mongoose documents that carry `_id` but no
 * `id` (the API keeps that shape for the mobile app). The web pages key rows,
 * look up names and build URLs with `id`, so this adds `id` (a copy of `_id`)
 * to every object in a JSON response that doesn't already have one.
 * Additive only: nothing is removed or renamed.
 */
export function addIds(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    for (const item of value) addIds(item, depth + 1);
    return value;
  }
  const obj = value as Record<string, unknown>;
  if (obj.id == null && obj._id != null && (typeof obj._id === 'string' || typeof obj._id === 'number')) {
    obj.id = String(obj._id);
  }
  for (const key of Object.keys(obj)) {
    const child = obj[key];
    if (child !== null && typeof child === 'object') addIds(child, depth + 1);
  }
  return value;
}

let installed = false;

/** Registers the response interceptor once (idempotent for HMR). */
export function installIdNormalizer() {
  if (installed) return;
  installed = true;
  apiClient.interceptors.response.use((response) => {
    if (response.data && typeof response.data === 'object' && !(response.data instanceof Blob)) {
      addIds(response.data);
    }
    return response;
  });
}
