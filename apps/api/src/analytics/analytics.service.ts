import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, Visit, User, Outlet } from '@bharatsales/shared-types';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Visit') private visitModel: Model<Visit>,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
    @InjectModel('Target') private targetModel: Model<any>,
  ) {}

  async getDashboardData(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const query = { organizationId, createdAt: { $gte: startOfMonth.toISOString() } };
    
    const [monthlyOrders, activeOutlets, activeReps, activeUsers, monthlyVisits] = await Promise.all([
      this.orderModel.find(query).lean(),
      this.outletModel.countDocuments({ organizationId, status: 'Active' }),
      this.userModel.countDocuments({ organizationId, status: 'Active' }),
      this.userModel.find({ organizationId, status: 'Active' }).lean(),
      this.visitModel.find(query).lean()
    ]);
    
    const totalRevenue = monthlyOrders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
    const totalOrders = monthlyOrders.length;

    // Build KPIs Object
    const kpis = {
      totalRevenue,
      revenueGrowth: 12, // Mock trend for now
      totalOrders,
      orderGrowth: 8, // Mock trend for now
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
      
      const orders = monthlyOrders.filter(o => {
        const d = new Date(o.createdAt);
        return d >= start && d <= end;
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
      for (const item of (order as any).items || []) {
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

    // Zone Performance (Extract from Users or mock from outlets)
    const zoneSales = new Map<string, number>();
    for (const order of monthlyOrders) {
       const user = activeUsers.find(u => u._id.toString() === order.createdByUserId);
       const zone = (user as any)?.zone || 'North Zone';
       const rev = order.totals?.grandTotal || 0;
       zoneSales.set(zone, (zoneSales.get(zone) || 0) + rev);
    }
    if (zoneSales.size === 0) zoneSales.set('Default Zone', totalRevenue);
    
    const zonePerformance = Array.from(zoneSales.entries())
      .map(([zone, revenue]) => ({ zone, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top Sales Reps
    const userStats = new Map<string, { orders: number, revenue: number, visits: number }>();

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
      .limit(5)
      .lean();

    return {
      kpis,
      salesData,
      topProducts,
      zonePerformance,
      topSalesReps,
      recentOrders
    };
  }
}
