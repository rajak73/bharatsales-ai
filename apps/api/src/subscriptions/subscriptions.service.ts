import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from '../schemas/tenant.schema';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(@InjectModel(Tenant.name) private tenantModel: Model<Tenant>) {}

  async getSubscriptionDetails(organizationId: string) {
    this.logger.log(`Fetching subscription details for org ${organizationId}`);
    
    const tenant = await this.tenantModel.findById(organizationId).exec();
    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    return {
      organizationId,
      plan: tenant.plan,
      status: tenant.status,
      billingCycle: 'Annual',
      nextBillingDate: '2027-01-01T00:00:00Z',
      features: {
        maxUsers: tenant.plan === 'Enterprise' ? 1000 : tenant.plan === 'Growth' ? 100 : 10,
        maxOutlets: tenant.plan === 'Enterprise' ? 50000 : tenant.plan === 'Growth' ? 5000 : 500,
        aiInsights: tenant.plan === 'Enterprise',
        customReports: tenant.plan === 'Enterprise' || tenant.plan === 'Growth',
        apiAccess: tenant.plan === 'Enterprise'
      }
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
