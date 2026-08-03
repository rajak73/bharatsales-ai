import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { SchemesService } from './schemes.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { Scheme } from '@bharatsales/shared-types';

@Controller('schemes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class SchemesController {
  constructor(private readonly schemesService: SchemesService) {}

  @RequirePermissions(Resource.Schemes, Action.Read)
  @Get()
  async getSchemes(@Request() req: any) {
    return this.schemesService.findAllByOrgId(req.user.orgId);
  }

  @RequirePermissions(Resource.Schemes, Action.Create)
  @Post()
  @AuditEntity('Scheme')
  async createScheme(@Request() req: any, @Body() data: Omit<Scheme, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
    return this.schemesService.create(req.user.orgId, data);
  }

  @RequirePermissions(Resource.Schemes, Action.Update)
  @Put(':id')
  @AuditEntity('Scheme')
  async updateScheme(@Request() req: any, @Param('id') id: string, @Body() data: Partial<Scheme>) {
    return this.schemesService.update(req.user.orgId, id, data);
  }

  @RequirePermissions(Resource.Schemes, Action.Delete)
  @Delete(':id')
  @AuditEntity('Scheme')
  async deleteScheme(@Request() req: any, @Param('id') id: string) {
    return this.schemesService.remove(req.user.orgId, id);
  }
}
