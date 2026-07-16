import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async getDetails(@Query('organizationId') organizationId: string) {
    return this.subscriptionsService.getSubscriptionDetails(organizationId);
  }

  @Post('upgrade')
  async upgradePlan(
    @Query('organizationId') organizationId: string,
    @Body() body: { plan: 'Starter' | 'Growth' | 'Enterprise' }
  ) {
    return this.subscriptionsService.upgradePlan(organizationId, body.plan);
  }
}
