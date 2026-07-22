import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Warehouses')
@UseInterceptors(AuditInterceptor)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

@RequirePermissions(Resource.Warehouses, Action.Read)
  @Get()
  async getWarehouses(@Request() req: any) {
    return this.warehousesService.getWarehouses(req.user.orgId);
  }

@RequirePermissions(Resource.Warehouses, Action.Create)
  @Post()
  async createWarehouse(@Request() req: any, @Body() data: any) {
    return this.warehousesService.create(req.user.orgId, data);
  }

@RequirePermissions(Resource.Warehouses, Action.Update)
  @Put(':id')
  async updateWarehouse(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.warehousesService.update(req.user.orgId, id, data);
  }

@RequirePermissions(Resource.Warehouses, Action.Delete)
  @Delete(':id')
  async deleteWarehouse(@Request() req: any, @Param('id') id: string) {
    return this.warehousesService.remove(req.user.orgId, id);
  }
}
