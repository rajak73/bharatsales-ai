import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalesTarget as Target, Order } from '@bharatsales/shared-types';

@Injectable()
export class TargetsService {
  constructor(
    @InjectModel('Target') private targetModel: Model<Target>,
    @InjectModel('Order') private orderModel: Model<Order>,
  ) {}

  async getTargets(organizationId: string) {
    const targets = await this.targetModel.find({ organizationId }).lean();
    
    // Dynamic Gamification Engine Calculation (BR-012)
    const calculatedTargets = await Promise.all(
      targets.map(async (target) => {
        // Find eligible orders in the date range
        // Status: 'Submitted', 'Approved', 'Dispatched', 'Delivered'
        // Using string match for ISO dates
        const query: any = {
          organizationId,
          status: { $in: ['Submitted', 'Approved', 'Dispatched', 'Delivered'] },
          createdAt: {
            $gte: target.startDate,
            $lte: target.endDate
          }
        };

        if (target.entityType === 'User') {
          query.createdByUserId = target.entityId;
        } else if (target.entityType === 'Outlet') {
          query.outletId = target.entityId;
        } else if (target.entityType === 'Territory') {
          // If we had a territory field we'd map it. Skip for this demo unless specified.
        }

        const eligibleOrders = await this.orderModel.find(query);
        const actualValue = eligibleOrders.reduce((sum, order) => sum + (order.totals?.grandTotal || 0), 0);

        // Run rate calculation
        const endDate = new Date(target.endDate);
        const now = new Date();
        const endOrNow = now > endDate ? endDate : now;
        const remainingMs = endDate.getTime() - endOrNow.getTime();
        const remainingDays = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
        
        const remainingTarget = Math.max(0, target.targetValue - actualValue);
        const dailyRunRate = parseFloat((remainingTarget / remainingDays).toFixed(2));

        let status = 'On Track';
        if (actualValue >= target.targetValue) {
          status = 'Achieved';
        } else if (now > endDate && actualValue < target.targetValue) {
          status = 'Missed';
        } else if (dailyRunRate > (target.targetValue / 10)) { 
          // At Risk if they need more than 10% of total target per day
          status = 'At Risk';
        }

        return {
          ...target,
          id: target._id.toString(),
          actualValue,
          status,
          // Sending dynamic data out 
          meta: {
            remainingDays,
            dailyRunRate,
            remainingTarget
          }
        };
      })
    );

    return calculatedTargets;
  }

  async createTarget(organizationId: string, data: Partial<Target>) {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const target = new this.targetModel({ ...data, organizationId });
    const saved = await target.save();
    return {
      ...saved.toObject(),
      id: saved._id.toString()
    };
  }

  async updateTarget(organizationId: string, id: string, data: Partial<Target>) {
    delete (data as any).organizationId;
    delete (data as any)._id;
    const target = await this.targetModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    if (!target) throw new NotFoundException('Target not found');
    return {
      ...target.toObject(),
      id: target._id.toString()
    };
  }

  async deleteTarget(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const target = await this.targetModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!target) throw new NotFoundException('Target not found');
    return { deleted: true };
  }
}
