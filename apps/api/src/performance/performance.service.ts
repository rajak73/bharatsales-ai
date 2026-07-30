import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalesTarget, Order, PaymentCollection, Visit } from '@bharatsales/shared-types';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { TargetsService } from '../targets/targets.service';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel('Target') private targetModel: Model<SalesTarget>,
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Collection') private collectionModel: Model<PaymentCollection>,
    @InjectModel('Visit') private visitModel: Model<Visit>,
    @InjectModel('User') private userModel: Model<any>,
    private hierarchyService: HierarchyService,
    private targetsService: TargetsService
  ) {}

  async getUserTargets(organizationId: string, userId: string): Promise<SalesTarget[]> {
    return this.targetModel.find({ organizationId, entityType: 'User', entityId: userId }).exec();
  }

  async generateDSR(organizationId: string, userId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dateFilter = {
      organizationId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    };
    const selfFilter = { createdByUserId: userId };

    const [orders, collections, visits] = await Promise.all([
      this.orderModel.find({ ...dateFilter, ...selfFilter }).exec(),
      this.collectionModel.find({ organizationId, collectionDate: { $regex: `^${date}` }, collectedByUserId: userId }).exec(),
      this.visitModel.find({ ...dateFilter, user: userId }).exec()
    ]);

    const totalOrderValue = orders.reduce((sum, order) => sum + (order.totals?.grandTotal || 0), 0);
    const totalCollections = collections.reduce((sum, col) => sum + (col.amount || 0), 0);
    const productiveVisits = visits.filter(v => v.status === 'Completed').length;

    return {
      date,
      metrics: {
        totalVisits: visits.length,
        productiveVisits,
        totalOrderValue,
        totalCollections,
        ordersCount: orders.length
      }
    };
  }

  // Resolves "the team" for team-rollup endpoints. A Sales Manager's team is
  // derived from their own territories (HierarchyService.getTeamUserIds). An
  // Organization Admin has no territoryIds (they oversee the whole org, not
  // one territory), so that same call would incorrectly return an empty team
  // — for them, "the team" is every Sales Representative in the org.
  private async resolveTeamUserIds(organizationId: string, userId: string, role?: string): Promise<string[]> {
    if (role === 'Organization Admin') {
      const reps = await this.userModel.find({ organizationId, role: 'Sales Representative' }).select('_id').exec();
      return reps.map((u: any) => u._id.toString());
    }
    return this.hierarchyService.getTeamUserIds(organizationId, userId);
  }

  // Team rollup for a Sales Manager (or org-wide for an Organization Admin):
  // same shape as generateDSR() plus a per-rep breakdown (BRD Phase 9).
  async generateTeamDSR(organizationId: string, managerId: string, date: string, role?: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const teamUserIds = await this.resolveTeamUserIds(organizationId, managerId, role);
    if (teamUserIds.length === 0) {
      return { date, metrics: { totalVisits: 0, productiveVisits: 0, totalOrderValue: 0, totalCollections: 0, ordersCount: 0 }, repBreakdown: [] };
    }

    const dateFilter = { organizationId, createdAt: { $gte: startOfDay, $lte: endOfDay } };

    const [orders, collections, visits, reps] = await Promise.all([
      this.orderModel.find({ ...dateFilter, createdByUserId: { $in: teamUserIds } }).exec(),
      this.collectionModel.find({ organizationId, collectionDate: { $regex: `^${date}` }, collectedByUserId: { $in: teamUserIds } }).exec(),
      this.visitModel.find({ ...dateFilter, user: { $in: teamUserIds } }).exec(),
      this.userModel.find({ _id: { $in: teamUserIds } }).select('name').exec()
    ]);

    const repName = (id: string) => reps.find((r: any) => r._id.toString() === id)?.name || id;

    const repBreakdown = teamUserIds.map(repId => {
      const repOrders = orders.filter(o => o.createdByUserId === repId);
      const repCollections = collections.filter(c => c.collectedByUserId === repId);
      const repVisits = visits.filter((v: any) => (v.user?.toString?.() || v.user) === repId);
      return {
        userId: repId,
        name: repName(repId),
        totalVisits: repVisits.length,
        productiveVisits: repVisits.filter((v: any) => v.status === 'Completed').length,
        totalOrderValue: repOrders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0),
        ordersCount: repOrders.length,
        totalCollections: repCollections.reduce((sum, c) => sum + (c.amount || 0), 0),
      };
    });

    const totalOrderValue = orders.reduce((sum, order) => sum + (order.totals?.grandTotal || 0), 0);
    const totalCollections = collections.reduce((sum, col) => sum + (col.amount || 0), 0);
    const productiveVisits = visits.filter((v: any) => v.status === 'Completed').length;

    return {
      date,
      metrics: {
        totalVisits: visits.length,
        productiveVisits,
        totalOrderValue,
        totalCollections,
        ordersCount: orders.length
      },
      repBreakdown
    };
  }

  async getTeamTargets(organizationId: string, managerId: string, role?: string) {
    const teamUserIds = await this.resolveTeamUserIds(organizationId, managerId, role);
    return this.targetsService.getTargetsForEntities(organizationId, teamUserIds);
  }
}
