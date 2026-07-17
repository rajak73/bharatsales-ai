import { Controller, Get, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { PriceListsService } from './price-lists.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('price-lists')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class PriceListsController {
  constructor(private readonly priceListsService: PriceListsService) {}

  @Get()
  async getPriceLists(@Request() req: any) {
    const orgId = req.user.orgId || req.user.organizationId;
    return this.priceListsService.findAllByOrgId(orgId);
  }

  @Get('items')
  async getPriceListItems(@Request() req: any) {
    const orgId = req.user.orgId || req.user.organizationId;
    return this.priceListsService.findAllItemsByOrgId(orgId);
  }
}
