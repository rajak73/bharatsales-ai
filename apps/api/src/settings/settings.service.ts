import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SettingsService {
  constructor(@InjectModel('Tenant') private readonly tenantModel: Model<any>) {}

  async getSettings(organizationId: string) {
    const org = await this.tenantModel.findById(organizationId).exec();
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async updateSettings(organizationId: string, updateData: any) {
    delete (updateData as any).organizationId;
    delete (updateData as any)._id;
    delete (updateData as any).createdAt;
    delete (updateData as any).updatedAt;
    const org = await this.tenantModel.findByIdAndUpdate(
      organizationId,
      { $set: updateData },
      { new: true }
    ).exec();
    
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    
    return org;
  }
}
