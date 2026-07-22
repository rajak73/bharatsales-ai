import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Order } from '@bharatsales/shared-types';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { AuditEntity } from '../audit/audit.decorator';
import { Resource, Action } from '@bharatsales/permissions';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@AuditEntity('Orders')
@UseInterceptors(AuditInterceptor)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

@RequirePermissions(Resource.Orders, Action.Read)
  @Get()
  async getOrders(@Request() req: any) {
    // req.user is populated by the JwtAuthGuard
    return this.ordersService.findAll(req.user.orgId);
  }

@RequirePermissions(Resource.Orders, Action.Read)
  @Get(':id')
  async getOrderById(@Request() req: any, @Param('id') orderId: string) {
    return this.ordersService.findById(req.user.orgId, orderId);
  }

@RequirePermissions(Resource.Orders, Action.Create)
  @Post()
  async createOrder(@Request() req: any, @Body() orderData: Partial<Order>) {
    return this.ordersService.create(req.user.orgId, req.user.sub, orderData);
  }

@RequirePermissions(Resource.Orders, Action.Update)
  @Put(':id/status')
    async updateOrderStatus(
    @Request() req: any, 
    @Param('id') orderId: string, 
    @Body() data: { status: Order['status'], reason?: string }
  ) {
    return this.ordersService.updateStatus(
      req.user.orgId, 
      orderId, 
      data.status, 
      req.user.sub, 
      data.reason
    );
  }

@RequirePermissions(Resource.Orders, Action.Create)
  @Post(':id/approve')
    async approveOrder(@Request() req: any, @Param('id') orderId: string) {
    return this.ordersService.approveOrder(req.user.orgId, orderId, req.user.sub);
  }

@RequirePermissions(Resource.Orders, Action.Create)
  @Post(':id/dispatch')
    async dispatchOrder(@Request() req: any, @Param('id') orderId: string) {
    return this.ordersService.dispatchOrder(req.user.orgId, orderId, req.user.sub);
  }

@RequirePermissions(Resource.Orders, Action.Create)
  @Post(':id/reject')
    async rejectOrder(@Request() req: any, @Param('id') orderId: string, @Body() data: { reason?: string }) {
    return this.ordersService.rejectOrder(req.user.orgId, orderId, req.user.sub, data.reason);
  }

@RequirePermissions(Resource.Orders, Action.Create)
  @Post(':id/cancel')
  async cancelOrder(@Request() req: any, @Param('id') orderId: string, @Body() data: { reason?: string }) {
    // Usually the person who placed the order or manager can cancel
    return this.ordersService.cancelOrder(req.user.orgId, orderId, req.user.sub, data.reason);
  }
}
