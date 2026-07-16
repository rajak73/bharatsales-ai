import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { DistributorsService } from './distributors.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Action, Resource } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { Distributor } from '@bharatsales/shared-types';

@Controller('distributors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class DistributorsController {
  constructor(private readonly distributorsService: DistributorsService) {}

  @Get()
  @RequirePermissions(Resource.Distributors, Action.Read)
  async getDistributors(@Request() req: any) {
    return this.distributorsService.getDistributors(req.user.orgId);
  }

  @Post()
  @RequirePermissions(Resource.Distributors, Action.Create)
  @AuditEntity('Distributor')
  async createDistributor(@Request() req: any, @Body() distributorData: Omit<Distributor, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
    return this.distributorsService.create(req.user.orgId, distributorData);
  }

  @Patch(':id')
  @RequirePermissions(Resource.Distributors, Action.Update)
  @AuditEntity('Distributor')
  async updateDistributor(@Request() req: any, @Param('id') id: string, @Body() updateData: Partial<Distributor>) {
    return this.distributorsService.update(req.user.orgId, id, updateData);
  }

  @Delete(':id')
  @RequirePermissions(Resource.Distributors, Action.Delete)
  @AuditEntity('Distributor')
  async deleteDistributor(@Request() req: any, @Param('id') id: string) {
    return this.distributorsService.delete(req.user.orgId, id);
  }
}
