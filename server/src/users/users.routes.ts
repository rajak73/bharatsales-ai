import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import { emailField, passwordField } from '../core/validation';
import type { UsersService } from './users.service';
import type { AuditService } from '../audit/audit.service';

const roleSchema = z.enum(['Super Admin', 'Organization Admin', 'Sales Manager', 'Sales Representative', 'Distributor']);
const statusSchema = z.enum(['Active', 'Inactive', 'Suspended', 'Invited']);

// Only the fields a user record may legitimately receive from a client.
// Unknown keys (platformAdmin, organizationId, emailVerified,
// failedLoginAttempts, lockedUntil, pushToken, _id, ...) are stripped by zod;
// UsersService also whitelists again as defence in depth.
const createUserSchema = z.object({
  email: emailField,
  name: z.string().optional(),
  password: passwordField.optional(),
  role: roleSchema.optional(),
  mobile: z.string().optional(),
  status: statusSchema.optional(),
  territoryIds: z.array(z.string()).optional(),
  // Honoured only when an Organization Admin creates a Distributor-role user.
  distributorId: z.string().optional(),
});

const updateUserSchema = z.object({
  email: emailField.optional(),
  name: z.string().optional(),
  password: passwordField.optional(),
  role: roleSchema.optional(),
  mobile: z.string().optional(),
  status: statusSchema.optional(),
  territoryIds: z.array(z.string()).optional(),
});

const inviteUserSchema = z.object({
  email: emailField,
  role: roleSchema,
  name: z.string().optional(),
  territoryIds: z.array(z.string()).optional(),
  mobile: z.string().trim().max(20).optional(),
});

export function createUsersRouter(deps: { usersService: UsersService; auditService: AuditService }): Router {
  const { usersService, auditService } = deps;
  const router = Router();
  router.use(authenticate);

  router.get('/', requirePermission(Resource.Users, Action.Read),
    route((req) => usersService.findAllByOrgId(req.user.orgId, req.user)));

  // Static path before '/:id'.
  router.post('/invites', requirePermission(Resource.Users, Action.Create), audit(auditService, 'User_Invite'),
    validateBody(inviteUserSchema),
    route((req) => {
      const data = req.body;
      return usersService.inviteUser(
        req.user.orgId, req.user.role, data.email, data.role, data.name, data.territoryIds, req.user.distributorId, data.mobile,
      );
    }));

  router.post('/', requirePermission(Resource.Users, Action.Create), audit(auditService, 'User'),
    validateBody(createUserSchema),
    route((req) => usersService.createUser(req.user.orgId, req.user.role, req.body, req.user.distributorId)));

  router.put('/:id', requirePermission(Resource.Users, Action.Update), audit(auditService, 'User'),
    validateBody(updateUserSchema),
    route((req) => usersService.updateUser(req.user.orgId, req.user, req.params.id, req.body)));

  router.delete('/:id', requirePermission(Resource.Users, Action.Delete), audit(auditService, 'User'),
    route((req) => usersService.deleteUser(req.user.orgId, req.user, req.params.id)));

  return router;
}
