import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { PriceListsService } from './price-lists.service';
import type { AuditService } from '../audit/audit.service';

// organizationId/_id/timestamps are never accepted from the client.
// pricingRules is free-form by design (Record<string, any> in shared-types);
// it is stored as a value, and the global sanitizer already strips $/dot keys.
const createPriceListSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['Customer', 'Customer Group']),
  status: z.enum(['Active', 'Inactive']),
  validFrom: z.string(),
  validTo: z.string().optional(),
  pricingRules: z.record(z.any()).optional(),
});

const updatePriceListSchema = createPriceListSchema.partial();

export function createPriceListsRouter(deps: { priceListsService: PriceListsService; auditService: AuditService }): Router {
  const { priceListsService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'PriceList'));

  router.get('/', requirePermission(Resource.PriceLists, Action.Read),
    route((req) => priceListsService.findAllByOrgId(req.user.orgId)));

  router.post('/', requirePermission(Resource.PriceLists, Action.Create), validateBody(createPriceListSchema),
    route((req) => priceListsService.create(req.user.orgId, req.body)));

  router.put('/:id', requirePermission(Resource.PriceLists, Action.Update), validateBody(updatePriceListSchema),
    route((req) => priceListsService.update(req.user.orgId, req.params.id, req.body)));

  router.delete('/:id', requirePermission(Resource.PriceLists, Action.Delete),
    route((req) => priceListsService.remove(req.user.orgId, req.params.id)));

  return router;
}
