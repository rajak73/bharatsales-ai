import { Controller, Get, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Analytics')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

@RequirePermissions(Resource.Analytics, Action.Read)
  @Get('dashboard')
  getDashboardData(@Request() req: any) {
    return this.analyticsService.getDashboardData(req.user.orgId);
  }
}
