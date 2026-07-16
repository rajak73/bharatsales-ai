import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('integrations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async getIntegrations(@Query('organizationId') organizationId: string) {
    return this.integrationsService.findAllByOrgId(organizationId);
  }
}
