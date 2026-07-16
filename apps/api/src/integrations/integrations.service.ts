import { Injectable } from '@nestjs/common';
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
      name: doc.name,
      provider: doc.provider,
      purpose: doc.purpose,
      status: doc.status
    }));
  }
}
