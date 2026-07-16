import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { AuditEntity } from '../audit/audit.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles('Super Admin', 'Company Admin')
  async getSettings(@Request() req: any) {
    const orgId = req.user.orgId;
    return this.settingsService.getSettings(orgId);
  }

  @Put()
  @Roles('Super Admin', 'Company Admin')
  @AuditEntity('Tenant')
  async updateSettings(@Request() req: any, @Body() updateData: any) {
    const orgId = req.user.orgId;
    // ensure users can't override the status or plan via general settings endpoint
    delete updateData.status;
    delete updateData.plan;
    return this.settingsService.updateSettings(orgId, updateData);
  }
}
