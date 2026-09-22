import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { OnboardingService } from './onboarding.service';
import type { AuditService } from '../audit/audit.service';

// The OnboardingState step fields. organizationId / isComplete can never be
// set from the body; other keys (the web wizard's flat form fields, which the
// schema never persisted) are stripped.
const section = z.record(z.any()).optional();
const saveStepSchema = z.object({
  currentStep: z.coerce.number().int().min(1).optional(),
  company: section,
  policies: section,
  hierarchy: section,
  users: section,
  products: section,
  channels: section,
});

export function createOnboardingRouter(deps: { onboardingService: OnboardingService; auditService: AuditService }): Router {
  const { onboardingService, auditService } = deps;
  const router = Router();
  router.use(authenticate);

  router.get('/', requirePermission(Resource.Settings, Action.Read),
    route((req) => onboardingService.getState(req.user.orgId)));

  router.put('/step/:stepNumber', requirePermission(Resource.Settings, Action.Update), audit(auditService, 'OnboardingState'),
    validateBody(saveStepSchema),
    route((req) => onboardingService.saveStep(req.user.orgId, req.body)));

  router.post('/complete', requirePermission(Resource.Settings, Action.Create), audit(auditService, 'OnboardingState'),
    route((req) => onboardingService.completeOnboarding(req.user.orgId)));

  return router;
}
