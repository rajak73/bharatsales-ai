import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from '../schemas/tenant.schema';
import { User } from '../schemas/user.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SuperadminService {
  private readonly logger = new Logger(SuperadminService.name);

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(User.name) private userModel: Model<User>,
    private auditService: AuditService
  ) {}

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
    const input: any = data;
    const newTenant = new this.tenantModel({
      ...data,
      status: data.status || 'Active',
      subscription: input.subscription || { plan: 'Growth', status: 'Active' },
      commercialSettings: input.commercialSettings || { maxUsers: 50, maxDistributors: 5, allowOffline: true, geofenceRadius: 50 },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return newTenant.save();
  }

  async getGlobalAuditLogs(limit: number = 50) {
    this.logger.log('Fetching global audit logs');
    return this.auditService.getGlobalLogs(limit);
  }

  async getMetrics() {
    this.logger.log('Fetching super admin metrics');
    
    // Calculate total MRR based on active tenants
    const tenants = await this.tenantModel.find({ status: 'Active' }).lean().exec();
    let totalMRR = 0;
    
    const planCounts = { Starter: 0, Growth: 0, Enterprise: 0 };
    
    tenants.forEach(t => {
      const tAny = t as any;
      const planName = tAny.subscription?.plan || 'Starter';
      if (planName === 'Starter') { totalMRR += 9999; planCounts.Starter++; }
      else if (planName === 'Growth') { totalMRR += 24999; planCounts.Growth++; }
      else if (planName === 'Enterprise') { totalMRR += 49999; planCounts.Enterprise++; }
    });

    const plans = [
      { name: 'Starter', price: '₹9,999/mo', users: '10', distributors: '1', tenants: planCounts.Starter },
      { name: 'Growth', price: '₹24,999/mo', users: '50', distributors: '5', tenants: planCounts.Growth },
      { name: 'Enterprise', price: 'Custom', users: 'Unlimited', distributors: 'Unlimited', tenants: planCounts.Enterprise },
    ];

    const systemHealth = { 
      api: { status: 'healthy', uptime: '99.99%', responseTime: '120ms' }, 
      mongodb: { status: 'healthy', connections: '12/100', storage: '1.2GB' }, 
      redis: { status: 'healthy', memory: '64MB/256MB', hitRate: '98%' }, 
      minio: { status: 'healthy', storage: '5GB/100GB', buckets: 4 } 
    };

    return { mrr: totalMRR, plans, systemHealth };
  }
}
