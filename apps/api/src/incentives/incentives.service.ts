import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IncentivePlan, IncentivePayout } from '@bharatsales/shared-types';

@Injectable()
export class IncentivesService {
  private readonly logger = new Logger(IncentivesService.name);

  constructor(
    @InjectModel('IncentivePlan') private planModel: Model<IncentivePlan>,
    @InjectModel('IncentivePayout') private payoutModel: Model<IncentivePayout>,
  ) {}

  async getIncentivePlans(organizationId: string): Promise<IncentivePlan[]> {
    return this.planModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async getIncentivePayouts(organizationId: string): Promise<IncentivePayout[]> {
    return this.payoutModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async createIncentivePlan(organizationId: string, data: Partial<IncentivePlan>): Promise<IncentivePlan> {
    const newPlan = new this.planModel({
      ...data,
      organizationId,
      status: data.status || 'Active',
    });
    return newPlan.save();
  }

  async createIncentivePayout(organizationId: string, data: Partial<IncentivePayout>): Promise<IncentivePayout> {
    const newPayout = new this.payoutModel({
      ...data,
      organizationId,
      status: data.status || 'Pending',
    });
    return newPayout.save();
  }
}
