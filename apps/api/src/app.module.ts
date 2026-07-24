import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantSchema, UserSchema, OutletSchema, ProductSchema, OrderSchema, SchemeSchema, DistributorSchema, InvoiceSchema, CollectionSchema, TargetSchema, WarehouseSchema, InventorySchema, DispatchSchema, ReturnSchema, NotificationLogSchema, SessionSchema, AuditLogSchema, AttendanceSessionSchema, VisitSchema, BeatSchema, BeatScheduleSchema, LocationPingSchema, IntegrationSchema, ApprovalSchema, ApprovalRuleSchema, ExpenseSchema, PriceListSchema, TaxRateSchema } from './schemas';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { OutletsModule } from './outlets/outlets.module';
import { ProductsModule } from './products/products.module';

import { OrdersModule } from './orders/orders.module';
import { AttendanceModule } from './attendance/attendance.module';
import { VisitsModule } from './visits/visits.module';
import { FinanceModule } from './finance/finance.module';
import { PerformanceModule } from './performance/performance.module';
import { AiFeaturesModule } from './ai-features/ai-features.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DistributorsModule } from './distributors/distributors.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { ImportsModule } from './imports/imports.module';
import { InventoryModule } from './inventory/inventory.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { ReturnsModule } from './returns/returns.module';
import { LiveMapModule } from './live-map/live-map.module';
import { Outlet360Module } from './outlet-360/outlet-360.module';
import { TargetsModule } from './targets/targets.module';
import { BeatsModule } from './beats/beats.module';
import { TrackingModule } from './tracking/tracking.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { SettingsModule } from './settings/settings.module';
import { HierarchyModule } from './hierarchy/hierarchy.module';
import { UsersModule } from './users/users.module';
import { SchemesModule } from './schemes/schemes.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PriceListsModule } from './price-lists/price-lists.module';
import { TaxRatesModule } from './tax-rates/tax-rates.module';
import { CollectionsModule } from './collections/collections.module';
import { SyncModule } from './sync/sync.module';
import { ClaimsModule } from './claims/claims.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { ExportsModule } from './exports/exports.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 1000,
    }]),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/bharatsales'),
    MongooseModule.forFeature([
      { name: 'Tenant', schema: TenantSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Outlet', schema: OutletSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'Scheme', schema: SchemeSchema },
      { name: 'Distributor', schema: DistributorSchema },
      { name: 'Invoice', schema: InvoiceSchema },
      { name: 'Collection', schema: CollectionSchema },
      { name: 'Target', schema: TargetSchema },
      { name: 'Warehouse', schema: WarehouseSchema },
      { name: 'Inventory', schema: InventorySchema },
      { name: 'Dispatch', schema: DispatchSchema },
      { name: 'ReturnOrder', schema: ReturnSchema },
      { name: 'NotificationLog', schema: NotificationLogSchema },
      { name: 'Session', schema: SessionSchema },
      { name: 'AuditLog', schema: AuditLogSchema },
      { name: 'AttendanceSession', schema: AttendanceSessionSchema },
      { name: 'Visit', schema: VisitSchema },
      { name: 'Beat', schema: BeatSchema },
      { name: 'BeatSchedule', schema: BeatScheduleSchema },
      { name: 'LocationPing', schema: LocationPingSchema },
      { name: 'Integration', schema: IntegrationSchema },
      { name: 'Approval', schema: ApprovalSchema },
      { name: 'ApprovalRule', schema: ApprovalRuleSchema },
      { name: 'Expense', schema: ExpenseSchema },
      { name: 'PriceList', schema: PriceListSchema },
      { name: 'TaxRate', schema: TaxRateSchema },
    ]),
    AuthModule,
    AuditModule,
    OutletsModule,
    ProductsModule,
    OrdersModule,
    AttendanceModule,
    VisitsModule,
    FinanceModule,
    PerformanceModule,
    AiFeaturesModule,
    SubscriptionsModule,
    HealthModule,
    NotificationsModule,
    DistributorsModule,
    WarehousesModule,
    ImportsModule,
    InventoryModule,
    DispatchModule,
    ReturnsModule,
    LiveMapModule,
    Outlet360Module,
    TargetsModule,
    BeatsModule,
    TrackingModule,
    SettingsModule,
    HierarchyModule,
    UsersModule,
    SchemesModule,
    IntegrationsModule,
    ApprovalsModule,
    AnalyticsModule,
    ReportsModule,
    OnboardingModule,
    ExpensesModule,
    PriceListsModule,
    TaxRatesModule,
    CollectionsModule,
    SyncModule,
    ClaimsModule,
    SuperadminModule,
    ExportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
