import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { DispatchService } from './dispatch.service';
import type { AuditService } from '../audit/audit.service';

const createDispatchSchema = z.object({
  orderId: z.string().min(1),
  vehicle: z.string().optional(),
  driver: z.string().optional(),
});

const confirmDeliverySchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    deliveredQty: z.number().min(0),
    damagedQty: z.number().min(0).optional(),
    reason: z.string().optional(),
    evidence: z.array(z.string()).optional(),
  })),
});

export function createDispatchRouter(deps: { dispatchService: DispatchService; auditService: AuditService }): Router {
  const { dispatchService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Dispatch'));

  router.get('/', requirePermission(Resource.Dispatch, Action.Read),
    route((req) => dispatchService.findAll(req.user.orgId, req.user)));

  router.post('/', requirePermission(Resource.Dispatch, Action.Create), validateBody(createDispatchSchema),
    route((req) => dispatchService.createDispatch(req.user.orgId, req.body.orderId, req.user.sub, req.body, req.user)));

  router.post('/:id/deliver', requirePermission(Resource.Dispatch, Action.Update), validateBody(confirmDeliverySchema),
    route((req) => dispatchService.confirmDelivery(req.user.orgId, req.params.id, req.user.sub, req.body.items, req.user)));

  return router;
}
