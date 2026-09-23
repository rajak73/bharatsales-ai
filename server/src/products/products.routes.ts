import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { ProductsService } from './products.service';
import type { AuditService } from '../audit/audit.service';

const pricingSchema = z.object({
  mrp: z.number().min(0),
  basePrice: z.number().min(0),
  pts: z.number().min(0),
  ptr: z.number().min(0),
  gstPercentage: z.number().min(0),
  tierPricing: z.record(z.number()).optional(),
});

const stockSchema = z.object({
  available: z.number().min(0),
  uom: z.string(),
  conversionFactor: z.number().min(1).optional(),
});

const taxHistorySchema = z.array(z.object({ rate: z.number(), effectiveFrom: z.string() }));

// organizationId/_id/createdAt/updatedAt are never accepted from the client.
const createProductSchema = z.object({
  sku: z.string(),
  name: z.string(),
  brand: z.string(),
  category: z.string(),
  status: z.enum(['Active', 'Inactive']).optional(),
  hsn: z.string().optional(),
  moq: z.number().min(1).optional(),
  shelfLifeDays: z.number().optional(),
  pricing: pricingSchema,
  stock: stockSchema,
  taxHistory: taxHistorySchema.optional(),
});

// pricing/stock stay whole objects on update (the service's PTR <= MRP check
// needs both values, and $set replaces the subdocument as before).
const updateProductSchema = createProductSchema.partial();

export function createProductsRouter(deps: { productsService: ProductsService; auditService: AuditService }): Router {
  const { productsService, auditService } = deps;
  const router = Router();
  router.use(authenticate);

  router.get('/', requirePermission(Resource.Products, Action.Read),
    route((req) => productsService.findAllByOrgId(req.user.orgId)));

  router.get('/catalog', requirePermission(Resource.Products, Action.Read),
    route((req) => productsService.getCatalog(req.user.orgId)));

  router.get('/:id/outlet/:outletId', requirePermission(Resource.Products, Action.Read),
    route((req) => productsService.getProductForOutlet(req.user.orgId, req.params.id, req.params.outletId)));

  router.post('/', requirePermission(Resource.Products, Action.Create), audit(auditService, 'Product'),
    validateBody(createProductSchema),
    route((req) => productsService.create(req.user.orgId, req.body)));

  router.put('/:id', requirePermission(Resource.Products, Action.Update), audit(auditService, 'Product'),
    validateBody(updateProductSchema),
    route((req) => productsService.update(req.user.orgId, req.params.id, req.body)));

  router.delete('/:id', requirePermission(Resource.Products, Action.Delete), audit(auditService, 'Product'),
    route((req) => productsService.remove(req.user.orgId, req.params.id)));

  return router;
}
