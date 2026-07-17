import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('approvals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  async getApprovals(@Request() req: any) {
    return this.approvalsService.findAllApprovals(req.user.orgId);
  }

  @Get('rules')
  async getApprovalRules(@Request() req: any) {
    return this.approvalsService.findAllRules(req.user.orgId);
  }
}
