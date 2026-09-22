import { Router } from 'express';
import { z } from 'zod';
import { RBAC, Resource, Action, type Role } from '@bharatsales/permissions';
import { ForbiddenException } from '../core/http-errors';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { ReturnsService } from './returns.service';
import type { AuditService } from '../audit/audit.service';

const returnItemSchema = z.object({
  product: z.string().min(1),
  qty: z.number().positive(),
});

// organizationId comes from the JWT; value is recalculated server-side;
// the service only accepts 'Draft' / 'Submitted' as the initial status.
const createReturnSchema = z.object({
  orderId: z.string().optional(),
  outlet: z.string().min(1),
  reason: z.string().optional(),
  value: z.string().optional(),
  status: z.string().optional(),
  items: z.array(returnItemSchema).optional(),
});

// PUT /returns/:id edits descriptive fields only. Workflow/financial fields
// (status, value, managerApprovedBy, financeApprovedBy) are stripped: status
// changes must go through approve/reject so credit notes & restocking run.
const updateReturnSchema = z.object({
  orderId: z.string().optional(),
  outlet: z.string().min(1).optional(),
  reason: z.string().optional(),
  items: z.array(returnItemSchema).optional(),
});

const RETURN_STATUSES = [
  'Draft', 'Submitted', 'Pending_Approval', 'Approved', 'Received', 'Inspected', 'Closed', 'Rejected', 'Cancelled',
] as const;

const updateStatusSchema = z.object({
  status: z.enum(RETURN_STATUSES),
  restockClassification: z.enum(['saleable', 'damaged', 'quarantine', 'expired', 'return-to-vendor']).optional(),
  reason: z.string().optional(),
});

export function createReturnsRouter(deps: { returnsService: ReturnsService; auditService: AuditService }): Router {
  const { returnsService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Returns'));

  router.get('/', requirePermission(Resource.Returns, Action.Read),
    route((req) => returnsService.getReturns(req.user.orgId, req.user)));

  router.post('/', requirePermission(Resource.Returns, Action.Create), validateBody(createReturnSchema),
    route((req) => returnsService.create(req.user.orgId, req.body, req.user.sub)));

  router.put('/:id', requirePermission(Resource.Returns, Action.Update), validateBody(updateReturnSchema),
    route(async (req) => {
      await returnsService.assertCanActOnReturn(req.user.orgId, req.params.id, req.user);
      return returnsService.update(req.user.orgId, req.params.id, req.body);
    }));

  // Used by the web returns page for Received / Inspected / Closed (with the
  // restock classification). Approved / Rejected additionally need
  // Returns:Approve, like POST /:id/approve|reject.
  router.patch('/:id/status', requirePermission(Resource.Returns, Action.Update), validateBody(updateStatusSchema),
    route(async (req) => {
      const { status, restockClassification, reason } = req.body;
      if (['Approved', 'Rejected'].includes(status) && !RBAC.can(req.user.role as Role, Action.Approve, Resource.Returns)) {
        throw new ForbiddenException(`User with role ${req.user.role} does not have ${Action.Approve} permission on ${Resource.Returns}`);
      }
      await returnsService.assertCanActOnReturn(req.user.orgId, req.params.id, req.user);
      return returnsService.updateStatus(req.user.orgId, req.params.id, status, req.user.sub, reason, restockClassification);
    }));

  router.delete('/:id', requirePermission(Resource.Returns, Action.Delete),
    route(async (req) => {
      await returnsService.assertCanActOnReturn(req.user.orgId, req.params.id, req.user);
      return returnsService.remove(req.user.orgId, req.params.id);
    }));

  router.post('/:id/approve', requirePermission(Resource.Returns, Action.Approve),
    route(async (req) => {
      await returnsService.assertCanActOnReturn(req.user.orgId, req.params.id, req.user);
      return returnsService.approveReturn(req.user.orgId, req.params.id, req.user.sub);
    }));

  router.post('/:id/reject', requirePermission(Resource.Returns, Action.Approve),
    route(async (req) => {
      await returnsService.assertCanActOnReturn(req.user.orgId, req.params.id, req.user);
      return returnsService.rejectReturn(req.user.orgId, req.params.id, req.user.sub);
    }));

  return router;
}
