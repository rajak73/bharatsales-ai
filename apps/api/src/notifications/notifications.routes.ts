import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { NotificationsService } from './notifications.service';
import type { AuditService } from '../audit/audit.service';

const sendSmsSchema = z.object({
  to: z.string().min(1),
  message: z.string().min(1),
});

// payload maps to the Brevo template's params — genuinely free-form (it is
// only forwarded to Brevo and stored on the log entry, never used in a query).
const sendWhatsAppSchema = z.object({
  to: z.string().min(1),
  templateId: z.union([z.string(), z.number()]),
  payload: z.any().optional(),
});

export function createNotificationsRouter(deps: { notificationsService: NotificationsService; auditService: AuditService }): Router {
  const { notificationsService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Notifications'));

  router.get('/', requirePermission(Resource.Notifications, Action.Read),
    route((req) => notificationsService.getNotifications(req.user.orgId, req.user.sub)));

  // Static /read-all before /:id/read (different depth, but kept first for clarity).
  router.put('/read-all', requirePermission(Resource.Notifications, Action.Update),
    route((req) => notificationsService.markAllAsRead(req.user.orgId, req.user.sub)));

  router.put('/:id/read', requirePermission(Resource.Notifications, Action.Update),
    route((req) => notificationsService.markAsRead(req.user.orgId, req.user.sub, req.params.id)));

  router.post('/sms', requirePermission(Resource.Users, Action.Create), validateBody(sendSmsSchema),
    route((req) => notificationsService.sendSms(req.user.orgId, req.body.to, req.body.message)));

  router.post('/whatsapp', requirePermission(Resource.Users, Action.Create), validateBody(sendWhatsAppSchema),
    route((req) => notificationsService.sendWhatsApp(req.user.orgId, req.body.to, req.body.templateId as any, req.body.payload)));

  return router;
}
