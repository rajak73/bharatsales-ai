import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { FinanceService } from './finance.service';
import type { AuditService } from '../audit/audit.service';

const generateInvoiceSchema = z.object({
  orderId: z.string().min(1),
});

// Mounted at /api/v1/finance.
export function createFinanceRouter(deps: { financeService: FinanceService; auditService: AuditService }): Router {
  const { financeService, auditService } = deps;
  const router = Router();
  // The Nest controller was tagged @AuditEntity('Orders'); kept as-is.
  router.use(authenticate, audit(auditService, 'Orders'));

  router.get('/invoices', requirePermission(Resource.Invoices, Action.Read),
    route((req) => financeService.getInvoices(req.user.orgId, req.user)));

  router.post('/invoices', requirePermission(Resource.Invoices, Action.Create), validateBody(generateInvoiceSchema),
    route((req) => financeService.generateInvoiceFromOrder(req.user.orgId, req.body.orderId)));

  router.get('/ledger/:outletId', requirePermission(Resource.Invoices, Action.Read),
    route((req) => financeService.getLedger(req.user.orgId, req.params.outletId, req.user)));

  return router;
}
