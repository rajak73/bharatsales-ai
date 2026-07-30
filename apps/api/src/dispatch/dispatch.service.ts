import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Dispatch, Order } from '@bharatsales/shared-types';
import { OrdersService } from '../orders/orders.service';
import { ReturnsService } from '../returns/returns.service';

@Injectable()
export class DispatchService {
  constructor(
    @InjectModel('Dispatch') private dispatchModel: Model<Dispatch>,
    @InjectModel('Order') private orderModel: Model<Order>,
    private ordersService: OrdersService,
    private returnsService: ReturnsService,
    @InjectConnection() private connection: Connection,
  ) {}

  async findAll(organizationId: string, user?: any): Promise<Dispatch[]> {
    const query: any = { organizationId };
    if (user && user.role === 'Distributor') {
      query.assignedDistributorId = user.distributorId || '__none__';
    }
    return this.dispatchModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async createDispatch(
    organizationId: string,
    orderId: string,
    actorId: string,
    data: { vehicle: string; driver: string },
    user?: any
  ): Promise<Dispatch> {
    const order = await this.orderModel.findOne({ _id: orderId, organizationId }).exec();
    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    if (user && user.role === 'Distributor' && order.assignedDistributorId !== user.distributorId) {
      throw new ForbiddenException('This order is not assigned to you');
    }

    // Reuses the existing, already-tested stock deduction + Approved->Dispatched transition.
    await this.ordersService.dispatchOrder(organizationId, orderId, actorId);

    const dispatch = new this.dispatchModel({
      organizationId,
      orderId,
      assignedDistributorId: order.assignedDistributorId,
      dispatchedByUserId: actorId,
      vehicle: data.vehicle,
      driver: data.driver,
      status: 'In Transit',
    });
    return dispatch.save();
  }

  async confirmDelivery(
    organizationId: string,
    dispatchId: string,
    actorId: string,
    deliveredItems: { productId: string; deliveredQty: number; damagedQty?: number; reason?: string; evidence?: string[] }[],
    user?: any
  ): Promise<Dispatch> {
    const dispatch = await this.dispatchModel.findOne({ _id: dispatchId, organizationId }).exec();
    if (!dispatch) {
      throw new NotFoundException('Dispatch not found');
    }
    if (user && user.role === 'Distributor' && dispatch.assignedDistributorId !== user.distributorId) {
      throw new ForbiddenException('This delivery is not assigned to you');
    }
    if (dispatch.status !== 'In Transit' && dispatch.status !== 'Pending') {
      throw new BadRequestException(`Delivery cannot be confirmed from status ${dispatch.status}`);
    }

    const order = await this.orderModel.findOne({ _id: dispatch.orderId, organizationId }).exec();
    if (!order) {
      throw new NotFoundException('Order not found for this dispatch');
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const shortItems: { productId: string; shortQty: number }[] = [];
      let hasShortOrDamaged = false;

      const fullDeliveredItems = (order.items || []).map((item: any) => {
        const submitted = deliveredItems.find(d => d.productId === item.productId);
        const deliveredQty = submitted?.deliveredQty ?? item.quantity;
        const damagedQty = submitted?.damagedQty ?? 0;
        const shortQty = Math.max(0, item.quantity - deliveredQty - damagedQty);

        if (shortQty > 0 || damagedQty > 0) {
          hasShortOrDamaged = true;
          shortItems.push({ productId: item.productId, shortQty: shortQty + damagedQty });
        }

        return {
          productId: item.productId,
          orderedQty: item.quantity,
          dispatchedQty: item.quantity,
          deliveredQty,
          shortQty: shortQty || undefined,
          damagedQty: damagedQty || undefined,
          reason: submitted?.reason,
          evidence: submitted?.evidence,
        };
      });

      dispatch.deliveredItems = fullDeliveredItems;
      dispatch.status = hasShortOrDamaged ? 'Partial_Delivery' : 'Delivered';
      await dispatch.save({ session });

      const newOrderStatus = hasShortOrDamaged ? 'Partial_Delivery' : 'Delivered';
      await this.ordersService.updateStatus(organizationId, dispatch.orderId, newOrderStatus as any, actorId, 'Delivery confirmed', session);

      if (hasShortOrDamaged) {
        await this.returnsService.createReturnFromShortDelivery(organizationId, dispatch.orderId, order.outletId, shortItems, session);
      }

      await session.commitTransaction();
      return dispatch;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
