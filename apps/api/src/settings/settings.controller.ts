import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { AuditEntity } from '../audit/audit.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions, Public } from '../auth/permissions.decorator';
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

  // Self-service — every authenticated role (including Sales Rep/Distributor,
  // who don't have Settings:Read) needs the org's name/logo/brand color to
  // display org identity in the mobile app. Deliberately whitelisted to just
  // name+branding, never the full tenant document (GST, billing, discount
  // authority, etc. stay behind the real Settings:Read permission above).
  @Public()
  @Get('branding')
  async getBranding(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.settingsService.getBranding(orgId);
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
