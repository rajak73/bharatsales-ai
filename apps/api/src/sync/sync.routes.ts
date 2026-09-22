import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { SyncService } from './sync.service';
import type { AuditService } from '../audit/audit.service';

const optStr = z.string().nullish().transform((v) => v ?? undefined);
const location = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  accuracy: z.coerce.number().nullish().transform((v) => v ?? undefined),
});

// Offline orders go through OrdersService.create (MOQ/credit/FEFO rules), so
// accept the same fields POST /orders does, plus the offline _id/updatedAt
// used for conflict detection. organizationId/createdByUserId/totals etc. are
// stripped.
const syncOrderSchema = z.object({
  _id: optStr,
  updatedAt: optStr,
  idempotencyKey: optStr,
  orderNumber: optStr,
  outletId: optStr,
  assignedDistributorId: z.string().optional().nullable(),
  status: optStr,
  notes: optStr,
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number().min(0),
        discount: z.coerce.number().min(0).optional(),
        appliedSchemeId: z.string().optional().nullable(),
        isFreeItem: z.boolean().optional(),
      }),
    )
    .optional(),
});

// Server-derived fields (user, organizationId, distanceFromOutlet,
// isWithinGeofence) are not accepted from the device.
const syncVisitSchema = z.object({
  _id: optStr,
  idempotencyKey: optStr,
  outlet: z.string().min(1),
  checkInTime: z.string().min(1),
  checkOutTime: optStr,
  durationMinutes: z.coerce.number().optional(),
  checkInLocation: location,
  checkOutLocation: location.optional(),
  photoUrl: optStr,
  status: z.enum(['Active', 'Completed']),
  activities: z.array(z.record(z.any())).optional(),
});

// status is never client-set (derived from paymentMode by
// CollectionsService.create); collectedByUserId and organizationId come from
// the token. Requires Collections:Create (checked in SyncService.push).
const syncCollectionSchema = z.object({
  _id: optStr,
  idempotencyKey: optStr,
  outletId: z.string().min(1),
  invoiceId: optStr,
  amount: z.coerce.number().positive(),
  paymentMode: z.enum(['Cash', 'Cheque', 'UPI', 'Bank Transfer']),
  referenceNumber: optStr,
  receiptNumber: z.string().min(1),
  collectionDate: z.string().min(1),
  // No `allocations`: a synced collection is recorded exactly like
  // POST /collections (status from paymentMode, allocations computed
  // server-side), never with client-chosen invoice allocations.
});

const pushSchema = z.object({
  orders: z.array(syncOrderSchema).optional(),
  visits: z.array(syncVisitSchema).optional(),
  collections: z.array(syncCollectionSchema).optional(),
});

export function createSyncRouter(deps: { syncService: SyncService; auditService: AuditService }): Router {
  const { syncService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Visits'));

  router.get('/pull', requirePermission(Resource.Visits, Action.Read),
    route((req) => syncService.pull(
      req.user.orgId,
      req.user.sub,
      req.query.lastSyncTimestamp as string | undefined,
      req.user,
    )));

  router.post('/push', requirePermission(Resource.Visits, Action.Create), validateBody(pushSchema),
    route((req) => syncService.push(req.user.orgId, req.user.sub, req.body, req.user)));

  return router;
}
