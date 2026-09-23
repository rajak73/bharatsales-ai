import { Router } from 'express';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route } from '../core/http';
import type { AnalyticsService } from './analytics.service';
import type { AuditService } from '../audit/audit.service';

export function createAnalyticsRouter(deps: { analyticsService: AnalyticsService; auditService: AuditService }): Router {
  const { analyticsService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Analytics'));

  router.get('/dashboard', requirePermission(Resource.Analytics, Action.Read),
    route((req) => analyticsService.getDashboardData(req.user.orgId, req.user)));

  return router;
}
