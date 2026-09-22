import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { ApprovalsService } from './approvals.service';
import type { AuditService } from '../audit/audit.service';

const priority = z.enum(['High', 'Medium', 'Low']);

// organizationId, date and status are set by the service on create.
const createApprovalSchema = z.object({
  outlet: z.string(),
  order: z.string(),
  type: z.string(),
  reason: z.string(),
  amount: z.coerce.number(),
  priority,
  // requestedBy is always the caller (req.user.sub), never client-set.
});

// The web approvals page sends { status }; reason/priority may be edited.
const updateApprovalSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Rejected']).optional(),
  reason: z.string().optional(),
  priority: priority.optional(),
});

const createRuleSchema = z.object({
  trigger: z.string(),
  approver: z.string(),
  enabled: z.boolean().optional(),
});

const updateRuleSchema = createRuleSchema.partial();

export function createApprovalsRouter(deps: { approvalsService: ApprovalsService; auditService: AuditService }): Router {
  const { approvalsService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Approvals'));

  // Static /rules paths first so they are never captured by /:id.
  router.get('/rules', requirePermission(Resource.Approvals, Action.Read),
    route((req) => approvalsService.findAllRules(req.user.orgId)));

  // Approval routing rules are tenant configuration: Organization Admin only
  // (Settings:Update / Settings:Delete). No role held Approvals:Update/Delete,
  // and Approvals:Create let Sales Representatives write rules.
  router.post('/rules', requirePermission(Resource.Settings, Action.Update), validateBody(createRuleSchema),
    route((req) => approvalsService.createRule(req.user.orgId, req.body)));

  router.put('/rules/:id', requirePermission(Resource.Settings, Action.Update), validateBody(updateRuleSchema),
    route((req) => approvalsService.updateRule(req.user.orgId, req.params.id, req.body)));

  router.delete('/rules/:id', requirePermission(Resource.Settings, Action.Delete),
    route((req) => approvalsService.deleteRule(req.user.orgId, req.params.id)));

  router.get('/', requirePermission(Resource.Approvals, Action.Read),
    route((req) => approvalsService.findAllApprovals(req.user.orgId)));

  router.post('/', requirePermission(Resource.Approvals, Action.Create), validateBody(createApprovalSchema),
    route((req) => approvalsService.createApproval(req.user.orgId, { ...req.body, requestedBy: req.user.sub })));

  // Approving/rejecting a request is Approvals:Approve (Org Admin, Sales
  // Manager); Approvals:Update was held by no role, so this always 403'd.
  router.put('/:id', requirePermission(Resource.Approvals, Action.Approve), validateBody(updateApprovalSchema),
    route((req) => approvalsService.updateApproval(req.user.orgId, req.params.id, req.body)));

  router.delete('/:id', requirePermission(Resource.Settings, Action.Delete),
    route((req) => approvalsService.deleteApproval(req.user.orgId, req.params.id)));

  return router;
}
