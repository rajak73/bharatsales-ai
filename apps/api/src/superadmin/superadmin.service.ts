import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from '../schemas/tenant.schema';
import { User } from '../schemas/user.schema';

@Injectable()
export class SuperadminService {
  private readonly logger = new Logger(SuperadminService.name);

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(User.name) private userModel: Model<User>
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
}
