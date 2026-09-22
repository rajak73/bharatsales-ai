import { Router } from 'express';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route } from '../core/http';
import type { PerformanceService } from './performance.service';
import type { AuditService } from '../audit/audit.service';

const today = () => new Date().toISOString().split('T')[0];

export function createPerformanceRouter(deps: { performanceService: PerformanceService; auditService: AuditService }): Router {
  const { performanceService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Analytics'));

  router.get('/dsr', requirePermission(Resource.Analytics, Action.Read),
    route((req) => {
      const targetDate = (req.query.date as string | undefined) || today();
      return performanceService.generateDSR(req.user.orgId, req.user.sub, targetDate);
    }));

  router.get('/targets', requirePermission(Resource.Analytics, Action.Read),
    route((req) => performanceService.getUserTargets(req.user.orgId, req.user.sub)));

  router.get('/team-dsr', requirePermission(Resource.Analytics, Action.Read),
    route((req) => {
      const targetDate = (req.query.date as string | undefined) || today();
      return performanceService.generateTeamDSR(req.user.orgId, req.user.sub, targetDate, req.user.role);
    }));

  router.get('/team-targets', requirePermission(Resource.Analytics, Action.Read),
    route((req) => performanceService.getTeamTargets(req.user.orgId, req.user.sub, req.user.role)));

  return router;
}
