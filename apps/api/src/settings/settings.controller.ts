import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { AuditEntity } from '../audit/audit.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Resource, Action } from '@bharatsales/permissions';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

@RequirePermissions(Resource.Settings, Action.Read)
  @Get()
    async getSettings(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.settingsService.getSettings(orgId);
  }

@RequirePermissions(Resource.Settings, Action.Update)
  @Put()
    @AuditEntity('Tenant')
  async updateSettings(@Request() req: any, @Body() updateData: any) {
    const orgId = req.user.orgId;
    // ensure users can't override the status or plan via general settings endpoint
    delete updateData.status;
    delete updateData.plan;
    return this.settingsService.updateSettings(orgId, updateData);
  }
}
