import { Controller, Post, Get, Body, UseGuards, Request, Param, UseInterceptors } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PaymentCollection } from '@bharatsales/shared-types';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('api/v1/finance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Orders')
@UseInterceptors(AuditInterceptor)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

@RequirePermissions(Resource.Orders, Action.Read)
  @Get('invoices')
  getInvoices(@Request() req: any) {
    return this.financeService.getInvoices(req.user.orgId);
  }

@RequirePermissions(Resource.Orders, Action.Create)
  @Post('invoices')
  generateInvoice(@Request() req: any, @Body() data: { orderId: string }) {
    return this.financeService.generateInvoiceFromOrder(req.user.orgId, data.orderId);
  }

@RequirePermissions(Resource.Orders, Action.Read)
  @Get('collections')
  getCollections(@Request() req: any) {
    return this.financeService.getCollections(req.user.orgId);
  }

@RequirePermissions(Resource.Orders, Action.Create)
  @Post('collections')
  recordCollection(@Request() req: any, @Body() data: Partial<PaymentCollection>) {
    return this.financeService.recordCollection(req.user.orgId, req.user.sub, data);
  }

@RequirePermissions(Resource.Orders, Action.Create)
  @Post('collections/:id/reverse')
  reverseCollection(@Request() req: any, @Param('id') collectionId: string) {
    return this.financeService.reverseCollection(req.user.orgId, collectionId, req.user.sub);
  }

  @RequirePermissions(Resource.Orders, Action.Read)
  @Get('ledger/:outletId')
  getLedger(@Request() req: any, @Param('outletId') outletId: string) {
    return this.financeService.getLedger(req.user.orgId, outletId);
  }
}
