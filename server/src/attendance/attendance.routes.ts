import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { AttendanceService } from './attendance.service';
import type { AuditService } from '../audit/audit.service';

const optStr = z.string().nullish().transform((v) => v ?? undefined);
const optNum = z.coerce.number().nullish().transform((v) => v ?? undefined);

// Matches apps/mobile useAttendance.startDay / field-pwa AttendanceContext
// ({ lat, lng, accuracy, deviceTimestamp, photoUrl }) and the CLOCK_IN
// offline payload.
const startDaySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  accuracy: optNum,
  deviceTimestamp: optStr,
  isMock: z.boolean().optional(),
  photoUrl: optStr,
});

const endDaySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  accuracy: optNum,
});

const regularizeSchema = z.object({
  reason: z.string().min(1),
});

const approveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export function createAttendanceRouter(deps: { attendanceService: AttendanceService; auditService: AuditService }): Router {
  const { attendanceService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Attendance'));

  router.post('/start', requirePermission(Resource.Attendance, Action.Create), validateBody(startDaySchema),
    route((req) => attendanceService.startDay(req.user.sub, req.user.orgId, req.body)));

  router.post('/end', requirePermission(Resource.Attendance, Action.Create), validateBody(endDaySchema),
    route((req) => attendanceService.endDay(req.user.sub, req.body)));

  router.get('/me', requirePermission(Resource.Attendance, Action.Read),
    route((req) => attendanceService.getCurrentSession(req.user.sub)));

  router.get('/history', requirePermission(Resource.Attendance, Action.Read),
    route((req) => attendanceService.getHistory(req.user.sub)));

  // Static path before the /:sessionId routes.
  router.get('/regularizations/pending', requirePermission(Resource.Attendance, Action.Approve),
    route((req) => attendanceService.getPendingRegularizations(req.user.orgId, { sub: req.user.sub, role: req.user.role })));

  router.post('/regularizations/:sessionId/approve', requirePermission(Resource.Attendance, Action.Approve), validateBody(approveSchema),
    route((req) => attendanceService.approveRegularization(
      req.user.orgId, { sub: req.user.sub, role: req.user.role }, req.params.sessionId, req.body.status,
    )));

  router.post('/:sessionId/regularize', requirePermission(Resource.Attendance, Action.Update), validateBody(regularizeSchema),
    route((req) => attendanceService.requestRegularization(req.user.sub, req.params.sessionId, req.body.reason)));

  return router;
}
