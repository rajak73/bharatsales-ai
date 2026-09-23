import { Router } from 'express';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, AuthedRequest } from '../core/http';
import { Logger } from '../core/logger';
import type { LiveMapService } from './live-map.service';
import type { AuditService } from '../audit/audit.service';
import type { HierarchyService } from '../hierarchy/hierarchy.service';
import { visibleTeamUserIds } from '../hierarchy/team-scope';

const STREAM_INTERVAL_MS = 5000;
const logger = new Logger('LiveMapRouter');

export function createLiveMapRouter(deps: {
  liveMapService: LiveMapService;
  auditService: AuditService;
  hierarchyService?: Pick<HierarchyService, 'getTeamUserIds'>;
}): Router {
  const { liveMapService, auditService, hierarchyService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'LiveMap'));

  router.get('/reps', requirePermission(Resource.LiveMap, Action.Read),
    route(async (req) => {
      if (!req.user.orgId) return [];
      return liveMapService.getLiveReps(req.user.orgId, await visibleTeamUserIds(hierarchyService, req.user));
    }));

  // Replaces Nest's @Sse('stream'): every 5s push the live reps as a
  // `data:` event (same framing Nest used: id + JSON data), and stop polling
  // as soon as the client disconnects.
  router.get('/stream', requirePermission(Resource.LiveMap, Action.Read), async (req, res, next) => {
    const user = (req as AuthedRequest).user;
    const orgId = user.orgId;
    let teamIds: string[] | undefined;
    try {
      teamIds = await visibleTeamUserIds(hierarchyService, user);
    } catch (err) {
      return next(err);
    }
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    // Same header Nest's SseStream sent; no-transform also tells compression()
    // (and any proxy) never to buffer/gzip the stream.
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    // Long-lived connection: disable the socket idle timeout (as Nest did).
    req.socket.setTimeout(0);
    res.flushHeaders();
    // Initial newline, as Nest wrote, so clients/proxies see the stream open at once.
    res.write('\n');
    const flush = () => (res as any).flush?.();
    flush();

    let eventId = 0;
    let closed = false;
    let inFlight = false;

    const timer = setInterval(async () => {
      if (closed || inFlight) return;
      inFlight = true;
      try {
        const data = await liveMapService.getLiveReps(orgId, teamIds);
        if (!closed) {
          eventId += 1;
          res.write(`id: ${eventId}\ndata: ${JSON.stringify(data)}\n\n`);
          flush();
        }
      } catch (err: any) {
        logger.error(`Live map stream failed: ${err?.message ?? err}`);
      } finally {
        inFlight = false;
      }
    }, STREAM_INTERVAL_MS);

    req.on('close', () => {
      closed = true;
      clearInterval(timer);
    });
  });

  return router;
}
