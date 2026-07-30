import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, PaymentCollection, Visit, User, Outlet, Inventory } from '@bharatsales/shared-types';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Collection') private collectionModel: Model<PaymentCollection>,
    @InjectModel('Visit') private visitModel: Model<Visit>,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
    @InjectModel('Target') private targetModel: Model<any>,
    @InjectModel('Inventory') private inventoryModel: Model<Inventory>,
  ) {}

  async getDashboardData(organizationId: string, user?: any) {
    if (user && user.role === 'Distributor') {
      return this.getDistributorDashboardData(organizationId, user.distributorId);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Total Revenue & Orders for this month
    const monthlyOrders = await this.orderModel.find({
      organizationId,
      createdAt: { $gte: startOfMonth.toISOString() }
    });

    const totalRevenue = monthlyOrders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
    const totalOrders = monthlyOrders.length;

    // Previous month, for real period-over-period growth %
    const prevMonthOrders = await this.orderModel.find({
      organizationId,
      createdAt: { $gte: startOfPrevMonth.toISOString(), $lt: startOfMonth.toISOString() }
    });
    const prevRevenue = prevMonthOrders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
    const prevOrders = prevMonthOrders.length;

    const revenueGrowth = prevRevenue > 0 ? parseFloat((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)) : 0;
    const orderGrowth = prevOrders > 0 ? parseFloat((((totalOrders - prevOrders) / prevOrders) * 100).toFixed(1)) : 0;

    // Active Outlets and Reps
    const activeOutlets = await this.outletModel.countDocuments({ organizationId, status: 'Active' });
    const activeReps = await this.userModel.countDocuments({ organizationId, status: 'Active' });

    // Build KPIs Object
    const kpis = {
      totalRevenue,
      revenueGrowth,
      totalOrders,
      orderGrowth,
      activeOutlets,
      activeReps
    };

    // Sales Data (7 Days)
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      
      const orders = await this.orderModel.find({
        organizationId,
        createdAt: { $gte: start.toISOString(), $lte: end.toISOString() }
      });
      
      const rev = orders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
      
      salesData.push({
        month: start.toLocaleDateString('en-US', { weekday: 'short' }), // Recharts uses 'month' as XAxis key based on frontend
        revenue: rev,
        orders: orders.length
      });
    }

    // Top Products
    const productSales = new Map<string, { sales: number, revenue: number }>();
    for (const order of monthlyOrders) {
      for (const item of order.items) {
        const pName = item.name || item.productId;
        const current = productSales.get(pName) || { sales: 0, revenue: 0 };
        current.sales += item.quantity;
        current.revenue += item.total || 0;
        productSales.set(pName, current);
      }
    }
    const topProducts = Array.from(productSales.entries())
      .map(([name, data]) => ({ name, sales: data.sales, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const activeUsers = await this.userModel.find({ organizationId, status: 'Active' });

    // Zone Performance — User schema has no real "zone" field today, so orders
    // are grouped as "Unassigned" until real hierarchy-based zone attribution
    // is implemented, rather than fabricating a zone name.
    const zoneSales = new Map<string, number>();
    for (const order of monthlyOrders) {
       const rev = order.totals?.grandTotal || 0;
       zoneSales.set('Unassigned', (zoneSales.get('Unassigned') || 0) + rev);
    }

    const zonePerformance = Array.from(zoneSales.entries())
      .map(([zone, revenue]) => ({ zone, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top Sales Reps
    const userStats = new Map<string, { orders: number, revenue: number, visits: number }>();
    const monthlyVisits = await this.visitModel.find({
      organizationId,
      createdAt: { $gte: startOfMonth.toISOString() }
    });

    for (const order of monthlyOrders) {
      if (!order.createdByUserId) continue;
      const current = userStats.get(order.createdByUserId) || { orders: 0, revenue: 0, visits: 0 };
      current.orders += 1;
      current.revenue += (order.totals?.grandTotal || 0);
      userStats.set(order.createdByUserId, current);
    }

    for (const visit of monthlyVisits) {
      const uid = visit.user?.toString() || (visit as any).userId;
      if (!uid) continue;
      const current = userStats.get(uid) || { orders: 0, revenue: 0, visits: 0 };
      current.visits += 1;
      userStats.set(uid, current);
    }

    const topSalesReps = activeUsers
      .map(u => {
        const stats = userStats.get(u._id.toString()) || { orders: 0, revenue: 0, visits: 0 };
        return {
          name: u.name,
          orders: stats.orders,
          revenue: stats.revenue,
          visits: stats.visits
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const recentOrders = await this.orderModel.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      kpis,
      salesData,
      topProducts,
      zonePerformance,
      topSalesReps,
      recentOrders
    };
  }

  // Fulfilment-scoped dashboard for the Distributor role — replaces the
  // org-wide sales KPIs (revenue/orders/active-users) with metrics relevant
  // to a distributor's own responsibility: pending deliveries, own stock,
  // and outstanding receivables from the outlets they supply.
  private async getDistributorDashboardData(organizationId: string, distributorId?: string) {
    const scopedDistributorId = distributorId || '__none__';

    const distributorOrders = await this.orderModel.find({
      organizationId,
      assignedDistributorId: scopedDistributorId
    }).exec();

    const pendingDeliveries = distributorOrders.filter(o =>
      ['Approved', 'Dispatched', 'Partial_Delivery'].includes(o.status as string)
    ).length;
    const inTransit = distributorOrders.filter(o => o.status === 'Dispatched').length;
    const deliveredThisMonth = (() => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      return distributorOrders.filter(o =>
        o.status === 'Delivered' && new Date(o.updatedAt) >= startOfMonth
      ).length;
    })();

    const inventory = await this.inventoryModel.find({ organizationId, distributorId: scopedDistributorId }).exec();
    const lowStockBatches = inventory.filter(i => i.stock <= 0 || i.blocked).length;
    const totalStockValue = inventory.reduce((sum, i) => sum + (i.stock || 0), 0);

    const distributorOutletIds = [...new Set(distributorOrders.map(o => o.outletId))];
    const outlets = distributorOutletIds.length
      ? await this.outletModel.find({ organizationId, _id: { $in: distributorOutletIds } }).exec()
      : [];
    const outstandingReceivables = outlets.reduce((sum, o) => sum + ((o as any).commercial?.outstandingBalance || 0), 0);

    return {
      kpis: {
        pendingDeliveries,
        inTransit,
        deliveredThisMonth,
        lowStockBatches,
        totalStockValue,
        outstandingReceivables,
        outletsServed: distributorOutletIds.length
      },
      recentOrders: distributorOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    };
  }
}
