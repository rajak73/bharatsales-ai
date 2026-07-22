import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReturnOrder } from '../schemas/return.schema';
import { ReturnOrder as SharedReturnOrder, Outlet, Invoice } from '@bharatsales/shared-types';

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(
    @InjectModel(ReturnOrder.name) private returnModel: Model<ReturnOrder>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
    @InjectModel('Invoice') private invoiceModel: Model<Invoice>
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
      status: 'Approved' // For now, auto-approve
    });

    await newReturn.save();

    // BR-023: Adjust outlet balance
    if (refundAmount > 0) {
      outlet.commercial.outstandingBalance = Math.max(0, outlet.commercial.outstandingBalance - refundAmount);
      await outlet.save();
    }

    return newReturn;
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
