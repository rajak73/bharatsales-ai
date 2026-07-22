import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from '../schemas/tenant.schema';
import { User } from '../schemas/user.schema';
import { Distributor } from '../schemas/distributor.schema';
import { SubscriptionData } from '@bharatsales/shared-types';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Distributor.name) private distributorModel: Model<Distributor>,
  ) {}

  async getSubscriptionDetails(organizationId: string): Promise<SubscriptionData> {
    this.logger.log(`Fetching subscription details for org ${organizationId}`);
    
    const tenant = await this.tenantModel.findById(organizationId).exec();
    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    const userCount = await this.userModel.countDocuments({ organizationId }).exec();
    const distributorCount = await this.distributorModel.countDocuments({ organizationId }).exec();

    const maxUsers = tenant.subscriptionUsersLimit || (tenant.plan === 'Enterprise' ? 1000 : tenant.plan === 'Growth' ? 100 : 10);
    const maxDistributors = tenant.plan === 'Enterprise' ? 50000 : tenant.plan === 'Growth' ? 5000 : 500;

    const plans = [
      {
        name: 'Starter',
        price: '₹2,999',
        users: 10,
        distributors: 500,
        storage: '5GB',
        features: ['Basic Analytics', 'Standard Support', 'Core Modules'],
        current: tenant.plan === 'Starter'
      },
      {
        name: 'Growth',
        price: '₹8,999',
        users: 100,
        distributors: 5000,
        storage: '50GB',
        features: ['Advanced Analytics', 'Priority Support', 'Custom Reports'],
        current: tenant.plan === 'Growth'
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        users: 1000,
        distributors: 50000,
        storage: '500GB',
        features: ['AI Insights', '24/7 Dedicated Support', 'API Access', 'SSO'],
        current: tenant.plan === 'Enterprise'
      }
    ];

    const priceMap: Record<string, string> = {
      'Starter': '₹2,999/mo',
      'Growth': '₹8,999/mo',
      'Enterprise': 'Custom Pricing'
    };

    return {
      currentPlan: {
        name: tenant.plan,
        price: priceMap[tenant.plan],
        status: tenant.status,
        startDate: (tenant as any).createdAt || new Date().toISOString(),
        nextBilling: tenant.nextBillingDate || '2027-01-01',
        users: { used: userCount, limit: maxUsers },
        distributors: { used: distributorCount, limit: maxDistributors },
        storage: { used: tenant.subscriptionStorageUsed || '1GB', limit: plans.find(p => p.name === tenant.plan)?.storage || '5GB' }
      },
      plans,
      invoices: tenant.billingHistory || []
    };
  }

  async upgradePlan(organizationId: string, plan: 'Starter' | 'Growth' | 'Enterprise') {
    this.logger.log(`Upgrading org ${organizationId} to plan ${plan}`);
    const validPlans = ['Starter', 'Growth', 'Enterprise'];
    if (!validPlans.includes(plan)) {
      throw new BadRequestException('Invalid plan selected');
    }

    const tenant = await this.tenantModel.findByIdAndUpdate(organizationId, { plan }, { new: true }).exec();
    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }
    
    return { success: true, message: `Successfully upgraded to ${plan}`, tenant };
  }
}
