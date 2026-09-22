import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { VisitsService } from './visits.service';
import type { AuditService } from '../audit/audit.service';

const optStr = z.string().nullish().transform((v) => v ?? undefined);

// Same fields as the controller's typed body; matches field-pwa
// OutletVisitScreen and the CREATE_VISIT offline payload.
const checkInSchema = z.object({
  outletId: z.string().min(1),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  accuracy: z.coerce.number().nullish().transform((v) => v ?? undefined),
  isMock: z.boolean().optional(),
  deviceTimestamp: optStr,
  photoUrl: optStr,
  idempotencyKey: optStr,
});

// Activities are free-form (Visit.activities is [Object]); the service stamps
// its own timestamp. Keys starting with `$`/containing `.` are removed by the
// global sanitize middleware.
const activitySchema = z
  .object({
    type: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough()
  .transform(({ timestamp: _ts, ...rest }: Record<string, any>) => rest);

export function createVisitsRouter(deps: { visitsService: VisitsService; auditService: AuditService }): Router {
  const { visitsService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Visits'));

  router.post('/check-in', requirePermission(Resource.Visits, Action.Create), validateBody(checkInSchema),
    route((req) => visitsService.checkIn(req.user.sub, req.user.orgId, req.body)));

  router.post('/:id/check-out', requirePermission(Resource.Visits, Action.Create),
    route((req) => visitsService.checkOut(req.user.sub, req.user.orgId, req.params.id)));

  router.post('/:id/activities', requirePermission(Resource.Visits, Action.Create), validateBody(activitySchema),
    route((req) => visitsService.addActivity(req.user.sub, req.user.orgId, req.params.id, req.body)));

  return router;
}
