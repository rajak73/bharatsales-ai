import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { SettingsService } from './settings.service';
import type { AuditService } from '../audit/audit.service';

const str = z.string().nullable().optional();
const strOrNum = z.union([z.string(), z.number()]).nullable().optional();

// Only tenant profile / operational settings. Unknown keys — including plan,
// status, billingCycle, nextBillingDate, subscriptionUsersLimit,
// subscriptionStorageUsed, billingHistory, organizationId, _id — are stripped
// (the web settings page sends the whole tenant document back, so stripping
// rather than rejecting keeps it working). SettingsService whitelists again.
const updateSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  timezone: str,
  currency: str,
  branding: z
    .object({ logoUrl: str, primaryColor: str })
    .nullable()
    .optional(),
  gstNumber: str,
  address: str,
  country: str,
  industry: str,
  geofenceRadius: strOrNum,
  gpsAccuracy: strOrNum,
  workingDays: z.array(z.string()).optional(),
  shiftStart: str,
  shiftEnd: str,
  orderApprovalThreshold: strOrNum,
  discountAuthority: strOrNum,
  fiscalYearStart: str,
});

export function createSettingsRouter(deps: { settingsService: SettingsService; auditService: AuditService }): Router {
  const { settingsService, auditService } = deps;
  const router = Router();
  router.use(authenticate);

  router.get('/', requirePermission(Resource.Settings, Action.Read),
    route((req) => settingsService.getSettings(req.user.orgId)));

  // Self-service — every authenticated role (including Sales Rep/Distributor,
  // who don't have Settings:Read) needs the org's name/logo/brand color to
  // display org identity in the mobile app. Deliberately whitelisted to just
  // name+branding, never the full tenant document.
  router.get('/branding',
    route((req) => settingsService.getBranding(req.user.orgId)));

  router.put('/', requirePermission(Resource.Settings, Action.Update), audit(auditService, 'Tenant'),
    validateBody(updateSettingsSchema),
    route((req) => settingsService.updateSettings(req.user.orgId, req.body)));

  return router;
}
