import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ReturnOrder as SharedReturnOrder } from '@bharatsales/shared-types';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('returns')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Returns')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

@RequirePermissions(Resource.Returns, Action.Read)
  @Get()
  async getReturns(@Request() req: any) {
    return this.returnsService.getReturns(req.user.orgId);
  }

@RequirePermissions(Resource.Returns, Action.Create)
  @Post()
  async createReturn(
    @Request() req: any, 
    @Body() data: Omit<SharedReturnOrder, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>
  ) {
    return this.returnsService.create(req.user.orgId, data, req.user.sub);
  }

@RequirePermissions(Resource.Returns, Action.Update)
  @Put(':id')
  async updateReturn(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.returnsService.update(req.user.orgId, id, data);
  }

  @RequirePermissions(Resource.Returns, Action.Delete)
  @Delete(':id')
  async deleteReturn(@Request() req: any, @Param('id') id: string) {
    return this.returnsService.remove(req.user.orgId, id);
  }

  @RequirePermissions(Resource.Returns, Action.Update)
  @Post(':id/approve')
  async approveReturn(@Request() req: any, @Param('id') id: string) {
    return this.returnsService.approveReturn(req.user.orgId, id, req.user.sub);
  }

  @RequirePermissions(Resource.Returns, Action.Update)
  @Post(':id/reject')
  async rejectReturn(@Request() req: any, @Param('id') id: string) {
    return this.returnsService.rejectReturn(req.user.orgId, id, req.user.sub);
  }
}
