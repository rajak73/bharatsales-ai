import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Tenant } from '../schemas/tenant.schema';
import { User } from '../schemas/user.schema';
import { PlatformSettings } from '../schemas/platform-settings.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SuperadminService {
  private readonly logger = new Logger(SuperadminService.name);

  private static readonly PLAN_PRICES: Record<string, number> = {
    Starter: 9999,
    Growth: 24999,
    Enterprise: 49999,
  };

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(PlatformSettings.name) private platformSettingsModel: Model<PlatformSettings>,
    @InjectConnection() private connection: Connection,
    private auditService: AuditService
  ) {}

  async getPlatformSettings() {
    let settings = await this.platformSettingsModel.findOne().exec();
    if (!settings) {
      settings = await new this.platformSettingsModel({}).save();
    }
    return settings;
  }

  async updatePlatformSettings(data: Partial<PlatformSettings>) {
    let settings = await this.platformSettingsModel.findOne().exec();
    if (!settings) {
      settings = new this.platformSettingsModel({});
    }
    Object.assign(settings, data);
    return settings.save();
  }

  async getAllTenants() {
    this.logger.log('Fetching all tenants for super admin view');
    const tenants = await this.tenantModel.find().lean().exec();

    // Enrich with user count
    const tenantIds = tenants.map(t => t._id.toString());
    const userCounts = await this.userModel.aggregate([
      { $match: { organizationId: { $in: tenantIds } } },
      { $group: { _id: '$organizationId', count: { $sum: 1 } } }
    ]);

    const userCountMap = new Map();
    userCounts.forEach(uc => userCountMap.set(uc._id.toString(), uc.count));

    return tenants.map(t => ({
      ...t,
      id: t._id,
      _id: undefined,
      userCount: userCountMap.get(t._id.toString()) || 0
    }));
  }

  async updateTenantStatus(id: string, status: string) {
    this.logger.log(`Updating tenant ${id} status to ${status}`);
    const validStatuses = ['Trial', 'Active', 'Past Due', 'Suspended', 'Archived'];
    if (!validStatuses.includes(status)) {
      throw new NotFoundException(`Invalid status: ${status}`);
    }

    const tenant = await this.tenantModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    return tenant;
  }

  async createTenant(data: Partial<Tenant>) {
    this.logger.log(`Creating new tenant: ${data.name}`);
    const newTenant = new this.tenantModel({
      ...data,
      status: data.status || 'Active',
      plan: data.plan || 'Starter',
      billingCycle: data.billingCycle || 'Annual',
    });
    return newTenant.save();
  }

  async getGlobalAuditLogs(limit: number = 50) {
    this.logger.log('Fetching global audit logs');
    return this.auditService.getGlobalLogs(limit);
  }

  async getMetrics() {
    this.logger.log('Fetching super admin metrics');

    // Calculate total MRR based on active tenants' real plan field
    const tenants = await this.tenantModel.find({ status: 'Active' }).lean().exec();
    let totalMRR = 0;

    const planCounts = { Starter: 0, Growth: 0, Enterprise: 0 };

    tenants.forEach(t => {
      const planName = t.plan || 'Starter';
      totalMRR += SuperadminService.PLAN_PRICES[planName] || 0;
      if (planCounts[planName as keyof typeof planCounts] !== undefined) {
        planCounts[planName as keyof typeof planCounts]++;
      }
    });

    const plans = [
      { name: 'Starter', price: '₹9,999/mo', users: '10', distributors: '1', tenants: planCounts.Starter },
      { name: 'Growth', price: '₹24,999/mo', users: '50', distributors: '5', tenants: planCounts.Growth },
      { name: 'Enterprise', price: 'Custom', users: 'Unlimited', distributors: 'Unlimited', tenants: planCounts.Enterprise },
    ];

    return { mrr: totalMRR, plans };
  }

  // Cross-tenant user directory — deliberately unscoped, following the same
  // precedent as AuditService.getGlobalLogs(). Gated by checkSuperAdmin() at
  // the controller level, never exposed to tenant-scoped roles.
  async getAllUsers(filters?: { role?: string; organizationId?: string; status?: string }) {
    const query: any = {};
    if (filters?.role) query.role = filters.role;
    if (filters?.organizationId) query.organizationId = filters.organizationId;
    if (filters?.status) query.status = filters.status;

    const users = await this.userModel.find(query).select('-password').lean().exec();
    const tenantIds = [...new Set(users.map(u => u.organizationId))];
    const tenants = await this.tenantModel.find({ _id: { $in: tenantIds } }).select('name').lean().exec();
    const tenantNameMap = new Map(tenants.map(t => [t._id.toString(), t.name]));

    return users.map(u => ({
      ...u,
      id: u._id,
      _id: undefined,
      organizationName: tenantNameMap.get(u.organizationId) || 'Unknown'
    }));
  }

  async updateSubscription(id: string, data: { plan?: string; billingCycle?: string; subscriptionUsersLimit?: number }) {
    const update: any = {};
    if (data.plan) update.plan = data.plan;
    if (data.billingCycle) update.billingCycle = data.billingCycle;
    if (data.subscriptionUsersLimit !== undefined) update.subscriptionUsersLimit = data.subscriptionUsersLimit;

    const tenant = await this.tenantModel.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }
    return tenant;
  }

  async addBillingRecord(id: string, data: { amount: string; plan: string; status?: string }) {
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    tenant.billingHistory = tenant.billingHistory || [];
    tenant.billingHistory.push({
      id: `BILL-${Date.now()}`,
      date: new Date().toISOString(),
      plan: data.plan,
      amount: data.amount,
      status: data.status || 'Paid'
    });
    await tenant.save();
    return tenant;
  }

  // Genuine cross-tenant aggregates — same query shapes as analytics.service.ts,
  // deliberately without an organizationId filter.
  async getPlatformAnalytics() {
    const db = this.tenantModel.db;
    const orderModel = db.model('Order');

    const [totalOrdersAgg, activeUsers, sixMonthTenants] = await Promise.all([
      orderModel.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: '$totals.grandTotal' }, totalOrders: { $sum: 1 } } }
      ]),
      this.userModel.countDocuments({ status: 'Active' }).exec(),
      this.tenantModel.find({
        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
      }).select('name createdAt').lean().exec()
    ]);

    const tenantGrowth: Record<string, number> = {};
    sixMonthTenants.forEach((t: any) => {
      const month = new Date(t.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      tenantGrowth[month] = (tenantGrowth[month] || 0) + 1;
    });

    const topTenantsAgg = await orderModel.aggregate([
      { $group: { _id: '$organizationId', orderCount: { $sum: 1 }, revenue: { $sum: '$totals.grandTotal' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);
    const topTenantIds = topTenantsAgg.map((t: any) => t._id);
    const topTenantDocs = await this.tenantModel.find({ _id: { $in: topTenantIds } }).select('name').lean().exec();
    const topTenantNameMap = new Map(topTenantDocs.map(t => [t._id.toString(), t.name]));
    const topTenants = topTenantsAgg.map((t: any) => ({
      organizationId: t._id,
      name: topTenantNameMap.get(t._id) || t._id,
      orderCount: t.orderCount,
      revenue: t.revenue
    }));

    return {
      totalRevenue: totalOrdersAgg[0]?.totalRevenue || 0,
      totalOrders: totalOrdersAgg[0]?.totalOrders || 0,
      activeUsers,
      tenantGrowth: Object.entries(tenantGrowth).map(([month, count]) => ({ month, count })),
      topTenants
    };
  }

  // Honest platform health: real tenant/user counts and Mongo connection
  // state only. No fabricated Redis/MinIO/uptime figures.
  async getPlatformDashboard() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalTenants, activeTenants, totalUsers, recentSignups] = await Promise.all([
      this.tenantModel.countDocuments().exec(),
      this.tenantModel.countDocuments({ status: 'Active' }).exec(),
      this.userModel.countDocuments().exec(),
      this.tenantModel.find({ createdAt: { $gte: sevenDaysAgo } }).select('name plan status createdAt').sort({ createdAt: -1 }).lean().exec()
    ]);

    const readyStateNames: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      recentSignups,
      database: {
        status: readyStateNames[this.connection.readyState] || 'unknown'
      }
    };
  }
}
