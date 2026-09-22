import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../core/auth.middleware';
import { route, validateBody } from '../core/http';
import type { SupportService } from './support.service';

const createTicketSchema = z.object({
  subject: z.string().trim().min(1),
  message: z.string().trim().min(1),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
});

export function createSupportRouter(deps: { supportService: SupportService }): Router {
  const { supportService } = deps;
  const router = Router();
  router.use(authenticate);

  router.post('/tickets', validateBody(createTicketSchema),
    route((req) => supportService.create(req.user.orgId, req.user.sub, req.body)));

  router.get('/tickets', route((req) => supportService.findAllForOrg(req.user.orgId)));

  return router;
}
