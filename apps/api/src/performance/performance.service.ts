import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalesTarget, Order, PaymentCollection, Visit } from '@bharatsales/shared-types';
import { HierarchyService } from '../hierarchy/hierarchy.service';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel('Target') private targetModel: Model<SalesTarget>,
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Collection') private collectionModel: Model<PaymentCollection>,
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
        // We will fetch outlets to filter by outletId for orders/visits/collections if needed,
        // or rely on createdByUserId depending on the exact schema structure. 
        // For accurate DSR, filtering by createdByUserId matching descendant users is safest.
        territoryFilter = { createdByUserId: userId }; // Simplified DSR filter for the user's own performance for now
      }
    }

    const [orders, collections, visits] = await Promise.all([
      this.orderModel.find({ ...dateFilter, ...territoryFilter }).exec(),
      this.collectionModel.find({ organizationId, collectionDate: { $regex: `^${date}` }, ...territoryFilter }).exec(),
      this.visitModel.find({ ...dateFilter, ...(territoryFilter.createdByUserId ? { user: territoryFilter.createdByUserId } : {}) }).exec()
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
}
