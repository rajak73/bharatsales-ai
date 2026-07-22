import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { PriceListsService } from './price-lists.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';

@Controller('price-lists')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('PriceLists')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class PriceListsController {
  constructor(private readonly priceListsService: PriceListsService) {}

@RequirePermissions(Resource.PriceLists, Action.Read)
  @Get()
  async getPriceLists(@Request() req: any) {
    const orgId = req.user.orgId || req.user.orgId;
    return this.priceListsService.findAllByOrgId(orgId);
  }

@RequirePermissions(Resource.PriceLists, Action.Read)
  @Get('items')
  async getPriceListItems(@Request() req: any) {
    const orgId = req.user.orgId || req.user.orgId;
    return this.priceListsService.findAllItemsByOrgId(orgId);
  }

@RequirePermissions(Resource.PriceLists, Action.Create)
  @Post()
  async createPriceList(@Request() req: any, @Body() data: any) {
    const orgId = req.user.orgId;
    return this.priceListsService.create(orgId, data);
  }

@RequirePermissions(Resource.PriceLists, Action.Update)
  @Put(':id')
  async updatePriceList(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    const orgId = req.user.orgId;
    return this.priceListsService.update(orgId, id, data);
  }

@RequirePermissions(Resource.PriceLists, Action.Delete)
  @Delete(':id')
  async deletePriceList(@Request() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.priceListsService.remove(orgId, id);
  }
}
