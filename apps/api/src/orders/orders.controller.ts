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
    return this.ordersService.findAll(req.user.organizationId);
  }

  @Post()
  async createOrder(@Request() req: any, @Body() orderData: Partial<Order>) {
    return this.ordersService.create(req.user.organizationId, orderData);
  }

  @Put(':id/status')
  @Roles('Super Admin', 'Company Admin', 'Area Manager')
  async updateOrderStatus(
    @Request() req: any, 
    @Param('id') orderId: string, 
    @Body() data: { status: Order['status'], reason?: string }
  ) {
    return this.ordersService.updateStatus(
      req.user.organizationId, 
      orderId, 
      data.status, 
      req.user.userId, 
      data.reason
    );
  }

  @Post(':id/approve')
  @Roles('Super Admin', 'Company Admin', 'Area Manager')
  async approveOrder(@Request() req: any, @Param('id') orderId: string) {
    return this.ordersService.approveOrder(req.user.organizationId, orderId, req.user.userId);
  }

  @Post(':id/dispatch')
  @Roles('Super Admin', 'Company Admin', 'Area Manager')
  async dispatchOrder(@Request() req: any, @Param('id') orderId: string) {
    return this.ordersService.dispatchOrder(req.user.organizationId, orderId, req.user.userId);
  }
}
