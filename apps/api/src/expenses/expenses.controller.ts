import { Controller, Get, Post, Put, Delete, Patch, Param, Body, UseGuards, UseInterceptors, Request } from '@nestjs/common';
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

@RequirePermissions(Resource.Expenses, Action.Read)
  @Get()
  // Using Admin read for expenses since there's no specific resource for Expenses in standard shared-types yet
  // We'll use Resource.Orders as a placeholder if Expenses is missing, but typically it should be its own.
  // Actually, we'll just require authentication for now to avoid permission blocks if Resource.Expenses isn't in the enum.
  async getExpenses(@Request() req: any) {
    return this.expensesService.findAllByOrgId(req.user.orgId);
  }

@RequirePermissions(Resource.Expenses, Action.Update)
  @Patch(':id/status')
  @AuditEntity('Expense')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: 'Pending' | 'Approved' | 'Rejected' }
  ) {
    return this.expensesService.updateStatus(req.user.orgId, id, body.status);
  }

@RequirePermissions(Resource.Expenses, Action.Create)
  @Post()
  @AuditEntity('Expense')
  async createExpense(@Request() req: any, @Body() data: any) {
    return this.expensesService.create(req.user.orgId, data);
  }

@RequirePermissions(Resource.Expenses, Action.Update)
  @Put(':id')
  @AuditEntity('Expense')
  async updateExpense(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.expensesService.update(req.user.orgId, id, data);
  }

@RequirePermissions(Resource.Expenses, Action.Delete)
  @Delete(':id')
  @AuditEntity('Expense')
  async deleteExpense(@Request() req: any, @Param('id') id: string) {
    return this.expensesService.remove(req.user.orgId, id);
  }
}
