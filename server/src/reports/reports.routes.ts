import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { ReportsService } from './reports.service';
import type { AuditService } from '../audit/audit.service';

// The web app sends { reportName }; older callers/tests send { reportId }.
const runReportSchema = z
  .object({
    reportId: z.string().min(1).optional(),
    reportName: z.string().min(1).optional(),
  })
  .refine((b) => !!(b.reportId || b.reportName), { message: 'reportId or reportName is required' });

const scheduleReportSchema = z.object({
  report: z.string().min(1),
  frequency: z.string().min(1),
  time: z.string().min(1),
  recipients: z.string().min(1),
  format: z.string().min(1),
});

export function createReportsRouter(deps: { reportsService: ReportsService; auditService: AuditService }): Router {
  const { reportsService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Reports'));

  router.get('/', requirePermission(Resource.Reports, Action.Read),
    route((req) => reportsService.getReports(req.user.orgId, req.user.role)));

  router.get('/stats', requirePermission(Resource.Reports, Action.Read),
    route((req) => reportsService.getReportStats(req.user.orgId)));

  router.post('/run', requirePermission(Resource.Reports, Action.Read), validateBody(runReportSchema),
    route((req) => reportsService.runReport(req.user.orgId, req.body, req.user)));

  router.get('/jobs/:id', requirePermission(Resource.Reports, Action.Read),
    route((req) => reportsService.getJobStatus(req.user.orgId, req.params.id, req.user)));

  router.get('/exports/:id', requirePermission(Resource.Reports, Action.Export),
    route((req) => reportsService.getExport(req.user.orgId, req.params.id, req.user)));

  router.post('/schedule', requirePermission(Resource.Reports, Action.Create), validateBody(scheduleReportSchema),
    route((req) => reportsService.scheduleReport(req.user.orgId, req.body)));

  router.get('/schedules', requirePermission(Resource.Reports, Action.Read),
    route((req) => reportsService.getSchedules(req.user.orgId)));

  return router;
}
