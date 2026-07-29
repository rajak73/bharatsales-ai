import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalesTarget, Order, Visit } from '@bharatsales/shared-types';
import { HierarchyService } from '../hierarchy/hierarchy.service';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel('Target') private targetModel: Model<SalesTarget>,
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Visit') private visitModel: Model<Visit>,
    private hierarchyService: HierarchyService
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

    // BRD Phase 9: Reports must respect hierarchy
    const userRole = await this.hierarchyService.getUserRole(userId);
    let territoryFilter: any = {};
    
    if (!['Super Admin', 'Organization Admin'].includes(userRole?.name || '')) {
      const userTerritories = await this.hierarchyService.getUserTerritories(userId);
      const descendantIds = await this.hierarchyService.getDescendantTerritoryIds(organizationId, userTerritories);
      if (descendantIds.length > 0) {
        territoryFilter = { createdByUserId: userId }; // Simplified DSR filter for the user's own performance for now
      }
    }

    const [orders, visits] = await Promise.all([
      this.orderModel.find({ ...dateFilter, ...territoryFilter }).exec(),
      this.visitModel.find({ ...dateFilter, ...(territoryFilter.createdByUserId ? { user: territoryFilter.createdByUserId } : {}) }).exec()
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totals?.grandTotal || 0), 0);
    const productiveVisits = visits.filter(v => v.status === 'Completed').length;

    return {
      date,
      metrics: {
        totalVisits: visits.length,
        productiveVisits,
        totalRevenue,
        ordersCount: orders.length
      }
    };
  }
}
