import type { RequestHandler } from 'express';

// Blocks MongoDB operator injection: any object key that starts with `$` or
// contains `.` is removed from req.body / req.query / req.params before a
// route sees it, so a client can never turn `{ "refreshToken": "..." }` into
// `{ "refreshToken": { "$ne": "" } }` inside a Mongoose filter.
// Also dropped: keys that could reach an object's prototype chain if a later
// handler copies the object (prototype pollution). JSON.parse keeps
// "__proto__" as an ordinary own key, so it has to be removed explicitly.
function isUnsafeKey(key: string): boolean {
  return (
    key === '__proto__' ||
    key === 'constructor' ||
    key === 'prototype' ||
    key.startsWith('$') ||
    key.includes('.')
  );
}

// Cleans in place (strip returns the same object it was given), so nested
// values never need to be written back.
function strip(value: any, depth = 0): any {
  if (depth > 20 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    for (const item of value) strip(item, depth + 1);
    return value;
  }
  for (const key of Object.keys(value)) {
    if (isUnsafeKey(key)) {
      Reflect.deleteProperty(value, key);
    } else {
      strip(value[key], depth + 1);
    }
  }
  return value;
}

export const sanitizeInput: RequestHandler = (req, _res, next) => {
  if (req.body) strip(req.body);
  if (req.query) strip(req.query);
  if (req.params) strip(req.params);
  next();
};
