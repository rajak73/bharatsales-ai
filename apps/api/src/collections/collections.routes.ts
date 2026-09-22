import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { CollectionsService } from './collections.service';
import type { AuditService } from '../audit/audit.service';

const optStr = z.string().nullish().transform((v) => v ?? undefined);

// Only what a payment entry legitimately carries. status, collectedByUserId,
// organizationId, id/createdAt etc. that the offline PWA/mobile clients send
// along are stripped (status is derived from paymentMode server-side).
const createCollectionSchema = z.object({
  outletId: z.string().min(1),
  invoiceId: optStr,
  amount: z.coerce.number().positive(),
  paymentMode: z.enum(['Cash', 'Cheque', 'UPI', 'Bank Transfer']),
  referenceNumber: optStr,
  receiptNumber: optStr,
  collectionDate: optStr,
  idempotencyKey: optStr,
  allocations: z
    .array(z.object({ invoiceId: z.string().min(1), amount: z.coerce.number().positive() }))
    .optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['Pending', 'Cleared', 'Bounced']),
});

// Free-form edit: harmless, non-financial fields only.
const updateCollectionSchema = z.object({
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export function createCollectionsRouter(deps: {
  collectionsService: CollectionsService;
  auditService: AuditService;
}): Router {
  const { collectionsService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Collections'));

  router.get('/', requirePermission(Resource.Collections, Action.Read),
    route((req) => collectionsService.findAll(req.user.orgId, req.user)));

  router.post('/', requirePermission(Resource.Collections, Action.Create), validateBody(createCollectionSchema),
    route((req) => collectionsService.create(req.user.orgId, req.user.sub, req.body)));

  router.patch('/:id/status', requirePermission(Resource.Collections, Action.Update), validateBody(updateStatusSchema),
    route((req) => collectionsService.updateStatus(req.user.orgId, req.params.id, req.body.status)));

  router.put('/:id', requirePermission(Resource.Collections, Action.Update), validateBody(updateCollectionSchema),
    route((req) => collectionsService.update(req.user.orgId, req.params.id, req.body)));

  router.post('/:id/reverse', requirePermission(Resource.Collections, Action.Update),
    route((req) => collectionsService.reverseCollection(req.user.orgId, req.params.id, req.user.sub)));

  router.delete('/:id', requirePermission(Resource.Collections, Action.Delete),
    route((req) => collectionsService.remove(req.user.orgId, req.params.id)));

  return router;
}
