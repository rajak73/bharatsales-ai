import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('approvals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Approvals')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

@RequirePermissions(Resource.Approvals, Action.Read)
  @Get()
  async getApprovals(@Request() req: any) {
    return this.approvalsService.findAllApprovals(req.user.orgId);
  }

@RequirePermissions(Resource.Approvals, Action.Create)
  @Post()
  async createApproval(@Request() req: any, @Body() data: any) {
    return this.approvalsService.createApproval(req.user.orgId, data);
  }

@RequirePermissions(Resource.Approvals, Action.Update)
  @Put(':id')
  async updateApproval(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.approvalsService.updateApproval(req.user.orgId, id, data);
  }

@RequirePermissions(Resource.Approvals, Action.Delete)
  @Delete(':id')
  async deleteApproval(@Request() req: any, @Param('id') id: string) {
    return this.approvalsService.deleteApproval(req.user.orgId, id);
  }

@RequirePermissions(Resource.Approvals, Action.Read)
  @Get('rules')
  async getApprovalRules(@Request() req: any) {
    return this.approvalsService.findAllRules(req.user.orgId);
  }

@RequirePermissions(Resource.Approvals, Action.Create)
  @Post('rules')
  async createRule(@Request() req: any, @Body() data: any) {
    return this.approvalsService.createRule(req.user.orgId, data);
  }

@RequirePermissions(Resource.Approvals, Action.Update)
  @Put('rules/:id')
  async updateRule(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.approvalsService.updateRule(req.user.orgId, id, data);
  }

@RequirePermissions(Resource.Approvals, Action.Delete)
  @Delete('rules/:id')
  async deleteRule(@Request() req: any, @Param('id') id: string) {
    return this.approvalsService.deleteRule(req.user.orgId, id);
  }
}
