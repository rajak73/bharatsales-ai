import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  getReports(@Request() req: any) {
    return this.reportsService.getReports(req.user.organizationId);
  }

  @Get('stats')
  getReportStats(@Request() req: any) {
    return this.reportsService.getReportStats(req.user.organizationId);
  }
}
