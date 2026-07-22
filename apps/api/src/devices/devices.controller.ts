import { Controller, Request, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('devices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Users')
@UseInterceptors(AuditInterceptor)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

@RequirePermissions(Resource.Users, Action.Read)
  @Get()
  async getDevices(@Request() req: any) {
    return this.devicesService.findAllByOrgId(req.user.orgId);
  }

@RequirePermissions(Resource.Users, Action.Create)
  @Post()
  async createDevice(@Request() req: any, @Body() data: any) {
    return this.devicesService.create(req.user.orgId, data);
  }

@RequirePermissions(Resource.Users, Action.Update)
  @Put(':id')
  async updateDevice(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.devicesService.update(req.user.orgId, id, data);
  }

@RequirePermissions(Resource.Users, Action.Delete)
  @Delete(':id')
  async deleteDevice(@Request() req: any, @Param('id') id: string) {
    return this.devicesService.remove(req.user.orgId, id);
  }
}
