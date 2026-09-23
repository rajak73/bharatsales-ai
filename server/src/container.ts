import type { Connection } from 'mongoose';
import { registerModels, Models } from './models';

import { AuditService } from './audit/audit.service';
import { NotificationsService } from './notifications/notifications.service';
import { BrevoEmailProvider } from './common/email.provider';
import { HierarchyService } from './hierarchy/hierarchy.service';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { SettingsService } from './settings/settings.service';
import { OnboardingService } from './onboarding/onboarding.service';
import { InventoryService } from './inventory/inventory.service';
import { InventoryCleanupService } from './inventory/inventory.cleanup.service';
import { ApprovalsService } from './approvals/approvals.service';
import { AttendanceService } from './attendance/attendance.service';
import { OrdersService } from './orders/orders.service';
import { FinanceService } from './finance/finance.service';
import { ReturnsService } from './returns/returns.service';
import { DispatchService } from './dispatch/dispatch.service';
import { CollectionsService } from './collections/collections.service';
import { TargetsService } from './targets/targets.service';
import { IncentivesService } from './incentives/incentives.service';
import { SupportService } from './support/support.service';
import { ReportsService } from './reports/reports.service';
import { AnalyticsService } from './analytics/analytics.service';
import { PerformanceService } from './performance/performance.service';
import { SuperadminService } from './superadmin/superadmin.service';
import { BeatsService } from './beats/beats.service';
import { VisitsService } from './visits/visits.service';
import { TrackingService } from './tracking/tracking.service';
import { LiveMapService } from './live-map/live-map.service';
import { SyncService } from './sync/sync.service';
import { OutletsService } from './outlets/outlets.service';
import { ProductsService } from './products/products.service';
import { DistributorsService } from './distributors/distributors.service';
import { TaxRatesService } from './tax-rates/tax-rates.service';
import { SchemesService } from './schemes/schemes.service';
import { PriceListsService } from './price-lists/price-lists.service';
import { createStorageProvider, IStorageProvider } from './uploads/storage.provider';

export interface ContainerOptions {
  /** Override the upload storage (default: STORAGE_DRIVER, i.e. GridFS). */
  storageProvider?: IStorageProvider;
}

/**
 * Replaces Nest's DI container: registers every Mongoose model on `conn` and
 * instantiates every service in dependency order. None of the services has a
 * circular dependency any more (the old forwardRef/ModuleRef injections were
 * unused), so no setters are needed.
 */
export function buildContainer(conn: Connection, opts: ContainerOptions = {}) {
  const models = registerModels(conn);
  const m = models;

  // Leaf services
  const auditService = new AuditService(m.AuditLog);
  const notificationsService = new NotificationsService(m.NotificationLog, m.AppNotification);
  const emailProvider = new BrevoEmailProvider();
  const hierarchyService = new HierarchyService(m.HierarchyNode, m.User);
  const approvalsService = new ApprovalsService(m.Approval, m.ApprovalRule);
  const inventoryService = new InventoryService(m.Inventory, m.Product);
  const financeService = new FinanceService(m.Invoice, m.Collection, m.Outlet, m.Order, hierarchyService);

  // Identity / tenant
  const authService = new AuthService(
    m.User, m.Tenant, m.Session, m.Token, auditService, notificationsService, emailProvider,
  );
  const usersService = new UsersService(m.User, m.Token, m.Tenant, hierarchyService, emailProvider);
  const settingsService = new SettingsService(m.Tenant);
  const onboardingService = new OnboardingService(m.OnboardingState, m.Tenant);

  // Field ops
  const attendanceService = new AttendanceService(m.AttendanceSession, m.Visit, hierarchyService);
  const beatsService = new BeatsService(
    m.Beat, m.BeatSchedule, m.Visit, m.User, m.LocationPing, m.AttendanceSession,
    hierarchyService, notificationsService,
  );
  const visitsService = new VisitsService(m.Visit, m.Outlet, m.Order);
  const trackingService = new TrackingService(m.LocationPing, m.AttendanceSession);
  const liveMapService = new LiveMapService(m.AttendanceSession, m.Visit, m.LocationPing);

  // Orders / supply chain
  const ordersService = new OrdersService(
    m.Order, m.Outlet, m.Scheme, m.Distributor, m.Product,
    inventoryService, approvalsService, hierarchyService, attendanceService, notificationsService,
    conn,
  );
  approvalsService.setDecisionHandler((orgId, orderNumber, decision, actorId, reason) =>
    ordersService.resolveApprovalRequest(orgId, orderNumber, decision, actorId, reason));
  const inventoryCleanupService = new InventoryCleanupService(m.Order, inventoryService);
  const returnsService = new ReturnsService(
    m.ReturnOrder, m.Outlet, m.Invoice, m.Order, m.Product,
    inventoryService, financeService, hierarchyService,
  );
  const dispatchService = new DispatchService(m.Dispatch, m.Order, ordersService, returnsService, conn);
  const collectionsService = new CollectionsService(m.Collection, m.Outlet, m.Invoice, m.Order, conn, hierarchyService);
  const syncService = new SyncService(
    m.Order, m.Visit, m.Collection, m.Product, m.PriceList, m.Outlet,
    ordersService, inventoryService, hierarchyService, collectionsService,
  );

  // Finance / performance
  const targetsService = new TargetsService(m.Target, m.Order, notificationsService);
  const incentivesService = new IncentivesService(m.IncentivePlan, m.IncentivePayout, hierarchyService);
  const performanceService = new PerformanceService(
    m.Target, m.Order, m.Collection, m.Visit, m.User, hierarchyService, targetsService,
  );

  // Platform / reporting
  const supportService = new SupportService(m.SupportTicket);
  const reportsService = new ReportsService(m.Order, m.Outlet, m.ReportJob, m.ScheduledReport, hierarchyService);
  const analyticsService = new AnalyticsService(m.Order, m.Collection, m.Visit, m.User, m.Outlet, m.Target, m.Inventory, m.Product);
  const superadminService = new SuperadminService(
    m.Tenant, m.User, m.PlatformSettings, m.Session, conn, auditService, notificationsService,
  );

  // Catalog
  const outletsService = new OutletsService(
    m.Outlet, m.Order, m.Visit, m.Tenant, m.User, hierarchyService, notificationsService,
  );
  const productsService = new ProductsService(m.Product, m.Outlet);
  const distributorsService = new DistributorsService(m.Distributor, m.Order, m.Inventory);
  const taxRatesService = new TaxRatesService(m.TaxRate);
  const schemesService = new SchemesService(m.Scheme);
  const priceListsService = new PriceListsService(m.PriceList);
  const storageProvider: IStorageProvider = opts.storageProvider ?? createStorageProvider(conn);

  return {
    connection: conn,
    models,
    auditService,
    notificationsService,
    emailProvider,
    hierarchyService,
    approvalsService,
    inventoryService,
    financeService,
    authService,
    usersService,
    settingsService,
    onboardingService,
    attendanceService,
    beatsService,
    visitsService,
    trackingService,
    liveMapService,
    ordersService,
    inventoryCleanupService,
    returnsService,
    dispatchService,
    syncService,
    collectionsService,
    targetsService,
    incentivesService,
    performanceService,
    supportService,
    reportsService,
    analyticsService,
    superadminService,
    outletsService,
    productsService,
    distributorsService,
    taxRatesService,
    schemesService,
    priceListsService,
    storageProvider,
  };
}

export type Container = ReturnType<typeof buildContainer>;
export type { Models };
