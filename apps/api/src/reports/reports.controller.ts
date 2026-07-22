import { Controller, Get, Post, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Reports')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

@RequirePermissions(Resource.Reports, Action.Read)
  @Get()
  getReports(@Request() req: any) {
    return this.reportsService.getReports(req.user.orgId);
  }

@RequirePermissions(Resource.Reports, Action.Read)
  @Get('stats')
  getReportStats(@Request() req: any) {
    return this.reportsService.getReportStats(req.user.orgId);
  }

@RequirePermissions(Resource.Reports, Action.Create)
  @Post('run')
  runReport(@Request() req: any, @Body() payload: any) {
    return this.reportsService.runReport(req.user.orgId, payload);
  }

@RequirePermissions(Resource.Reports, Action.Read)
  @Get('jobs/:id')
  getJobStatus(@Request() req: any, @Param('id') id: string) {
    return this.reportsService.getJobStatus(req.user.orgId, id);
  }

@RequirePermissions(Resource.Reports, Action.Read)
  @Get('exports/:id')
  getExport(@Request() req: any, @Param('id') id: string) {
    return this.reportsService.getExport(req.user.orgId, id);
  }
}
