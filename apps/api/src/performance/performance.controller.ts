import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('api/v1/performance')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('dsr')
  getDailySalesReport(@Request() req: any, @Query('date') date: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.performanceService.generateDSR(req.user.organizationId, req.user.userId, targetDate);
  }

  @Get('targets')
  getTargets(@Request() req: any) {
    return this.performanceService.getUserTargets(req.user.organizationId, req.user.userId);
  }
}
