import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { SchemesService } from './schemes.service';
import type { AuditService } from '../audit/audit.service';

// organizationId/_id/timestamps are never accepted from the client.
const createSchemeSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  type: z.enum(['PERCENTAGE_DISCOUNT', 'FREE_ITEM']),
  isActive: z.boolean().optional(),
  applicableProductIds: z.array(z.string()).optional(),
  minQuantity: z.number().min(0),
  minOrderValue: z.number().min(0),
  discountPercentage: z.number().min(0).max(100).optional(),
  freeProductId: z.string().optional(),
  freeQuantity: z.number().min(1).optional(),
  validFrom: z.string(),
  validUntil: z.string(),
});

const updateSchemeSchema = createSchemeSchema.partial();

export function createSchemesRouter(deps: { schemesService: SchemesService; auditService: AuditService }): Router {
  const { schemesService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Scheme'));

  router.get('/', requirePermission(Resource.Schemes, Action.Read),
    route((req) => schemesService.findAllByOrgId(req.user.orgId)));

  router.post('/', requirePermission(Resource.Schemes, Action.Create), validateBody(createSchemeSchema),
    route((req) => schemesService.create(req.user.orgId, req.body)));

  router.put('/:id', requirePermission(Resource.Schemes, Action.Update), validateBody(updateSchemeSchema),
    route((req) => schemesService.update(req.user.orgId, req.params.id, req.body)));

  router.delete('/:id', requirePermission(Resource.Schemes, Action.Delete),
    route((req) => schemesService.remove(req.user.orgId, req.params.id)));

  return router;
}
