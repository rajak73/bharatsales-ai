import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePlatformAdmin } from '../core/auth.middleware';
import { route, validateBody } from '../core/http';
import { audit } from '../core/audit.middleware';
import type { AuditService } from '../audit/audit.service';
import type { SuperadminService } from './superadmin.service';
import type { SupportService } from '../support/support.service';

const TENANT_STATUSES = ['Pending Approval', 'Trial', 'Active', 'Past Due', 'Suspended', 'Archived', 'Expired'] as const;
const PLANS = ['Starter', 'Growth', 'Enterprise'] as const;
const BILLING_CYCLES = ['Monthly', 'Annual'] as const;
const TICKET_STATUSES = ['Open', 'In Progress', 'Resolved'] as const;

const tenantStatusSchema = z.object({ status: z.enum(TENANT_STATUSES) });

// Only the tenant profile fields a platform admin sets at creation, plus the
// optional first Organization Admin account. billingHistory and other
// system-managed fields are not accepted.
const createTenantSchema = z.object({
  name: z.string().trim().min(1),
  status: z.enum(TENANT_STATUSES).optional(),
  plan: z.enum(PLANS).optional(),
  billingCycle: z.enum(BILLING_CYCLES).optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  nextBillingDate: z.string().optional(),
  subscriptionUsersLimit: z.number().int().min(0).optional(),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  branding: z.object({ logoUrl: z.string().optional(), primaryColor: z.string().optional() }).optional(),
  adminName: z.string().optional(),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(1).optional(),
});

// The subscriptions page can briefly hold '' before a row is selected; the
// service already ignores empty plan/billingCycle.
const updateSubscriptionSchema = z.object({
  plan: z.union([z.enum(PLANS), z.literal('')]).optional(),
  billingCycle: z.union([z.enum(BILLING_CYCLES), z.literal('')]).optional(),
  subscriptionUsersLimit: z.number().int().min(0).optional(),
});

const billingRecordSchema = z.object({
  amount: z.string().min(1),
  plan: z.string().min(1),
  status: z.string().optional(),
});

const ticketStatusSchema = z.object({ status: z.enum(TICKET_STATUSES) });

const platformSettingsSchema = z.object({
  defaultTrialDays: z.number().int().min(0).optional(),
  maintenanceMode: z.boolean().optional(),
  defaultPlanUserLimits: z.record(z.number().int().min(0)).optional(),
});

export function createSuperadminRouter(deps: {
  superadminService: SuperadminService;
  supportService: SupportService;
  auditService: AuditService;
}): Router {
  const { superadminService, supportService, auditService } = deps;
  const router = Router();
  // Every platform-level change (tenant approval/suspension, subscription and
  // billing edits, platform settings, ticket status) is written to the audit log.
  router.use(authenticate, requirePlatformAdmin, audit(auditService, 'Platform'));

  router.get('/dashboard', route(() => superadminService.getPlatformDashboard()));

  router.get('/tenants', route(() => superadminService.getAllTenants()));

  router.post('/tenants', validateBody(createTenantSchema),
    route((req) => superadminService.createTenant(req.body)));

  router.patch('/tenants/:id/status', validateBody(tenantStatusSchema),
    route((req) => superadminService.updateTenantStatus(req.params.id, req.body.status)));

  router.patch('/tenants/:id/subscription', validateBody(updateSubscriptionSchema),
    route((req) => superadminService.updateSubscription(req.params.id, req.body)));

  router.post('/tenants/:id/billing', validateBody(billingRecordSchema),
    route((req) => superadminService.addBillingRecord(req.params.id, req.body)));

  router.get('/users', route((req) =>
    superadminService.getAllUsers({
      role: req.query.role as string | undefined,
      organizationId: req.query.organizationId as string | undefined,
      status: req.query.status as string | undefined,
    })));

  router.get('/analytics', route(() => superadminService.getPlatformAnalytics()));

  router.get('/reports/logins', route(() => superadminService.getLoginStatistics()));

  router.get('/tickets', route(() => supportService.findAllGlobal()));

  router.patch('/tickets/:id/status', validateBody(ticketStatusSchema),
    route((req) => supportService.updateStatus(req.params.id, req.body.status)));

  router.get('/settings', route(() => superadminService.getPlatformSettings()));

  router.patch('/settings', validateBody(platformSettingsSchema),
    route((req) => superadminService.updatePlatformSettings(req.body)));

  router.get('/audit', route(() => superadminService.getGlobalAuditLogs()));

  router.get('/metrics', route(() => superadminService.getMetrics()));

  return router;
}
