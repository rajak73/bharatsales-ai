import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { BeatsService } from './beats.service';
import type { AuditService } from '../audit/audit.service';
import type { HierarchyService } from '../hierarchy/hierarchy.service';
import { visibleTeamUserIds } from '../hierarchy/team-scope';
import { ForbiddenException } from '../core/http-errors';

const sequenceSchema = z.array(
  z.object({ outletId: z.string().min(1), sequenceOrder: z.coerce.number() }),
);

// Only the template's own content. status/version/organizationId are
// server-controlled (status moves via POST /:id/publish).
const createBeatSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullish().transform((v) => v ?? undefined),
  outlets: z.array(z.string().min(1)).optional(),
  sequence: sequenceSchema.optional(),
});

const updateBeatSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullish().transform((v) => v ?? undefined),
  outlets: z.array(z.string().min(1)).optional(),
  sequence: sequenceSchema.optional(),
});

const assignBeatSchema = z.object({
  userId: z.string().min(1),
  date: z.string().min(1),
});

export function createBeatsRouter(deps: {
  beatsService: BeatsService;
  auditService: AuditService;
  hierarchyService?: Pick<HierarchyService, 'getTeamUserIds'>;
}): Router {
  const { beatsService, auditService, hierarchyService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Beats'));

  // Static paths before /:id.
  router.get('/today', requirePermission(Resource.Visits, Action.Read),
    route((req) => beatsService.getTodayBeat(req.user.sub, req.user.orgId)));

  router.get('/deviation', requirePermission(Resource.LiveMap, Action.Read),
    route(async (req) => {
      const userId = (req.query.userId as string | undefined) || req.user.sub;
      if (userId !== req.user.sub) {
        // A Sales Manager may only inspect reps on their own team.
        const team = await visibleTeamUserIds(hierarchyService, req.user);
        if (team && !team.includes(String(userId))) {
          throw new ForbiddenException('You can only view route deviation for your own team');
        }
      }
      return beatsService.checkRouteDeviation(req.user.orgId, userId, req.query.date as string | undefined);
    }));

  router.get('/team-today', requirePermission(Resource.LiveMap, Action.Read),
    route((req) => beatsService.getTeamBeatCompletion(req.user.orgId, req.user.sub, req.user.role)));

  router.get('/', requirePermission(Resource.Beats, Action.Read),
    route((req) => beatsService.getAllBeats(req.user.orgId, { sub: req.user.sub, role: req.user.role })));

  router.post('/', requirePermission(Resource.Beats, Action.Create), validateBody(createBeatSchema),
    route((req) => beatsService.createBeat(req.user.orgId, req.body)));

  router.patch('/:id', requirePermission(Resource.Beats, Action.Update), validateBody(updateBeatSchema),
    route((req) => beatsService.updateBeat(req.user.orgId, req.params.id, req.body)));

  router.post('/:id/publish', requirePermission(Resource.Beats, Action.Update),
    route((req) => beatsService.publishBeat(req.user.orgId, req.params.id)));

  // A Sales Manager (or Organization Admin) assigns an already-published
  // beat template to a specific rep for a specific date.
  router.post('/:id/assign', requirePermission(Resource.Beats, Action.Approve), validateBody(assignBeatSchema),
    route((req) => beatsService.assignBeat(
      req.user.orgId, { sub: req.user.sub, role: req.user.role }, req.params.id, req.body.userId, req.body.date,
    )));

  return router;
}
