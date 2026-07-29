import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantSchema, UserSchema, OutletSchema, ProductSchema, OrderSchema, SchemeSchema, DistributorSchema, TargetSchema, NotificationLogSchema, SessionSchema, AuditLogSchema, AttendanceSessionSchema, VisitSchema, BeatSchema, BeatScheduleSchema, LocationPingSchema, IntegrationSchema, ApprovalSchema, ApprovalRuleSchema, PriceListSchema, TaxRateSchema } from './schemas';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { OutletsModule } from './outlets/outlets.module';
import { ProductsModule } from './products/products.module';

import { OrdersModule } from './orders/orders.module';
import { AttendanceModule } from './attendance/attendance.module';
import { VisitsModule } from './visits/visits.module';
import { PerformanceModule } from './performance/performance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DistributorsModule } from './distributors/distributors.module';
import { LiveMapModule } from './live-map/live-map.module';
import { TargetsModule } from './targets/targets.module';
import { BeatsModule } from './beats/beats.module';
import { TrackingModule } from './tracking/tracking.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { SettingsModule } from './settings/settings.module';
import { HierarchyModule } from './hierarchy/hierarchy.module';
import { UsersModule } from './users/users.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { SyncModule } from './sync/sync.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 1000,
    }]),
    ScheduleModule.forRoot(),
    ...(process.env.NODE_ENV !== 'test' ? [BullModule.forRoot(
      process.env.REDIS_URL 
        ? { redis: process.env.REDIS_URL }
        : {
            redis: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379'),
            }
          }
    )] : []),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/bharatsales'),
    MongooseModule.forFeature([
      { name: 'Tenant', schema: TenantSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Outlet', schema: OutletSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'Scheme', schema: SchemeSchema },
      { name: 'Distributor', schema: DistributorSchema },
      { name: 'Target', schema: TargetSchema },
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
    PerformanceModule,
    HealthModule,
    NotificationsModule,
    DistributorsModule,
    LiveMapModule,
    TargetsModule,
    BeatsModule,
    TrackingModule,
    SettingsModule,
    HierarchyModule,
    UsersModule,
    ApprovalsModule,
    AnalyticsModule,
    ReportsModule,
    OnboardingModule,
    SyncModule,
    SuperadminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
