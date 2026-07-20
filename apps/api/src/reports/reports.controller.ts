import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  getReports(@Request() req: any) {
    return this.reportsService.getReports(req.user.orgId);
  }

  @Get('stats')
  getReportStats(@Request() req: any) {
    return this.reportsService.getReportStats(req.user.orgId);
  }

  @Post('run')
  runReport(@Request() req: any, @Body() payload: any) {
    return this.reportsService.runReport(req.user.orgId, payload);
  }

  @Get('jobs/:id')
  getJobStatus(@Request() req: any, @Param('id') id: string) {
    return this.reportsService.getJobStatus(req.user.orgId, id);
  }

  @Get('exports/:id')
  getExport(@Request() req: any, @Param('id') id: string) {
    return this.reportsService.getExport(req.user.orgId, id);
  }
}
