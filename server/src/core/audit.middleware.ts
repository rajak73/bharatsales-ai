import type { RequestHandler } from 'express';

// Minimal interface so this file doesn't depend on the AuditService module.
export interface AuditLogger {
  logAction(entry: {
    organizationId?: string;
    actorId?: string;
    actorRole?: string;
    action: string;
    entityName: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    deviceInfo?: string;
    reason?: string;
  }): Promise<any>;
}

// Never persist credentials or one-time secrets into audit_logs. Keys are
// matched case-insensitively by pattern rather than exact name, so e.g.
// `adminPassword`, `Password`, `pin`, `apiKey` or `clientSecret` are covered
// if a future audited route accepts them. Ordinary fields that merely
// contain such a word (pinCode, idempotencyKey) are kept.
const SECRET_SUBSTRINGS = ['password', 'passwd', 'passcode', 'secret', 'token', 'apikey', 'credential'];
const SECRET_WORDS = new Set(['pass', 'otp', 'cvv', 'mpin']);
const KEY_QUALIFIERS = new Set(['api', 'private', 'secret', 'access', 'signing', 'encryption']);

export function isRedactedKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (SECRET_SUBSTRINGS.some((w) => lower.includes(w))) return true;
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_\-.]+/)
    .map((w) => w.toLowerCase())
    .filter(Boolean);
  if (words.some((w) => SECRET_WORDS.has(w))) return true;
  const last = words[words.length - 1];
  if (last === 'pin') return true;
  if (last === 'key' && words.length > 1 && KEY_QUALIFIERS.has(words[words.length - 2])) return true;
  return false;
}

function redact(value: any, depth = 0): any {
  if (depth > 10 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  // Built with Object.fromEntries (define, not assign), and prototype-chain
  // keys are skipped, so a body key such as "__proto__" can never change the
  // copy's prototype.
  return Object.fromEntries(
    Object.entries(value)
      .filter(([k]) => k !== '__proto__' && k !== 'constructor' && k !== 'prototype')
      .map(([k, v]) => [k, isRedactedKey(k) ? '[REDACTED]' : redact(v, depth + 1)]),
  );
}

/**
 * Replaces @AuditEntity(name) + AuditInterceptor: after a successful
 * (2xx/3xx) POST/PUT/PATCH/DELETE by an authenticated user, writes an audit
 * log entry. Logged on the response's 'finish' event, so mutations answered
 * with no body (res.end), a string (res.send) or JSON are all audited, as
 * Nest's interceptor did; the entity id is taken from a JSON body when there
 * is one, else from :id. Mount after `authenticate`.
 *
 * Difference from Nest: the write is not awaited before the response is
 * sent (a failed audit write is logged, never turned into a 500).
 */
export function audit(auditService: AuditLogger, entityName: string): RequestHandler {
  return (req, res, next) => {
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) return next();

    let jsonBody: any;
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      jsonBody = body;
      return originalJson(body);
    };

    res.once('finish', () => {
      const user = (req as any).user;
      if (!user || res.statusCode >= 400) return;
      const entityId =
        jsonBody?.id || jsonBody?._id?.toString() || (req.params as any)?.id || undefined;
      auditService
        .logAction({
          organizationId: user.orgId,
          actorId: user.sub || user.id,
          actorRole: user.role,
          action: req.method,
          entityName,
          entityId,
          details: { body: redact(req.body), params: req.params },
          ipAddress: req.ip || req.socket?.remoteAddress,
          deviceInfo: req.headers['user-agent'] as string | undefined,
          reason: (req.headers['x-audit-reason'] as string | undefined) || req.body?.reason,
        })
        .catch((err) => console.error('Audit Log Error:', err));
    });
    next();
  };
}
