import { Controller, Get, Post, Body, Query, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('api/v1/subscriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Subscriptions')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

@RequirePermissions(Resource.Subscriptions, Action.Read)
  @Get()
  async getDetails(@Request() req: any) {
    return this.subscriptionsService.getSubscriptionDetails(req.user.orgId);
  }

@RequirePermissions(Resource.Subscriptions, Action.Create)
  @Post('upgrade')
  async upgradePlan(
    @Request() req: any,
    @Body() body: { plan: 'Starter' | 'Growth' | 'Enterprise' }
  ) {
    return this.subscriptionsService.upgradePlan(req.user.orgId, body.plan);
  }
}
