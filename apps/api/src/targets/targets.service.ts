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
    const db = this.orderModel.db;
    
    // Dynamic Gamification Engine Calculation (BR-012)
    const calculatedTargets = await Promise.all(
      targets.map(async (target) => {
        let actualValue = 0;
        const metric = target.targetMetric || 'SalesValue';
        
        const dateQuery = {
          $gte: target.startDate,
          $lte: target.endDate
        };

        if (metric === 'SalesValue') {
          const query: any = {
            organizationId,
            status: { $in: ['Submitted', 'Approved', 'Dispatched', 'Delivered'] },
            createdAt: dateQuery
          };
          if (target.entityType === 'User') query.createdByUserId = target.entityId;
          else if (target.entityType === 'Outlet') query.outletId = target.entityId;

          const eligibleOrders = await this.orderModel.find(query);
          actualValue = eligibleOrders.reduce((sum, order) => sum + (order.totals?.grandTotal || 0), 0);
        } else if (metric === 'VisitCount') {
          const query: any = { organizationId, createdAt: dateQuery };
          if (target.entityType === 'User') query.user = target.entityId;
          else if (target.entityType === 'Outlet') query.outlet = target.entityId;
          
          actualValue = await db.model('Visit').countDocuments(query);
        } else if (metric === 'ProductiveCalls') {
          const query: any = { organizationId, createdAt: dateQuery, isProductive: true };
          if (target.entityType === 'User') query.user = target.entityId;
          else if (target.entityType === 'Outlet') query.outlet = target.entityId;
          
          actualValue = await db.model('Visit').countDocuments(query);
        } else if (metric === 'CollectionValue') {
          const query: any = { organizationId, createdAt: dateQuery, status: 'Success' };
          if (target.entityType === 'User') query.collectedBy = target.entityId;
          else if (target.entityType === 'Outlet') query.outlet = target.entityId;
          
          const collections = await db.model('Collection').find(query);
          actualValue = collections.reduce((sum: number, col: any) => sum + (col.amount || 0), 0);
        }

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
          status = 'At Risk';
        }

        // Target Logic & Achievement
        const achievementPercentage = target.targetValue > 0 ? (actualValue / target.targetValue) * 100 : 0;

        // Incentive Logic
        let incentiveMultiplier = 0;
        if (achievementPercentage >= 120) {
          incentiveMultiplier = 2.0;
        } else if (achievementPercentage >= 100) {
          incentiveMultiplier = 1.5;
        } else if (achievementPercentage >= 80) {
          incentiveMultiplier = 1.0;
        }

        return {
          ...target,
          id: target._id.toString(),
          actualValue,
          status,
          meta: {
            remainingDays,
            dailyRunRate,
            remainingTarget,
            achievementPercentage: parseFloat(achievementPercentage.toFixed(2)),
            incentiveMultiplier
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
    return { ...saved.toObject(), id: saved._id.toString() };
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
    return { ...target.toObject(), id: target._id.toString() };
  }

  async deleteTarget(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const target = await this.targetModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!target) throw new NotFoundException('Target not found');
    return { deleted: true };
  }
}
