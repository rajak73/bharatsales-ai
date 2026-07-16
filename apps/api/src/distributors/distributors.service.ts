import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Distributor } from '../schemas/distributor.schema';
import { Distributor as SharedDistributor } from '@bharatsales/shared-types';

@Injectable()
export class DistributorsService {
  private readonly logger = new Logger(DistributorsService.name);

  constructor(@InjectModel(Distributor.name) private distributorModel: Model<Distributor>) {}

  async getDistributors(organizationId: string): Promise<Distributor[]> {
    this.logger.log(`Fetching distributors for org ${organizationId}`);
    return this.distributorModel.find({ organizationId }).exec();
  }

  async create(organizationId: string, data: Omit<SharedDistributor, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<Distributor> {
    const newDistributor = new this.distributorModel({
      ...data,
      organizationId,
    });
    return newDistributor.save();
  }

  async update(organizationId: string, id: string, data: Partial<Distributor>): Promise<Distributor | null> {
    return this.distributorModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const result = await this.distributorModel.deleteOne({ _id: id, organizationId }).exec();
    return result.deletedCount === 1;
  }
}
