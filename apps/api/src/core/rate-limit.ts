import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { isTestRuntime } from './runtime';

// Brute-force / credential-stuffing protection for the public auth endpoints.
//
// Each endpoint group has its own limiter instance (so its own counter):
// a burst of logins never eats into the refresh budget and vice versa.
// Credential endpoints are keyed on IP + submitted email, so many users
// sharing one office NAT / carrier CGNAT address do not throttle each other,
// while repeated guesses against one account from one address are still capped.
//
// Skipped only inside the Jest runtime (see isTestRuntime) so integration
// specs can hammer the auth routes freely.
//
// Note: req.ip depends on the app's `trust proxy` setting (TRUST_PROXY env,
// see app.ts), which must match the real deployment.

const WINDOW_MS = 15 * 60 * 1000;

const tooMany = {
  statusCode: 429,
  message: 'Too many requests, please try again later.',
  error: 'Too Many Requests',
};

function ipKey(req: Request): string {
  return ipKeyGenerator(req.ip || req.socket?.remoteAddress || 'unknown');
}

function ipEmailKey(req: Request): string {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return `${ipKey(req)}|${email}`;
}

function makeLimiter(limit: number, keyGenerator: (req: Request) => string) {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => isTestRuntime(),
    keyGenerator,
    // Same { statusCode, message, error } body shape as every other API error.
    statusCode: 429,
    message: tooMany,
  });
}

/** POST /auth/login — 20 attempts / 15 min per IP + email. */
export const loginLimiter = makeLimiter(20, ipEmailKey);
/** POST /auth/otp/request, /auth/otp/verify — 10 / 15 min per IP + email. */
export const otpLimiter = makeLimiter(10, ipEmailKey);
/** POST /auth/forgot-password — 10 / 15 min per IP + email. */
export const forgotPasswordLimiter = makeLimiter(10, ipEmailKey);
/** POST /auth/reset-password — 20 / 15 min per IP (body carries a token, no email). */
export const resetPasswordLimiter = makeLimiter(20, ipKey);
/** POST /auth/register — 20 / 15 min per IP. */
export const registerLimiter = makeLimiter(20, ipKey);
/**
 * POST /auth/refresh — refresh tokens are 32+ random bytes, so this only
 * guards against abuse, not guessing. Every active user refreshes about once
 * per 15-minute access-token lifetime, so the per-IP budget is generous
 * enough for a large office NAT.
 */
export const refreshLimiter = makeLimiter(5000, ipKey);
/**
 * Coarse per-IP ceiling on the credential endpoints (login/OTP/forgot),
 * so rotating the email cannot turn one IP into unlimited attempts. High
 * enough that a shared NAT of a few hundred users is unaffected.
 */
export const credentialIpLimiter = makeLimiter(300, ipKey);

/**
 * Global API ceiling. The Nest app had no working global limit, so this is
 * deliberately loose: it only exists to stop a single runaway client.
 * Keyed on the authenticated user (verified access token) when present, so
 * many reps / dashboards behind one NAT or proxy IP each get their own budget
 * (live-map polling, offline-queue sync bursts, report polling); anonymous
 * requests fall back to a per-IP key.
 */
const BEARER_RE = /^Bearer ([A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+)$/;
const keyCache = new WeakMap<Request, string>();

/**
 * The `sub` of a validly signed, unexpired access token, else undefined.
 * The Authorization header only ever selects *which* bucket a request is
 * counted in, and only after the token's signature has been verified with the
 * server secret: a missing, malformed or forged token is counted against the
 * client IP instead, so no header value can skip the limiter.
 */
function verifiedSubject(req: Request): string | undefined {
  const secret = process.env.JWT_SECRET;
  const match = BEARER_RE.exec(String(req.headers.authorization ?? ''));
  try {
    // jwt.verify throws for an empty token / missing secret, which is the
    // anonymous (per-IP) case.
    const payload = jwt.verify(match ? match[1] : '', secret || '', { algorithms: ['HS256'] }) as any;
    return typeof payload?.sub === 'string' && payload.sub ? payload.sub : undefined;
  } catch {
    return undefined;
  }
}

function userOrIpKey(req: Request): string {
  // `limit` and `keyGenerator` both need the key: verify the JWT once per request.
  const cached = keyCache.get(req);
  if (cached) return cached;
  const sub = verifiedSubject(req);
  const key = sub ? `user:${sub}` : `ip:${ipKey(req)}`;
  keyCache.set(req, key);
  return key;
}

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  // 1200/min per user (20 req/s sustained); 3000/min for a shared anonymous IP.
  limit: (req: Request) => (userOrIpKey(req).startsWith('user:') ? 1200 : 3000),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => isTestRuntime(),
  keyGenerator: userOrIpKey,
  statusCode: 429,
  message: tooMany,
});
