import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { PriceListsService } from './price-lists.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { PriceList } from '@bharatsales/shared-types';

@Controller('price-lists')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class PriceListsController {
  constructor(private readonly priceListsService: PriceListsService) {}

  @RequirePermissions(Resource.PriceLists, Action.Read)
  @Get()
  async getPriceLists(@Request() req: any) {
    return this.priceListsService.findAllByOrgId(req.user.orgId);
  }

  @RequirePermissions(Resource.PriceLists, Action.Create)
  @Post()
  @AuditEntity('PriceList')
  async createPriceList(@Request() req: any, @Body() data: Omit<PriceList, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
    return this.priceListsService.create(req.user.orgId, data);
  }

  @RequirePermissions(Resource.PriceLists, Action.Update)
  @Put(':id')
  @AuditEntity('PriceList')
  async updatePriceList(@Request() req: any, @Param('id') id: string, @Body() data: Partial<PriceList>) {
    return this.priceListsService.update(req.user.orgId, id, data);
  }

  @RequirePermissions(Resource.PriceLists, Action.Delete)
  @Delete(':id')
  @AuditEntity('PriceList')
  async deletePriceList(@Request() req: any, @Param('id') id: string) {
    return this.priceListsService.remove(req.user.orgId, id);
  }
}
