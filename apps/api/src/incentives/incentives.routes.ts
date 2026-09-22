import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission, requireRoles } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { IncentivesService } from './incentives.service';
import type { AuditService } from '../audit/audit.service';

const createPlanSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  slab: z.string(),
  target: z.string(),
  eligible: z.string(),
  payout: z.string(),
  status: z.enum(['Active', 'Draft', 'Inactive']).optional(),
});

const createPayoutSchema = z.object({
  rep: z.string().min(1),
  period: z.string().min(1),
  target: z.coerce.number(),
  achieved: z.coerce.number(),
  incentive: z.coerce.number(),
  // No status: payouts always start Pending; approval is a separate step.
});

const payoutStatusSchema = z.object({
  status: z.enum(['Approved', 'Paid']),
});

export function createIncentivesRouter(deps: { incentivesService: IncentivesService; auditService: AuditService }): Router {
  const { incentivesService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Incentives'));

  router.get('/plans', requirePermission(Resource.Targets, Action.Read),
    route((req) => incentivesService.getIncentivePlans(req.user.orgId)));

  router.get('/payouts', requirePermission(Resource.Targets, Action.Read),
    route((req) => incentivesService.getIncentivePayouts(req.user.orgId, req.user)));

  router.post('/plans', requirePermission(Resource.Targets, Action.Create), validateBody(createPlanSchema),
    route((req) => incentivesService.createIncentivePlan(req.user.orgId, req.body)));

  router.post('/payouts', requirePermission(Resource.Targets, Action.Create), validateBody(createPayoutSchema),
    route((req) => incentivesService.createIncentivePayout(req.user.orgId, req.body, req.user)));

  // Approving / paying out money is an Organization Admin decision.
  router.patch('/payouts/:id/status', requireRoles('Organization Admin'), validateBody(payoutStatusSchema),
    route((req) => incentivesService.updatePayoutStatus(req.user.orgId, req.params.id, req.body.status)));

  return router;
}
