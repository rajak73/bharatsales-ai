import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { RBAC, Action, Resource } from '@bharatsales/permissions';
import { UnauthorizedException, ForbiddenException } from './http-errors';

// Replaces the Nest JwtAuthGuard: verifies the Bearer access token and puts
// its payload ({ sub, email, orgId, role, ... }) on req.user.
export const authenticate: RequestHandler = (req, _res, next) => {
  const [type, token] = req.headers.authorization?.split(' ') ?? [];
  if (type !== 'Bearer' || !token) {
    return next(new UnauthorizedException('Authentication token is missing'));
  }
  try {
    (req as any).user = jwt.verify(token, process.env.JWT_SECRET as string, { algorithms: ['HS256'] });
    next();
  } catch {
    next(new UnauthorizedException('Authentication token is invalid or expired'));
  }
};

// Replaces PermissionsGuard + @RequirePermissions(resource, action).
export function requirePermission(resource: Resource, action: Action): RequestHandler {
  return (req, _res, next) => {
    const user = (req as any).user;
    if (!user || !user.role) {
      return next(new ForbiddenException('User role not found'));
    }
    if (!RBAC.can(user.role, action, resource)) {
      return next(
        new ForbiddenException(`User with role ${user.role} does not have ${action} permission on ${resource}`),
      );
    }
    next();
  };
}

// Replaces RolesGuard + @Roles(...).
export function requireRoles(...roles: string[]): RequestHandler {
  return (req, _res, next) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return next(new ForbiddenException('Forbidden resource'));
    }
    next();
  };
}

// Platform (Super Admin) routes. The JWT's platformAdmin claim is only
// trusted because users can no longer set that field through any API body.
export const requirePlatformAdmin: RequestHandler = (req, _res, next) => {
  const user = (req as any).user;
  if (!user || (user.platformAdmin !== true && user.role !== 'Super Admin')) {
    return next(new ForbiddenException('Only platform administrators can access this endpoint'));
  }
  next();
};
