import { NotFoundException, ForbiddenException } from '../core/http-errors';
import { Logger } from '../core/logger';
import { Model, isValidObjectId } from 'mongoose';
import { SalesTarget as Target, Order } from '@bharatsales/shared-types';
import { NotificationsService } from '../notifications/notifications.service';
import { toSafeUpdate } from '../core/query-safety';

export class TargetsService {
  private readonly logger = new Logger(TargetsService.name);

  constructor(
    private targetModel: Model<Target>,
    private orderModel: Model<Order>,
    private notificationsService: NotificationsService,
  ) {}

  async getTargets(organizationId: string) {
    const targets = await this.targetModel.find({ organizationId }).lean();
    return this.calculateForTargets(targets);
  }

  // Same achievement-calc logic as getTargets(), for an explicit set of
  // entities (e.g. a Sales Manager's team) rather than the whole org.
  async getTargetsForEntities(organizationId: string, entityIds: string[]) {
    if (!entityIds || entityIds.length === 0) return [];
    const targets = await this.targetModel.find({
      organizationId,
      entityType: 'User',
      entityId: { $in: entityIds }
    }).lean();
    return this.calculateForTargets(targets);
  }

  // Best-effort display names for target entities (rep / outlet / territory),
  // so clients never have to fall back to showing a raw ObjectId.
  private async resolveEntityNames(targets: any[]): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    const modelFor: Record<string, string> = { User: 'User', Outlet: 'Outlet', Territory: 'HierarchyNode' };
    for (const [entityType, modelName] of Object.entries(modelFor)) {
      const ofType = targets.filter((t) => t.entityType === entityType);
      const ids = [...new Set(ofType.map((t) => String(t.entityId)).filter((id) => isValidObjectId(id)))];
      if (ids.length === 0) continue;
      try {
        const model: any = (this.orderModel as any).db?.model(modelName);
        if (!model?.find) continue;
        const docs = await model.find({ organizationId: ofType[0].organizationId, _id: { $in: ids } }).select('name').lean().exec();
        for (const d of docs || []) if (d?.name) names.set(`${entityType}:${String(d._id)}`, d.name);
      } catch (error) {
        this.logger.warn(`Could not resolve ${entityType} names for targets: ${(error as Error)?.message}`);
      }
    }
    return names;
  }

  private async calculateForTargets(targets: any[]) {
    const entityNames = await this.resolveEntityNames(targets);
    const calculatedTargets = await Promise.all(
      targets.map(async (target) => {
        let actualValue = target.actualValue || 0;
        let status = target.status || 'On Track';

        // Only calculate dynamically if the target is still active
        if (status !== 'Achieved' && status !== 'Missed') {
          actualValue = await this.calculateActualValue(target);
        }

        // Run rate calculation
        const endDate = new Date(target.endDate);
        const now = new Date();
        const endOrNow = now > endDate ? endDate : now;
        const remainingMs = endDate.getTime() - endOrNow.getTime();
        const remainingDays = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
        
        const remainingTarget = Math.max(0, target.targetValue - actualValue);
        const dailyRunRate = parseFloat((remainingTarget / remainingDays).toFixed(2));

        if (status !== 'Achieved' && status !== 'Missed') {
          if (actualValue >= target.targetValue) {
            status = 'Achieved';
          } else if (now > endDate && actualValue < target.targetValue) {
            status = 'Missed';
          } else if (dailyRunRate > (target.targetValue / 10)) { 
            status = 'At Risk';
          } else {
            status = 'On Track';
          }
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
          entityName: entityNames.get(`${target.entityType}:${String(target.entityId)}`),
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

  private async calculateActualValue(target: any): Promise<number> {
    const db = this.orderModel.db;
    const metric = target.targetMetric || 'SalesValue';
    
    const dateQuery = {
      $gte: target.startDate,
      $lte: target.endDate
    };

    if (metric === 'SalesValue') {
      const query: any = {
        organizationId: target.organizationId,
        status: { $in: ['Submitted', 'Approved', 'Dispatched', 'Delivered'] },
        createdAt: dateQuery
      };
      if (target.entityType === 'User') query.createdByUserId = target.entityId;
      else if (target.entityType === 'Outlet') query.outletId = target.entityId;

      const eligibleOrders = await this.orderModel.find(query);
      return eligibleOrders.reduce((sum, order) => sum + (order.totals?.grandTotal || 0), 0);
    } 
    
    if (metric === 'VisitCount') {
      const query: any = { organizationId: target.organizationId, createdAt: dateQuery };
      if (target.entityType === 'User') query.user = target.entityId;
      else if (target.entityType === 'Outlet') query.outlet = target.entityId;
      
      return await db.model('Visit').countDocuments(query);
    } 
    
    if (metric === 'ProductiveCalls') {
      const query: any = { organizationId: target.organizationId, createdAt: dateQuery, isProductive: true };
      if (target.entityType === 'User') query.user = target.entityId;
      else if (target.entityType === 'Outlet') query.outlet = target.entityId;
      
      return await db.model('Visit').countDocuments(query);
    } 
    
    if (metric === 'CollectionValue') {
      // Only money actually received counts: Cleared collections, keyed by the
      // Collection schema's collectedByUserId / outletId. Reversal entries are
      // Cleared negative amounts, so a reversed payment nets to zero.
      const query: any = { organizationId: target.organizationId, createdAt: dateQuery, status: 'Cleared' };
      if (target.entityType === 'User') query.collectedByUserId = target.entityId;
      else if (target.entityType === 'Outlet') query.outletId = target.entityId;
      
      const collections = await db.model('Collection').find(query);
      return collections.reduce((sum: number, col: any) => sum + (col.amount || 0), 0);
    }

    return 0;
  }

  // Scheduled daily at midnight (was @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT), '0 0 * * *').
  async rollupExpiredTargets() {
    this.logger.log('Running Midnight Target Rollup Cron Job...');
    const now = new Date();
    
    // Find all active targets where endDate has passed
    const expiredTargets = await this.targetModel.find({
      endDate: { $lt: now.toISOString() },
      status: { $nin: ['Achieved', 'Missed'] }
    });

    if (expiredTargets.length === 0) {
      this.logger.log('No expired targets to rollup.');
      return;
    }

    for (const target of expiredTargets) {
      try {
        const actualValue = await this.calculateActualValue(target);
        const status = actualValue >= target.targetValue ? 'Achieved' : 'Missed';

        await this.targetModel.updateOne(
          { _id: target._id },
          { $set: { actualValue, status } }
        );
        this.logger.log(`Rolled up target ${target._id} - Status: ${status}, Actual: ${actualValue}`);

        if (status === 'Achieved' && (target as any).entityType === 'User' && (target as any).entityId) {
          this.notificationsService.create((target as any).organizationId, (target as any).entityId, {
            type: 'target_achieved',
            title: 'Target Achieved',
            message: `You achieved your ${(target as any).targetMetric || ''} target.`
          }).catch(err => this.logger.error('Failed to create target-achieved notification', err));
        }
      } catch (error) {
        this.logger.error(`Failed to rollup target ${target._id}`, error);
      }
    }
    
    this.logger.log(`Target Rollup Complete. Processed ${expiredTargets.length} targets.`);
  }

  async createTarget(organizationId: string, actorRole: string, data: Partial<Target>) {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;

    // Annual targets are Organization Admin's call (BRD "Target vs
    // Achievement": Org Admin sets the yearly target, Sales Manager works
    // at the monthly/tactical level and assigns those down to reps).
    if (data.period === 'Annual' && actorRole !== 'Organization Admin') {
      throw new ForbiddenException('Only Organization Admins can create Annual targets.');
    }

    const target = new this.targetModel({ ...data, organizationId });
    const saved = await target.save();

    if ((data as any).entityType === 'User' && (data as any).entityId) {
      this.notificationsService.create(organizationId, (data as any).entityId, {
        type: 'target_assigned',
        title: 'New Target Assigned',
        message: `A new ${(data as any).metric || ''} target has been assigned to you.`
      }).catch(err => this.logger.error('Failed to create target-assigned notification', err));
    }

    return { ...saved.toObject(), id: saved._id.toString() };
  }

  async updateTarget(organizationId: string, id: string, data: Partial<Target>, actorRole?: string) {
    delete (data as any).organizationId;
    delete (data as any)._id;
    // Same rule as createTarget: otherwise a non-admin could create a
    // Monthly target and then PUT it to Annual.
    if (data.period === 'Annual' && actorRole !== undefined && actorRole !== 'Organization Admin') {
      throw new ForbiddenException('Only Organization Admins can create Annual targets.');
    }
    const target = await this.targetModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: toSafeUpdate(data) },
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
