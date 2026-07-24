import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Resource, Action } from '@bharatsales/permissions';
import { Claim, ClaimStatus } from '@bharatsales/shared-types';

@Controller('claims')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Claims')
@UseInterceptors(AuditInterceptor)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @RequirePermissions(Resource.Claims, Action.Read)
  @Get()
  async getAll(@Request() req: any) {
    return this.claimsService.findAll(req.user.orgId);
  }

  @RequirePermissions(Resource.Claims, Action.Read)
  @Get(':id')
  async getById(@Request() req: any, @Param('id') id: string) {
    return this.claimsService.findById(req.user.orgId, id);
  }

  @RequirePermissions(Resource.Claims, Action.Create)
  @Post()
  async create(@Request() req: any, @Body() data: Partial<Claim>) {
    return this.claimsService.create(req.user.orgId, req.user.sub, data);
  }

  @RequirePermissions(Resource.Claims, Action.Approve)
  @Post(':id/approve')
  async approve(@Request() req: any, @Param('id') id: string, @Body() data: { reason?: string }) {
    return this.claimsService.updateStatus(req.user.orgId, id, 'Approved', req.user.sub, data.reason);
  }

  @RequirePermissions(Resource.Claims, Action.Approve)
  @Post(':id/reject')
  async reject(@Request() req: any, @Param('id') id: string, @Body() data: { reason?: string }) {
    return this.claimsService.updateStatus(req.user.orgId, id, 'Rejected', req.user.sub, data.reason);
  }
}
