import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { TaxRatesService } from './tax-rates.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';

@Controller('api/v1/tax-rates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('TaxRates')
@UseInterceptors(AuditInterceptor)
export class TaxRatesController {
  constructor(private readonly taxRatesService: TaxRatesService) {}

@RequirePermissions(Resource.TaxRates, Action.Read)
  @Get()
  async getTaxRates(@Request() req: any) {
    const orgId = req.user.orgId || req.user.orgId;
    return this.taxRatesService.findAllByOrgId(orgId);
  }

@RequirePermissions(Resource.TaxRates, Action.Create)
  @Post()
  async createTaxRate(@Request() req: any, @Body() data: any) {
    const orgId = req.user.orgId;
    return this.taxRatesService.create(orgId, data);
  }

@RequirePermissions(Resource.TaxRates, Action.Update)
  @Put(':id')
  async updateTaxRate(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    const orgId = req.user.orgId;
    return this.taxRatesService.update(orgId, id, data);
  }

@RequirePermissions(Resource.TaxRates, Action.Delete)
  @Delete(':id')
  async deleteTaxRate(@Request() req: any, @Param('id') id: string) {
    const orgId = req.user.orgId;
    return this.taxRatesService.remove(orgId, id);
  }
}
