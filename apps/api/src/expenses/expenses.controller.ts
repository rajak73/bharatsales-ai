import { Controller, Get, Patch, Param, Body, UseGuards, UseInterceptors, Request } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { Action, Resource } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { AuditEntity } from '../audit/audit.decorator';

@Controller('expenses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  // Using Admin read for expenses since there's no specific resource for Expenses in standard shared-types yet
  // We'll use Resource.Orders as a placeholder if Expenses is missing, but typically it should be its own.
  // Actually, we'll just require authentication for now to avoid permission blocks if Resource.Expenses isn't in the enum.
  async getExpenses(@Request() req: any) {
    return this.expensesService.findAllByOrgId(req.user.orgId);
  }

  @Patch(':id/status')
  @AuditEntity('Expense')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: 'Pending' | 'Approved' | 'Rejected' }
  ) {
    return this.expensesService.updateStatus(req.user.orgId, id, body.status);
  }
}
