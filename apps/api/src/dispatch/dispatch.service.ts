import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dispatch } from '../schemas/dispatch.schema';
import { Dispatch as SharedDispatch } from '@bharatsales/shared-types';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(@InjectModel(Dispatch.name) private dispatchModel: Model<Dispatch>) {}

  async getDispatches(organizationId: string): Promise<Dispatch[]> {
    this.logger.log(`Fetching dispatches for org ${organizationId}`);
    return this.dispatchModel.find({ organizationId }).exec();
  }

  async create(organizationId: string, data: Omit<SharedDispatch, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<Dispatch> {
    const newDispatch = new this.dispatchModel({
      ...data,
      organizationId,
    });
    return newDispatch.save();
  }

  async createDispatchFromOrder(organizationId: string, orderId: string, vehicle: string = 'Pending Assignment', driver: string = 'Pending Assignment'): Promise<Dispatch> {
    this.logger.log(`Creating dispatch for order ${orderId} in org ${organizationId}`);
    const newDispatch = new this.dispatchModel({
      organizationId,
      orderId,
      vehicle,
      driver,
      status: 'Pending', // Begins as Pending until physically out for delivery
    });
    return newDispatch.save();
  }

  async markDelivered(organizationId: string, dispatchId: string): Promise<Dispatch> {
    const dispatch = await this.dispatchModel.findOne({ _id: dispatchId, organizationId });
    if (!dispatch) throw new Error('Dispatch not found');
    
    dispatch.status = 'Delivered';
    return dispatch.save();
  }
}
