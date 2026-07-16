import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { RBAC, Action, Resource } from '@bharatsales/permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<{ resource: Resource; action: Action }>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermission) {
      return true; // No specific permissions required
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    const hasPermission = RBAC.can(user.role, requiredPermission.action, requiredPermission.resource);
    if (!hasPermission) {
      throw new ForbiddenException(
        `User with role ${user.role} does not have ${requiredPermission.action} permission on ${requiredPermission.resource}`
      );
    }

    return true;
  }
}
