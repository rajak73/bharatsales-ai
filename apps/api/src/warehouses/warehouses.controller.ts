import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('warehouses')
@UseGuards(JwtAuthGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  async getWarehouses(@Query('organizationId') organizationId: string) {
    return this.warehousesService.getWarehouses(organizationId);
  }
}
