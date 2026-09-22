import type { RequestHandler } from 'express';

// Blocks MongoDB operator injection: any object key that starts with `$` or
// contains `.` is removed from req.body / req.query / req.params before a
// route sees it, so a client can never turn `{ "refreshToken": "..." }` into
// `{ "refreshToken": { "$ne": "" } }` inside a Mongoose filter.
function strip(value: any, depth = 0): any {
  if (depth > 20 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = strip(value[i], depth + 1);
    return value;
  }
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key];
    } else {
      value[key] = strip(value[key], depth + 1);
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
