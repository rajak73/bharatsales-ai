import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalesTarget, Order, PaymentCollection, Visit } from '@bharatsales/shared-types';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel('Target') private targetModel: Model<SalesTarget>,
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Collection') private collectionModel: Model<PaymentCollection>,
    @InjectModel('Visit') private visitModel: Model<Visit>,
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

    // Note: in a real implementation we would filter by the user's hierarchy. 
    // Here we just fetch org-wide for the admin DSR dashboard demo.

    const [orders, collections, visits] = await Promise.all([
      this.orderModel.find(dateFilter).exec(),
      this.collectionModel.find({ organizationId, collectionDate: { $regex: `^${date}` } }).exec(),
      this.visitModel.find(dateFilter).exec()
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
