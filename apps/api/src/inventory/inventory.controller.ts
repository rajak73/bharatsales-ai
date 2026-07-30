import { Controller, Get, Post, Body, UseGuards, Request, UseInterceptors, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Inventory')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @RequirePermissions(Resource.Inventory, Action.Read)
  @Get()
  async getInventory(@Request() req: any) {
    return this.inventoryService.getInventory(req.user.orgId, req.user);
  }

  @RequirePermissions(Resource.Inventory, Action.Read)
  @Get('batches/:productId')
  async getBatches(
    @Request() req: any,
    @Param('productId') productId: string
  ) {
    return this.inventoryService.getBatches(req.user.orgId, productId);
  }

@RequirePermissions(Resource.Inventory, Action.Update)
  @Post('adjust')
  async adjustStock(
    @Request() req: any,
    @Body() adjustment: any
  ) {
    return this.inventoryService.adjustStock(req.user.orgId, adjustment);
  }
}
