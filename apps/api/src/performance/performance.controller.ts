import { Controller, Get, UseGuards, Request, Query, UseInterceptors } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('api/v1/performance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Analytics')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

@RequirePermissions(Resource.Analytics, Action.Read)
  @Get('dsr')
  getDailySalesReport(@Request() req: any, @Query('date') date: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.performanceService.generateDSR(req.user.orgId, req.user.sub, targetDate);
  }

@RequirePermissions(Resource.Analytics, Action.Read)
  @Get('targets')
  getTargets(@Request() req: any) {
    return this.performanceService.getUserTargets(req.user.orgId, req.user.sub);
  }
}
