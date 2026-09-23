import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import { ADJUSTMENT_TYPES } from './inventory.service';
import type { InventoryService } from './inventory.service';
import type { AuditService } from '../audit/audit.service';

// POST /inventory/adjust. The web inventory page sends
// { productId, batch, type, quantity, reason }; the rest are optional.
// organizationId is always taken from the JWT, and for a Distributor so is
// distributorId (enforced in InventoryService.adjustStockForUser).
const adjustStockSchema = z.object({
  productId: z.string().min(1),
  batch: z.string().min(1),
  type: z.enum(ADJUSTMENT_TYPES as unknown as [string, ...string[]]),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
  warehouseId: z.string().optional(),
  distributorId: z.string().optional(),
  expiry: z.string().optional(),
  status: z.string().min(1).max(50).optional(),
  blocked: z.boolean().optional(),
});

export function createInventoryRouter(deps: { inventoryService: InventoryService; auditService: AuditService }): Router {
  const { inventoryService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Inventory'));

  router.get('/', requirePermission(Resource.Inventory, Action.Read),
    route((req) => inventoryService.getInventory(req.user.orgId, req.user)));

  router.get('/batches/:productId', requirePermission(Resource.Inventory, Action.Read),
    route((req) => inventoryService.getBatches(req.user.orgId, req.params.productId, req.user)));

  router.post('/adjust', requirePermission(Resource.Inventory, Action.Update), validateBody(adjustStockSchema),
    route((req) => inventoryService.adjustStockForUser(req.user.orgId, req.body, req.user)));

  return router;
}
