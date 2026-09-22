import express, { Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors, { CorsOptions } from 'cors';

import type { Container } from './container';
import { sanitizeInput } from './core/sanitize.middleware';
import { notFoundHandler, errorHandler } from './core/error-handler';
import { Logger } from './core/logger';
import { apiLimiter } from './core/rate-limit';

import { createAppRouter } from './app.routes';
import { createHealthRouter } from './health/health.routes';
import { createUploadsRouter } from './uploads/uploads.routes';
import { createAuthRouter } from './auth/auth.routes';
import { createUsersRouter } from './users/users.routes';
import { createSettingsRouter } from './settings/settings.routes';
import { createOnboardingRouter } from './onboarding/onboarding.routes';
import { createOrdersRouter } from './orders/orders.routes';
import { createInventoryRouter } from './inventory/inventory.routes';
import { createDispatchRouter } from './dispatch/dispatch.routes';
import { createReturnsRouter } from './returns/returns.routes';
import { createCollectionsRouter } from './collections/collections.routes';
import { createFinanceRouter } from './finance/finance.routes';
import { createApprovalsRouter } from './approvals/approvals.routes';
import { createTargetsRouter } from './targets/targets.routes';
import { createIncentivesRouter } from './incentives/incentives.routes';
import { createSuperadminRouter } from './superadmin/superadmin.routes';
import { createSupportRouter } from './support/support.routes';
import { createReportsRouter } from './reports/reports.routes';
import { createAnalyticsRouter } from './analytics/analytics.routes';
import { createPerformanceRouter } from './performance/performance.routes';
import { createBeatsRouter } from './beats/beats.routes';
import { createAttendanceRouter } from './attendance/attendance.routes';
import { createVisitsRouter } from './visits/visits.routes';
import { createTrackingRouter } from './tracking/tracking.routes';
import { createLiveMapRouter } from './live-map/live-map.routes';
import { createSyncRouter } from './sync/sync.routes';
import { createHierarchyRouter } from './hierarchy/hierarchy.routes';
import { createOutletsRouter } from './outlets/outlets.routes';
import { createProductsRouter } from './products/products.routes';
import { createDistributorsRouter } from './distributors/distributors.routes';
import { createNotificationsRouter } from './notifications/notifications.routes';
import { createTaxRatesRouter } from './tax-rates/tax-rates.routes';
import { createSchemesRouter } from './schemes/schemes.routes';
import { createPriceListsRouter } from './price-lists/price-lists.routes';

const logger = new Logger('App');
let corsWarningLogged = false;

// https://bharatsales-ai-web.vercel.app and its Vercel preview URLs
// (bharatsales-ai-web-<hash>-<scope>.vercel.app / -git-<branch>-<scope>).
export const DEFAULT_PROD_ORIGIN = /^https:\/\/bharatsales-ai-web(-[a-z0-9-]+)?\.vercel\.app$/;

function corsOptions(): CorsOptions {
  const allowlist = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowlist.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      // No CORS_ORIGINS configured: allow only the project's own Vercel web
      // dashboard (production URL + its preview deployments), never any origin.
      if (!corsWarningLogged) {
        logger.warn('CORS_ORIGINS is not set in production: allowing only the default BharatSales Vercel origins.');
      }
      corsWarningLogged = true;
      return { credentials: true, origin: (origin, cb) => cb(null, !origin || DEFAULT_PROD_ORIGIN.test(origin)) };
    }
    if (!corsWarningLogged && process.env.NODE_ENV !== 'test') {
      logger.warn('CORS_ORIGINS is not set: reflecting any request origin. Set CORS_ORIGINS (comma-separated) in production.');
    }
    corsWarningLogged = true;
    return { origin: true, credentials: true };
  }

  return {
    credentials: true,
    // Requests without an Origin header (mobile app, curl, server-to-server)
    // are not browser cross-origin requests and are allowed through.
    origin: (origin, cb) => cb(null, !origin || allowlist.includes(origin)),
  };
}

function trustProxySetting(raw: string | undefined): boolean | number | string {
  if (raw === undefined || raw.trim() === '') return 1;
  const v = raw.trim();
  if (v === 'false') return false;
  if (v === 'true') return true;
  if (/^\d+$/.test(v)) return Number(v);
  return v;
}

export function createApp(c: Container): Express {
  const app = express();

  // Must match the real deployment so req.ip (rate-limit keys, audit IPs)
  // cannot be spoofed through X-Forwarded-For. Default: one reverse proxy hop.
  // TRUST_PROXY accepts a hop count, 'false', or an Express trust-proxy list.
  app.set('trust proxy', trustProxySetting(process.env.TRUST_PROXY));
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    compression({
      // Never buffer Server-Sent Events (GET /live-map/stream): gzip would hold
      // each 5s event in its window and the client would see nothing.
      filter: (req, res) => {
        const type = String(res.getHeader('Content-Type') || '');
        if (type.startsWith('text/event-stream')) return false;
        return compression.filter(req, res);
      },
    }),
  );
  app.use(cors(corsOptions()));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(sanitizeInput);

  app.use(apiLimiter);

  // Public
  app.use('/', createAppRouter());
  app.use('/health', createHealthRouter(c.connection));
  // GET /uploads/:file is public (GridFS, then legacy disk files); POST is authenticated.
  app.use('/uploads', createUploadsRouter(c));
  app.use('/auth', createAuthRouter(c));

  // Tenant
  app.use('/users', createUsersRouter(c));
  app.use('/settings', createSettingsRouter(c));
  app.use('/onboarding', createOnboardingRouter(c));

  // Orders & supply chain
  app.use('/orders', createOrdersRouter(c));
  app.use('/inventory', createInventoryRouter(c));
  app.use('/dispatches', createDispatchRouter(c));
  app.use('/returns', createReturnsRouter(c));

  // Finance
  app.use('/collections', createCollectionsRouter(c));
  app.use('/api/v1/finance', createFinanceRouter(c));
  app.use('/approvals', createApprovalsRouter(c));
  app.use('/targets', createTargetsRouter(c));
  app.use('/incentives', createIncentivesRouter(c));

  // Platform & reports
  app.use('/superadmin', createSuperadminRouter(c));
  app.use('/support', createSupportRouter(c));
  app.use('/reports', createReportsRouter(c));
  app.use('/analytics', createAnalyticsRouter(c));
  app.use('/api/v1/performance', createPerformanceRouter(c));

  // Field ops
  app.use('/beats', createBeatsRouter(c));
  app.use('/attendance', createAttendanceRouter(c));
  app.use('/visits', createVisitsRouter(c));
  app.use('/tracking', createTrackingRouter(c));
  app.use('/live-map', createLiveMapRouter(c));
  app.use('/sync', createSyncRouter(c));
  app.use('/hierarchy', createHierarchyRouter(c));

  // Catalog
  app.use('/outlets', createOutletsRouter(c));
  app.use('/products', createProductsRouter(c));
  app.use('/distributors', createDistributorsRouter(c));
  app.use('/notifications', createNotificationsRouter(c));
  app.use('/tax-rates', createTaxRatesRouter(c));
  app.use('/schemes', createSchemesRouter(c));
  app.use('/price-lists', createPriceListsRouter(c));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
