import { SetMetadata } from '@nestjs/common';
import { Action, Resource } from '@bharatsales/permissions';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (resource: Resource, action: Action) => SetMetadata(PERMISSIONS_KEY, { resource, action });
