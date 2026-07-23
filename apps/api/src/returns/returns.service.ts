import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReturnOrder } from '../schemas/return.schema';
import { ReturnOrder as SharedReturnOrder, Outlet, Invoice } from '@bharatsales/shared-types';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(
    @InjectModel(ReturnOrder.name) private returnModel: Model<ReturnOrder>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
    @InjectModel('Invoice') private invoiceModel: Model<Invoice>,
    private inventoryService: InventoryService
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

    if (data.orderId) {
      const order = await this.invoiceModel.findById(data.orderId); // fallback or find order
    }

    // Ensure refundAmount is calculated/present
    const refundAmount = Number(data.value) || 0;

    const newReturn = new this.returnModel({
      ...data,
      organizationId,
      status: 'Pending Approval'
    });

    await newReturn.save();
    return newReturn;
  }

  async approveReturn(organizationId: string, id: string, userId: string, session?: any): Promise<ReturnOrder> {
    const returnOrder = await this.returnModel.findOne({ _id: id, organizationId }).session(session).exec();
    if (!returnOrder) throw new NotFoundException('Return order not found');
    if (returnOrder.status !== 'Pending Approval') throw new BadRequestException(`Cannot approve from status ${returnOrder.status}`);

    returnOrder.status = 'Approved';
    await returnOrder.save({ session });

    const refundAmount = Number(returnOrder.value) || 0;
    if (refundAmount > 0) {
      const outlet = await this.outletModel.findById(returnOrder.outlet).session(session);
      if (outlet) {
        outlet.commercial.outstandingBalance = Math.max(0, (outlet.commercial.outstandingBalance || 0) - refundAmount);
        await outlet.save({ session });
      }
    }

    // Restore items to inventory (BR-023)
    if (returnOrder.items && returnOrder.items.length > 0) {
      for (const item of returnOrder.items) {
        // Assume batch 'RETURNED' for quarantined/returned items
        await this.inventoryService.adjustStock(organizationId, {
          productId: item.product,
          batch: 'RETURNED',
          type: 'Transfer In',
          quantity: item.qty,
          reason: `Return Order ${id}`
        }, session);
      }
    }

    return returnOrder;
  }

  async rejectReturn(organizationId: string, id: string, userId: string, session?: any): Promise<ReturnOrder> {
    const returnOrder = await this.returnModel.findOne({ _id: id, organizationId }).session(session).exec();
    if (!returnOrder) throw new NotFoundException('Return order not found');
    if (returnOrder.status !== 'Pending Approval') throw new BadRequestException(`Cannot reject from status ${returnOrder.status}`);

    returnOrder.status = 'Rejected';
    return await returnOrder.save({ session });
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
    const returnOrder = await this.returnModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!returnOrder) throw new NotFoundException('Return order not found');
    return { deleted: true };
  }
}
