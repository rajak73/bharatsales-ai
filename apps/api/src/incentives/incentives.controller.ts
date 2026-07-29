import { Controller, Get, Post, Body, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { IncentivesService } from './incentives.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Resource, Action } from '@bharatsales/permissions';
import { IncentivePlan, IncentivePayout } from '@bharatsales/shared-types';

@Controller('incentives')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Incentives')
@UseInterceptors(AuditInterceptor)
export class IncentivesController {
  constructor(private readonly incentivesService: IncentivesService) {}

  @RequirePermissions(Resource.Targets, Action.Read)
  @Get('plans')
  async getIncentivePlans(@Request() req: any) {
    return this.incentivesService.getIncentivePlans(req.user.orgId);
  }

  @RequirePermissions(Resource.Targets, Action.Read)
  @Get('payouts')
  async getIncentivePayouts(@Request() req: any) {
    return this.incentivesService.getIncentivePayouts(req.user.orgId);
  }

  @RequirePermissions(Resource.Targets, Action.Create)
  @Post('plans')
  async createIncentivePlan(@Request() req: any, @Body() body: Partial<IncentivePlan>) {
    return this.incentivesService.createIncentivePlan(req.user.orgId, body);
  }

  @RequirePermissions(Resource.Targets, Action.Create)
  @Post('payouts')
  async createIncentivePayout(@Request() req: any, @Body() body: Partial<IncentivePayout>) {
    return this.incentivesService.createIncentivePayout(req.user.orgId, body);
  }
}
