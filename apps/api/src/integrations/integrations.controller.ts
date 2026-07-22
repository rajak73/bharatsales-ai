import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('integrations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Integrations')
@UseInterceptors(AuditInterceptor)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

@RequirePermissions(Resource.Integrations, Action.Read)
  @Get()
  async getIntegrations(@Request() req: any) {
    return this.integrationsService.findAllByOrgId(req.user.orgId);
  }

@RequirePermissions(Resource.Integrations, Action.Create)
  @Post()
  async createIntegration(@Request() req: any, @Body() data: any) {
    return this.integrationsService.create(req.user.orgId, data);
  }

@RequirePermissions(Resource.Integrations, Action.Update)
  @Put(':id')
  async updateIntegration(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.integrationsService.update(req.user.orgId, id, data);
  }

@RequirePermissions(Resource.Integrations, Action.Delete)
  @Delete(':id')
  async deleteIntegration(@Request() req: any, @Param('id') id: string) {
    return this.integrationsService.remove(req.user.orgId, id);
  }
}
