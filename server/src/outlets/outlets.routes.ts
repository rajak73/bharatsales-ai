import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import { BadRequestException } from '../core/http-errors';
import type { OutletsService } from './outlets.service';
import type { AuditService } from '../audit/audit.service';

const tier = z.enum(['A', 'B', 'C', 'D']);
const status = z.enum(['Active', 'Inactive', 'Pending Approval']);

const locationSchema = z.object({
  address: z.string(),
  state: z.string(),
  pinCode: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  geofenceRadiusMeters: z.number().optional(),
});

// outstandingBalance is deliberately absent: it is a ledger figure maintained
// by orders/collections, never something a client can set on an outlet.
const commercialSchema = z.object({
  priceListId: z.string().optional(),
  creditLimit: z.number().min(0),
  paymentTermsDays: z.number().min(0),
  assignedDistributorId: z.string().optional(),
});

const taxSchema = z.object({
  gstin: z.string().optional(),
  pan: z.string().optional(),
});

// organizationId/status/createdAt/updatedAt are set by the service
// (status is always forced to 'Pending Approval', BR-002).
const createOutletSchema = z.object({
  code: z.string(),
  name: z.string(),
  ownerName: z.string(),
  category: z.string(),
  tier,
  status: status.optional(),
  mobile: z.string(),
  location: locationSchema,
  commercial: commercialSchema,
  tax: taxSchema.optional().default({}),
  territoryId: z.string().optional(),
});

/**
 * Update body. Nested objects (location/commercial/tax) are flattened into
 * dot-notation keys before they reach the service's `$set`, so a partial
 * nested update merges into the stored subdocument instead of replacing it.
 * This matters because the web "assign distributor" flow sends
 * `{ commercial: { ...existingCommercial, assignedDistributorId } }` — the
 * spread includes outstandingBalance, which is stripped here, and replacing
 * the whole subdocument would otherwise reset the balance to its default.
 * Client-sent dot keys (e.g. 'commercial.assignedDistributorId') are removed
 * app-wide by the sanitize middleware, so the nested form is the contract; the
 * flattening re-creates the dot key server-side, which is what the service's
 * distributor-assignment notification reads.
 */
const updateOutletSchema = z
  .object({
    code: z.string().optional(),
    name: z.string().optional(),
    ownerName: z.string().optional(),
    category: z.string().optional(),
    tier: tier.optional(),
    status: status.optional(),
    mobile: z.string().optional(),
    territoryId: z.string().nullable().optional(),
    location: locationSchema.partial().optional(),
    commercial: commercialSchema.partial().optional(),
    tax: taxSchema.optional(),
  })
  .transform((body) => {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue;
      if ((key === 'location' || key === 'commercial' || key === 'tax') && value && typeof value === 'object') {
        for (const [sub, subValue] of Object.entries(value)) {
          if (subValue !== undefined) out[`${key}.${sub}`] = subValue;
        }
      } else {
        out[key] = value;
      }
    }
    return out;
  });

export function createOutletsRouter(deps: { outletsService: OutletsService; auditService: AuditService }): Router {
  const { outletsService, auditService } = deps;
  const router = Router();
  router.use(authenticate);

  router.get('/', requirePermission(Resource.Outlets, Action.Read),
    route((req) => outletsService.findAllByOrgId(req.user.orgId, req.user)));

  // Static /export paths are registered before any /:id route.
  router.get('/export', requirePermission(Resource.Outlets, Action.Export),
    route(() => {
      // BR-017: exports must go through POST so the audit trail records them.
      throw new BadRequestException('Please use POST /export for auditing purposes');
    }));

  router.post('/export', requirePermission(Resource.Outlets, Action.Export), audit(auditService, 'Export_Outlets'),
    route(async (req) => {
      const data = await outletsService.findAllByOrgId(req.user.orgId);
      return { exportedRecords: data.length, data };
    }));

  router.get('/:id/360', requirePermission(Resource.Outlets, Action.Read),
    route((req) => outletsService.getOutlet360(req.user.orgId, req.params.id)));

  router.post('/', requirePermission(Resource.Outlets, Action.Create), audit(auditService, 'Outlet'),
    validateBody(createOutletSchema),
    route((req) => outletsService.create(req.user.orgId, (req.user.sub || req.user.id) as string, req.body)));

  router.delete('/:id', requirePermission(Resource.Outlets, Action.Delete), audit(auditService, 'Outlet'),
    route((req) => outletsService.softDelete(req.user.orgId, req.params.id)));

  router.patch('/:id', requirePermission(Resource.Outlets, Action.Update), audit(auditService, 'Outlet'),
    validateBody(updateOutletSchema),
    route((req) => outletsService.update(req.user.orgId, req.params.id, req.body, req.user)));

  // BR-002: activating an outlet is an approval, not an edit — Sales Manager
  // and Organization Admin hold Outlets:Approve, Sales Representatives do not.
  router.post('/:id/approve', requirePermission(Resource.Outlets, Action.Approve), audit(auditService, 'Outlet_Approval'),
    route((req) => outletsService.approve(req.user.orgId, req.params.id)));

  return router;
}
