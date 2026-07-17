import { Controller, Get, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { TaxRatesService } from './tax-rates.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('api/v1/tax-rates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class TaxRatesController {
  constructor(private readonly taxRatesService: TaxRatesService) {}

  @Get()
  async getTaxRates(@Request() req: any) {
    const orgId = req.user.orgId || req.user.organizationId;
    return this.taxRatesService.findAllByOrgId(orgId);
  }
}
