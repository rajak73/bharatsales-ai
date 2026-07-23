import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Dispatch } from '../schemas/dispatch.schema';
import { Dispatch as SharedDispatch } from '@bharatsales/shared-types';
import { OrdersService } from '../orders/orders.service';
import { FinanceService } from '../finance/finance.service';
import { WhatsappAdapter } from '../integrations/adapters/whatsapp.adapter';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    @InjectModel(Dispatch.name) private dispatchModel: Model<Dispatch>,
    @InjectConnection() private connection: Connection,
    @Inject(forwardRef(() => OrdersService)) private ordersService: OrdersService,
    private financeService: FinanceService,
    private whatsappAdapter: WhatsappAdapter,
  ) {}

  async getDispatches(organizationId: string): Promise<Dispatch[]> {
    this.logger.log(`Fetching dispatches for org ${organizationId}`);
    return this.dispatchModel.find({ organizationId }).exec();
  }

  async create(organizationId: string, data: Omit<SharedDispatch, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<Dispatch> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const newDispatch = new this.dispatchModel({
      ...data,
      organizationId,
    });
    return newDispatch.save();
  }

  async createDispatchFromOrder(organizationId: string, orderId: string, vehicle: string = 'Pending Assignment', driver: string = 'Pending Assignment', session?: any): Promise<Dispatch> {
    this.logger.log(`Creating dispatch for order ${orderId} in org ${organizationId}`);
    const newDispatch = new this.dispatchModel({
      organizationId,
      orderId,
      vehicle,
      driver,
      status: 'Pending', // Begins as Pending until physically out for delivery
    });
    const savedDispatch = await newDispatch.save({ session });
    
    // Simulate WhatsApp Notification (Fire and forget)
    this.whatsappAdapter.sendDispatchNotification('+919999999999', orderId, vehicle, driver).catch(err => {
      this.logger.error('Failed to send WhatsApp notification', err);
    });

    return savedDispatch;
  }

  async markDelivered(
    organizationId: string, 
    dispatchId: string, 
    actorId: string = 'system', 
    deliveredItems?: any[]
  ): Promise<Dispatch> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const dispatch = await this.dispatchModel.findOne({ _id: dispatchId, organizationId }).session(session);
      if (!dispatch) throw new NotFoundException('Dispatch not found');
      
      if (['Delivered', 'Partial_Delivery', 'Damaged_Delivery', 'Refused', 'Return_Initiated'].includes(dispatch.status)) {
        return dispatch; // Idempotent
      }

      const order = await this.ordersService.findById(organizationId, dispatch.orderId);
      
      let finalStatus = 'Delivered';
      let hasDamaged = false;
      let hasShort = false;
      let hasDelivered = false;

      if (deliveredItems && deliveredItems.length > 0) {
        for (const item of order.items) {
          const delivered = deliveredItems.find(d => d.productId === item.productId);
          if (delivered) {
            if (delivered.deliveredQty > 0) hasDelivered = true;
            if (delivered.deliveredQty < item.quantity && !delivered.damagedQty && !delivered.shortQty) {
               delivered.shortQty = item.quantity - delivered.deliveredQty;
            }
            if (delivered.damagedQty > 0) hasDamaged = true;
            if (delivered.shortQty > 0) hasShort = true;
            
            // TODO: In a complete implementation, interact with InventoryService here to move damaged items
            // to a quarantine status and decrement in-transit stock.
          } else {
             hasShort = true; // Completely missing
          }
        }
      }

      if (hasDamaged && !hasDelivered) finalStatus = 'Refused';
      else if (hasDamaged) finalStatus = 'Damaged_Delivery';
      else if (hasShort) finalStatus = 'Partial_Delivery';

      dispatch.status = finalStatus;
      if (deliveredItems) {
        dispatch.deliveredItems = deliveredItems;
      }
      const savedDispatch = await dispatch.save({ session });

      await this.ordersService.updateStatus(organizationId, dispatch.orderId, finalStatus, actorId, 'POD Captured', session);
      await this.financeService.generateInvoiceFromOrder(organizationId, dispatch.orderId, session, deliveredItems);

      await session.commitTransaction();

      this.whatsappAdapter.sendDeliveryNotification('+919999999999', dispatch.orderId, dispatchId).catch(err => {
        this.logger.error('Failed to send WhatsApp POD notification', err);
      });

      return savedDispatch;
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Failed to mark dispatch ${dispatchId} as delivered`, error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async update(organizationId: string, id: string, data: any): Promise<Dispatch> {
    delete data.organizationId;
    delete data._id;
    const dispatch = await this.dispatchModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    return dispatch;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const dispatch = await this.dispatchModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    return { deleted: true };
  }
}
