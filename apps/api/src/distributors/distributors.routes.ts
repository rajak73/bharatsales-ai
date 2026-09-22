import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { DistributorsService } from './distributors.service';
import type { AuditService } from '../audit/audit.service';

const locationSchema = z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pinCode: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

const taxSchema = z.object({
  gstin: z.string().optional(),
  pan: z.string().optional(),
});

// organizationId/_id/timestamps are never accepted; commercial.outstandingBalance
// is a ledger figure and is not client-settable (only creditLimit is).
const createDistributorSchema = z.object({
  name: z.string(),
  code: z.string(),
  ownerName: z.string(),
  mobile: z.string(),
  status: z.enum(['Active', 'Inactive']),
  location: locationSchema,
  tax: taxSchema.optional().default({}),
  commercial: z.object({ creditLimit: z.number().min(0) }).optional(),
  territoryIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
});

// The service still enforces that only an Organization Admin may change
// territoryIds/productIds. commercial is flattened to a dot key so updating
// creditLimit does not overwrite outstandingBalance.
const updateDistributorSchema = z
  .object({
    name: z.string().optional(),
    code: z.string().optional(),
    ownerName: z.string().optional(),
    mobile: z.string().optional(),
    status: z.enum(['Active', 'Inactive']).optional(),
    location: locationSchema.optional(),
    tax: taxSchema.optional(),
    commercial: z.object({ creditLimit: z.number().min(0) }).optional(),
    territoryIds: z.array(z.string()).optional(),
    productIds: z.array(z.string()).optional(),
  })
  .transform(({ commercial, ...rest }) => {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) out[key] = value;
    }
    if (commercial) out['commercial.creditLimit'] = commercial.creditLimit;
    return out;
  });

export function createDistributorsRouter(deps: { distributorsService: DistributorsService; auditService: AuditService }): Router {
  const { distributorsService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Distributor'));

  router.get('/', requirePermission(Resource.Distributors, Action.Read),
    route((req) => distributorsService.getDistributors(req.user.orgId)));

  router.post('/', requirePermission(Resource.Distributors, Action.Create), validateBody(createDistributorSchema),
    route((req) => distributorsService.create(req.user.orgId, req.body)));

  router.patch('/:id', requirePermission(Resource.Distributors, Action.Update), validateBody(updateDistributorSchema),
    route((req) => distributorsService.update(req.user.orgId, req.user.role, req.params.id, req.body)));

  // Returns a bare boolean, as the Nest controller did.
  router.delete('/:id', requirePermission(Resource.Distributors, Action.Delete),
    route(async (req, res) => {
      const deleted = await distributorsService.delete(req.user.orgId, req.params.id);
      res.status(200).json(deleted);
    }));

  return router;
}
