import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getInventory(@Request() req: any) {
    return this.inventoryService.getInventory(req.user.orgId);
  }

  @Post('adjust')
  async adjustStock(
    @Request() req: any,
    @Body() adjustment: any
  ) {
    return this.inventoryService.adjustStock(req.user.orgId, adjustment);
  }
}
