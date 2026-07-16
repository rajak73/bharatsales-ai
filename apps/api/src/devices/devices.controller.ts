import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('devices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  async getDevices(@Query('organizationId') organizationId: string) {
    return this.devicesService.findAllByOrgId(organizationId);
  }
}
