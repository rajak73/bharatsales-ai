import { SetMetadata } from '@nestjs/common';
import { Action, Resource } from '@bharatsales/permissions';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (resource: Resource, action: Action) => SetMetadata(PERMISSIONS_KEY, { resource, action });

export const IS_PUBLIC_KEY = 'isPublic';
// Escape hatch for routes under a PermissionsGuard-protected controller that must
// stay reachable without a resource:action mapping (e.g. self-scoped or health routes).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
