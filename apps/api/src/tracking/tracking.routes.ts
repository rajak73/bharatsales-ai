import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { TrackingService } from './tracking.service';
import type { AuditService } from '../audit/audit.service';
import type { HierarchyService } from '../hierarchy/hierarchy.service';
import { visibleTeamUserIds } from '../hierarchy/team-scope';

// Matches the CREATE_LOCATION_PING payloads queued by apps/mobile
// (useAttendance.ts) and apps/field-pwa (AttendanceContext.tsx):
// { lat, lng, accuracy, deviceTimestamp, attendanceSession }. The session is
// resolved server-side from the caller's active attendance, so
// attendanceSession (and anything else) is stripped.
const pingSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  accuracy: z.coerce.number().nullish().transform((v) => v ?? undefined),
  deviceTimestamp: z.string().nullish().transform((v) => v ?? undefined),
  isMock: z.boolean().optional(),
});

const bulkPingsSchema = z.object({
  pings: z.array(pingSchema).max(1000).default([]),
});

export function createTrackingRouter(deps: {
  trackingService: TrackingService;
  auditService: AuditService;
  hierarchyService?: Pick<HierarchyService, 'getTeamUserIds'>;
}): Router {
  const { trackingService, auditService, hierarchyService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Attendance'));

  // Reps post their own pings: stays on Attendance:Create, which the
  // Sales Representative role has.
  router.post('/bulk', requirePermission(Resource.Attendance, Action.Create), validateBody(bulkPingsSchema),
    route((req) => trackingService.bulkCreatePings(req.user.sub, req.user.orgId, req.body.pings)));

  // Org-wide latest location of every rep: LiveMap:Read (managers/admins),
  // not Attendance:Read, so reps can't see colleagues' locations.
  router.get('/', requirePermission(Resource.LiveMap, Action.Read),
    route(async (req) => trackingService.getLatestPings(
      req.user.orgId,
      await visibleTeamUserIds(hierarchyService, req.user),
    )));

  return router;
}
