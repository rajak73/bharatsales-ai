import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getInventory(@Query('organizationId') organizationId: string) {
    return this.inventoryService.getInventory(organizationId);
  }

  @Post('adjust')
  async adjustStock(
    @Query('organizationId') organizationId: string,
    @Body() adjustment: any
  ) {
    return this.inventoryService.adjustStock(organizationId, adjustment);
  }
}
