import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { TaxRatesService } from './tax-rates.service';
import type { AuditService } from '../audit/audit.service';

// organizationId/_id/timestamps are never accepted from the client.
const createTaxRateSchema = z.object({
  name: z.string().min(1),
  percentage: z.number(),
  country: z.string().min(1),
  region: z.string().optional(),
});

const updateTaxRateSchema = createTaxRateSchema.partial();

export function createTaxRatesRouter(deps: { taxRatesService: TaxRatesService; auditService: AuditService }): Router {
  const { taxRatesService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'TaxRate'));

  router.get('/', requirePermission(Resource.TaxRates, Action.Read),
    route((req) => taxRatesService.findAllByOrgId(req.user.orgId)));

  router.post('/', requirePermission(Resource.TaxRates, Action.Create), validateBody(createTaxRateSchema),
    route((req) => taxRatesService.create(req.user.orgId, req.body)));

  router.put('/:id', requirePermission(Resource.TaxRates, Action.Update), validateBody(updateTaxRateSchema),
    route((req) => taxRatesService.update(req.user.orgId, req.params.id, req.body)));

  router.delete('/:id', requirePermission(Resource.TaxRates, Action.Delete),
    route((req) => taxRatesService.remove(req.user.orgId, req.params.id)));

  return router;
}
