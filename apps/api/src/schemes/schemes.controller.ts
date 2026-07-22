import { Controller, Get, Post, Put, Param, Body, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { SchemesService } from './schemes.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Scheme as SharedScheme } from '@bharatsales/shared-types';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('schemes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Schemes')
@UseInterceptors(AuditInterceptor)
export class SchemesController {
  constructor(private readonly schemesService: SchemesService) {}

@RequirePermissions(Resource.Schemes, Action.Read)
  @Get()
  async getAllSchemes(@Request() req: any) {
    return this.schemesService.findAll(req.user.orgId);
  }

@RequirePermissions(Resource.Schemes, Action.Read)
  @Get('active')
  async getActiveSchemes(@Request() req: any) {
    return this.schemesService.getActiveSchemes(req.user.orgId);
  }

@RequirePermissions(Resource.Schemes, Action.Create)
  @Post()
    async createScheme(
    @Request() req: any, 
    @Body() data: Omit<SharedScheme, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>
  ) {
    return this.schemesService.create(req.user.orgId, data);
  }

@RequirePermissions(Resource.Schemes, Action.Update)
  @Put(':id/deactivate')
    async deactivateScheme(@Request() req: any, @Param('id') schemeId: string) {
    return this.schemesService.deactivate(req.user.orgId, schemeId);
  }
}
