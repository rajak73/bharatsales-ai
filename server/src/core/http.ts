import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodTypeAny } from 'zod';
import { BadRequestException } from './http-errors';

// Authenticated user attached by `authenticate` — same JWT payload shape the
// Nest JwtAuthGuard used to put on request.user.
export interface AuthUser {
  sub: string;
  id?: string;
  email?: string;
  orgId: string;
  role: string;
  distributorId?: string;
  platformAdmin?: boolean;
  [key: string]: any;
}

export type AuthedRequest = Request & { user: AuthUser };

type Handler = (req: AuthedRequest, res: Response) => Promise<any> | any;

/**
 * Wraps a route handler the way Nest did:
 *  - the handler's return value is sent as JSON,
 *  - status defaults to 201 for POST and 200 otherwise (Nest's default),
 *    overridable per route (Nest's @HttpCode),
 *  - thrown errors go to the central error handler.
 * A handler that already wrote the response (e.g. res.download, SSE) is left alone.
 */
export function route(handler: Handler, opts: { status?: number } = {}): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await handler(req as AuthedRequest, res);
      if (res.headersSent) return;
      const status = opts.status ?? (req.method === 'POST' ? 201 : 200);
      if (result === undefined || result === null) {
        res.status(status).end();
      } else if (typeof result === 'string') {
        res.status(status).send(result);
      } else {
        res.status(status).json(result);
      }
    } catch (err) {
      next(err);
    }
  };
}

function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message));
}

/**
 * Validates and replaces req.body with the parsed value. Unknown keys are
 * stripped (zod's default for z.object), which is what prevents clients from
 * mass-assigning fields like platformAdmin/role/status that the route does
 * not explicitly accept.
 */
export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return next(new BadRequestException(formatZodError(parsed.error)));
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return next(new BadRequestException(formatZodError(parsed.error)));
    }
    // req.query is a getter in Express 5; assigning works in Express 4.
    (req as any).query = parsed.data;
    next();
  };
}
