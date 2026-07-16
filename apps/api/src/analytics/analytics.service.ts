import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, PaymentCollection, Visit, User, Outlet } from '@bharatsales/shared-types';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Collection') private collectionModel: Model<PaymentCollection>,
    @InjectModel('Visit') private visitModel: Model<Visit>,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
  ) {}

  async getDashboardData(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // KPIs
    const todaysOrders = await this.orderModel.find({
      organizationId,
      createdAt: { $gte: today.toISOString() }
    });
    const todaysOrderTotal = todaysOrders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);

    const todaysVisits = await this.visitModel.find({
      organizationId,
      createdAt: { $gte: today.toISOString() }
    });
    
    // Productive calls = visits that resulted in an order (mocked here by checking if they have an order today)
    const productiveCalls = todaysOrders.length; 

    const todaysCollections = await this.collectionModel.find({
      organizationId,
      collectionDate: { $gte: today.toISOString() }
    });
    const todaysCollectionTotal = todaysCollections.reduce((sum, c) => sum + (c.amount || 0), 0);

    // Recent Orders
    const recentOrdersDb = await this.orderModel.find({ organizationId }).sort({ createdAt: -1 }).limit(5);
    const recentOrders = recentOrdersDb.map(o => ({
      id: o.orderNumber || o.id,
      outlet: o.outletId, // ideally resolved to outlet name
      amount: `₹${(o.totals?.grandTotal || 0).toLocaleString()}`,
      status: o.status,
      time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    // Sales Data (7 days)
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      
      const count = await this.orderModel.countDocuments({
        organizationId,
        createdAt: { $gte: start.toISOString(), $lte: end.toISOString() }
      });
      
      salesData.push({
        day: start.toLocaleDateString('en-US', { weekday: 'short' }),
        orders: count
      });
    }

    // Monthly Target (mocked for now, just sum all orders this month vs a fixed target)
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    const monthlyOrders = await this.orderModel.find({
      organizationId,
      createdAt: { $gte: startOfMonth.toISOString() }
    });
    const achieved = monthlyOrders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
    const target = 2500000;

    return {
      kpis: [
        { label: "Today's Orders", value: `₹${todaysOrderTotal.toLocaleString()}`, change: '+0%', up: true, icon: '📋' },
        { label: 'Visits Completed', value: `${todaysVisits.length}`, change: '0%', up: true, icon: '📍' },
        { label: 'Productive Calls', value: `${productiveCalls}`, change: '0', up: true, icon: '✅' },
        { label: 'Collections', value: `₹${todaysCollectionTotal.toLocaleString()}`, change: '+0%', up: true, icon: '💰' },
      ],
      recentOrders,
      salesData,
      monthlyTarget: {
        achieved,
        target,
        percentage: Math.round((achieved / target) * 100)
      }
    };
  }
}
