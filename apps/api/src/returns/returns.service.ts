import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReturnOrder } from '../schemas/return.schema';
import { ReturnOrder as SharedReturnOrder, Outlet, Invoice } from '@bharatsales/shared-types';
import { InventoryService } from '../inventory/inventory.service';
import { FinanceService } from '../finance/finance.service';

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(
    @InjectModel(ReturnOrder.name) private returnModel: Model<ReturnOrder>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
    @InjectModel('Invoice') private invoiceModel: Model<Invoice>,
    @InjectModel('Order') private orderModel: Model<any>,
    @InjectModel('Product') private productModel: Model<any>,
    private inventoryService: InventoryService,
    private financeService: FinanceService
  ) {}

  async getReturns(organizationId: string): Promise<ReturnOrder[]> {
    this.logger.log(`Fetching returns for org ${organizationId}`);
    return this.returnModel.find({ organizationId }).exec();
  }

  async create(
    organizationId: string, 
    data: Omit<SharedReturnOrder, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>,
    userId: string
  ): Promise<ReturnOrder> {
    const outlet = await this.outletModel.findById(data.outlet);
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    let calculatedRefundAmount = 0;
    
    if (data.orderId) {
      const order = await this.orderModel.findById(data.orderId);
      if (order && data.items) {
        for (const returnItem of data.items) {
          const originalItem = order.items.find((i: any) => i.productId === returnItem.product || i.productId?.toString() === returnItem.product);
          if (originalItem) {
            calculatedRefundAmount += (originalItem.unitPrice * returnItem.qty);
          } else {
             // Fallback to fetch product
            const product = await this.productModel.findById(returnItem.product);
            if (product) {
              calculatedRefundAmount += (product.pricing.basePrice * returnItem.qty);
            }
          }
        }
      }
    } else if (data.items) {
        for (const returnItem of data.items) {
            const product = await this.productModel.findById(returnItem.product);
            if (product) {
              calculatedRefundAmount += (product.pricing.basePrice * returnItem.qty);
            }
        }
    }

    // Override insecure client-provided value with secure backend calculation
    data.value = calculatedRefundAmount.toString();

    const status = data.status || 'Draft';
    if (!['Draft', 'Submitted'].includes(status)) {
      throw new BadRequestException('Initial status must be Draft or Submitted');
    }

    const newReturn = new this.returnModel({
      ...data,
      organizationId,
      status
    });

    await newReturn.save();
    return newReturn;
  }

  async updateStatus(
    organizationId: string, 
    id: string, 
    status: string, 
    userId: string, 
    reason?: string,
    restockClassification?: 'saleable' | 'damaged' | 'quarantine' | 'expired' | 'return-to-vendor',
    session?: any
  ): Promise<ReturnOrder> {
    const returnOrder = await this.returnModel.findOne({ _id: id, organizationId }).session(session).exec();
    if (!returnOrder) throw new NotFoundException('Return order not found');

    const validTransitions: Record<string, string[]> = {
      'Draft': ['Submitted', 'Cancelled'],
      'Submitted': ['Pending_Approval', 'Rejected', 'Cancelled'],
      'Pending_Approval': ['Approved', 'Rejected'],
      'Approved': ['Received', 'Cancelled'],
      'Received': ['Inspected'],
      'Inspected': ['Closed'],
      'Rejected': [],
      'Closed': [],
      'Cancelled': []
    };

    if (validTransitions[returnOrder.status] && !validTransitions[returnOrder.status].includes(status)) {
      throw new BadRequestException(`Invalid return state transition from ${returnOrder.status} to ${status}`);
    }

    const previousStatus = returnOrder.status;
    returnOrder.status = status as any;
    
    // On financial approval/received
    if (status === 'Approved' || status === 'Received') {
      const refundAmount = Number(returnOrder.value) || 0;
      if (refundAmount > 0 && status === 'Approved') {
        await this.financeService.createCreditNote(organizationId, returnOrder.outlet, refundAmount, returnOrder._id.toString(), session);
      }
    }

    if (status === 'Inspected' || status === 'Closed') {
      if (previousStatus !== 'Inspected' && previousStatus !== 'Closed') {
        if (returnOrder.items && returnOrder.items.length > 0) {
        for (const item of returnOrder.items) {
          let batchName = `RETURN-${id}`;
          if (restockClassification === 'damaged') batchName = `DAMAGED-${id}`;
          if (restockClassification === 'quarantine') batchName = `QUARANTINE-${id}`;
          if (restockClassification === 'expired') batchName = `EXPIRED-${id}`;
          if (restockClassification === 'return-to-vendor') batchName = `RTV-${id}`;
          
          let status = 'Active';
          let blocked = false;
          if (restockClassification && restockClassification !== 'saleable') {
             status = 'Quarantine';
             blocked = true;
          }

          await this.inventoryService.adjustStock(organizationId, {
            productId: item.product,
            batch: batchName,
            type: 'Transfer In', // Or 'Purchase Return' / 'Customer Return'
            quantity: item.qty,
            reason: `Return Order ${id} inspected as ${restockClassification || 'saleable'}`,
            status,
            blocked
          }, session);
        }
      }
    }
    }

    return await returnOrder.save({ session });
  }

  async approveReturn(organizationId: string, id: string, userId: string, session?: any): Promise<ReturnOrder> {
    return this.updateStatus(organizationId, id, 'Approved', userId, 'Approved by admin', undefined, session);
  }

  async rejectReturn(organizationId: string, id: string, userId: string, session?: any): Promise<ReturnOrder> {
    return this.updateStatus(organizationId, id, 'Rejected', userId, 'Rejected by admin', undefined, session);
  }

  async update(organizationId: string, id: string, data: Partial<SharedReturnOrder>): Promise<ReturnOrder> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    const returnOrder = await this.returnModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    if (!returnOrder) throw new NotFoundException('Return order not found');
    return returnOrder;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const returnOrder = await this.returnModel.findOne({ _id: id, organizationId }).exec();
    if (!returnOrder) throw new NotFoundException('Return order not found');
    
    if (['Approved', 'Received', 'Inspected', 'Closed'].includes(returnOrder.status)) {
      throw new BadRequestException('Cannot hard delete an approved or closed return. Please cancel it instead.');
    }
    
    await this.returnModel.findOneAndDelete({ _id: id, organizationId }).exec();
    return { deleted: true };
  }

  async createReturnFromShortDelivery(
    organizationId: string,
    orderId: string,
    outletId: string,
    shortItems: { productId: string, shortQty: number }[],
    session?: any
  ): Promise<ReturnOrder> {
    if (!shortItems || shortItems.length === 0) return null as any;

    const newReturn = new this.returnModel({
      organizationId,
      orderId,
      outlet: outletId,
      reason: 'Auto-generated from Short/Damaged Delivery',
      value: '0',
      status: 'Submitted', // Immediately submitted
      items: shortItems.map(item => ({ product: item.productId, qty: item.shortQty }))
    });

    return newReturn.save({ session });
  }
}
