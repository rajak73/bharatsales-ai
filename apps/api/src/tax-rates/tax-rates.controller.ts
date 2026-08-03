import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { TaxRatesService } from './tax-rates.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';
import { TaxRate } from '@bharatsales/shared-types';

@Controller('tax-rates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class TaxRatesController {
  constructor(private readonly taxRatesService: TaxRatesService) {}

  @RequirePermissions(Resource.TaxRates, Action.Read)
  @Get()
  async getTaxRates(@Request() req: any) {
    return this.taxRatesService.findAllByOrgId(req.user.orgId);
  }

  @RequirePermissions(Resource.TaxRates, Action.Create)
  @Post()
  @AuditEntity('TaxRate')
  async createTaxRate(@Request() req: any, @Body() data: Omit<TaxRate, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
    return this.taxRatesService.create(req.user.orgId, data);
  }

  @RequirePermissions(Resource.TaxRates, Action.Update)
  @Put(':id')
  @AuditEntity('TaxRate')
  async updateTaxRate(@Request() req: any, @Param('id') id: string, @Body() data: Partial<TaxRate>) {
    return this.taxRatesService.update(req.user.orgId, id, data);
  }

  @RequirePermissions(Resource.TaxRates, Action.Delete)
  @Delete(':id')
  @AuditEntity('TaxRate')
  async deleteTaxRate(@Request() req: any, @Param('id') id: string) {
    return this.taxRatesService.remove(req.user.orgId, id);
  }
}
