import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Order } from '@bharatsales/shared-types';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getOrders(@Request() req: any) {
    // req.user is populated by the JwtAuthGuard
    return this.ordersService.findAll(req.user.orgId);
  }

  @Get(':id')
  async getOrderById(@Request() req: any, @Param('id') orderId: string) {
    return this.ordersService.findById(req.user.orgId, orderId);
  }

  @Post()
  async createOrder(@Request() req: any, @Body() orderData: Partial<Order>) {
    return this.ordersService.create(req.user.orgId, req.user.sub, orderData);
  }

  @Put(':id/status')
  @Roles('Super Admin', 'Company Admin', 'Area Manager')
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

  @Post(':id/approve')
  @Roles('Super Admin', 'Company Admin', 'Area Manager')
  async approveOrder(@Request() req: any, @Param('id') orderId: string) {
    return this.ordersService.approveOrder(req.user.orgId, orderId, req.user.sub);
  }

  @Post(':id/dispatch')
  @Roles('Super Admin', 'Company Admin', 'Area Manager')
  async dispatchOrder(@Request() req: any, @Param('id') orderId: string) {
    return this.ordersService.dispatchOrder(req.user.orgId, orderId, req.user.sub);
  }

  @Post(':id/reject')
  @Roles('Super Admin', 'Company Admin', 'Area Manager')
  async rejectOrder(@Request() req: any, @Param('id') orderId: string, @Body() data: { reason?: string }) {
    return this.ordersService.rejectOrder(req.user.orgId, orderId, req.user.sub, data.reason);
  }

  @Post(':id/cancel')
  async cancelOrder(@Request() req: any, @Param('id') orderId: string, @Body() data: { reason?: string }) {
    // Usually the person who placed the order or manager can cancel
    return this.ordersService.cancelOrder(req.user.orgId, orderId, req.user.sub, data.reason);
  }
}
