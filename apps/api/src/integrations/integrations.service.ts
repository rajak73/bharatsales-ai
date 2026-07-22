import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Integration } from '../schemas/integration.schema';
import { Integration as SharedIntegration } from '@bharatsales/shared-types';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectModel(Integration.name) private integrationModel: Model<Integration>,
  ) {}

  async findAllByOrgId(organizationId: string): Promise<SharedIntegration[]> {
    const records = await this.integrationModel.find({ organizationId }).exec();
    
    // If no integrations exist, seed some default ones for the demo
    if (records.length === 0) {
      const defaults = [
        { organizationId, name: 'Tally ERP 9', provider: 'Tally Solutions', purpose: 'Accounting Sync', status: 'Active' as const, config: {} },
        { organizationId, name: 'Razorpay', provider: 'Razorpay', purpose: 'Payment Gateway', status: 'Active' as const, config: {} },
        { organizationId, name: 'Shopify', provider: 'Shopify', purpose: 'E-commerce Sync', status: 'Inactive' as const, config: {} },
      ];
      await this.integrationModel.insertMany(defaults);
      const newRecords = await this.integrationModel.find({ organizationId }).exec();
      return newRecords.map(doc => ({
        name: doc.name,
        provider: doc.provider,
        purpose: doc.purpose,
        status: doc.status
      }));
    }

    return records.map(doc => ({
      id: doc._id?.toString(),
      name: doc.name,
      provider: doc.provider,
      purpose: doc.purpose,
      status: doc.status
    }));
  }

  async create(organizationId: string, data: any): Promise<Integration> {
    delete data.organizationId;
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;

    const newIntegration = new this.integrationModel({
      ...data,
      organizationId,
    });
    return newIntegration.save();
  }

  async update(organizationId: string, id: string, data: any): Promise<Integration> {
    delete data.organizationId;
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;

    const integration = await this.integrationModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    
    if (!integration) {
      throw new NotFoundException('Integration not found');
    }
    
    return integration;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const integration = await this.integrationModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!integration) {
      throw new NotFoundException('Integration not found');
    }
    return { deleted: true };
  }
}
