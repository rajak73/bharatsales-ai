import { Controller, Get, Put, Body, UseGuards, Request, UseInterceptors, Post } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Resource, Action } from '@bharatsales/permissions';

@Controller('onboarding')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

@RequirePermissions(Resource.Settings, Action.Read)
  @Get()
    async getOnboardingState(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.onboardingService.getState(orgId);
  }

@RequirePermissions(Resource.Settings, Action.Update)
  @Put('step/:stepNumber')
    @AuditEntity('OnboardingState')
  async saveStep(
    @Request() req: any,
    @Body() stepData: any,
  ) {
    const orgId = req.user.orgId;
    return this.onboardingService.saveStep(orgId, stepData);
  }

@RequirePermissions(Resource.Settings, Action.Create)
  @Post('complete')
    @AuditEntity('OnboardingState')
  async completeOnboarding(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.onboardingService.completeOnboarding(orgId);
  }
}
