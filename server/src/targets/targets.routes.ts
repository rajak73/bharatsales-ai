import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { TargetsService } from './targets.service';
import type { AuditService } from '../audit/audit.service';

// actualValue and status are computed (calculateForTargets / the midnight
// rollup) and are not client-settable; the web page's actualValue: 0 /
// status: 'On Track' on create are stripped and the schema defaults apply.
const targetFields = {
  entityType: z.enum(['User', 'Territory', 'Outlet']),
  entityId: z.string().min(1),
  period: z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  targetValue: z.coerce.number().min(0),
  targetMetric: z.enum(['SalesValue', 'VisitCount', 'ProductiveCalls', 'CollectionValue']).optional(),
};

const createTargetSchema = z.object(targetFields);
const updateTargetSchema = z.object(targetFields).partial();

export function createTargetsRouter(deps: { targetsService: TargetsService; auditService: AuditService }): Router {
  const { targetsService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Targets'));

  router.get('/', requirePermission(Resource.Targets, Action.Read),
    route((req) => targetsService.getTargets(req.user.orgId)));

  router.post('/', requirePermission(Resource.Targets, Action.Create), validateBody(createTargetSchema),
    route((req) => targetsService.createTarget(req.user.orgId, req.user.role, req.body)));

  router.put('/:id', requirePermission(Resource.Targets, Action.Update), validateBody(updateTargetSchema),
    route((req) => targetsService.updateTarget(req.user.orgId, req.params.id, req.body, req.user.role)));

  router.delete('/:id', requirePermission(Resource.Targets, Action.Delete),
    route((req) => targetsService.deleteTarget(req.user.orgId, req.params.id)));

  return router;
}
