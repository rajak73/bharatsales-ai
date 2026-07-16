import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('approvals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  async getApprovals(@Query('organizationId') organizationId: string) {
    return this.approvalsService.findAllApprovals(organizationId);
  }

  @Get('rules')
  async getApprovalRules(@Query('organizationId') organizationId: string) {
    return this.approvalsService.findAllRules(organizationId);
  }
}
