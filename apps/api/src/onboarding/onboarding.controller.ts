import { Controller, Get, Put, Body, UseGuards, Request, UseInterceptors, Post } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';

@Controller('onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  @Roles('Super Admin', 'Company Admin')
  async getOnboardingState(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.onboardingService.getState(orgId);
  }

  @Put('step/:stepNumber')
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('OnboardingState')
  async saveStep(
    @Request() req: any,
    @Body() stepData: any,
  ) {
    const orgId = req.user.orgId;
    return this.onboardingService.saveStep(orgId, stepData);
  }

  @Post('complete')
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('OnboardingState')
  async completeOnboarding(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.onboardingService.completeOnboarding(orgId);
  }
}
