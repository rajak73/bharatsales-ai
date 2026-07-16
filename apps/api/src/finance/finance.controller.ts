import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PaymentCollection } from '@bharatsales/shared-types';

@Controller('api/v1/finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('invoices')
  getInvoices(@Request() req: any) {
    return this.financeService.getInvoices(req.user.organizationId);
  }

  @Post('invoices')
  generateInvoice(@Request() req: any, @Body() data: { orderId: string }) {
    return this.financeService.generateInvoiceFromOrder(req.user.organizationId, data.orderId);
  }

  @Get('collections')
  getCollections(@Request() req: any) {
    return this.financeService.getCollections(req.user.organizationId);
  }

  @Post('collections')
  recordCollection(@Request() req: any, @Body() data: Partial<PaymentCollection>) {
    return this.financeService.recordCollection(req.user.organizationId, req.user.userId, data);
  }

  @Post('collections/:id/reverse')
  reverseCollection(@Request() req: any, @Param('id') collectionId: string) {
    return this.financeService.reverseCollection(req.user.organizationId, collectionId, req.user.userId);
  }
}
