import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaxRate } from '../schemas';

@Injectable()
export class TaxRatesService {
  constructor(
    @InjectModel('TaxRate') private readonly taxRateModel: Model<TaxRate>,
  ) {}

  async findAllByOrgId(organizationId: string): Promise<TaxRate[]> {
    return this.taxRateModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async create(organizationId: string, data: any): Promise<TaxRate> {
    delete data.organizationId;
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;

    const newRate = new this.taxRateModel({
      ...data,
      organizationId,
    });
    return newRate.save();
  }

  async update(organizationId: string, id: string, data: any): Promise<TaxRate> {
    delete data.organizationId;
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;

    const rate = await this.taxRateModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    
    if (!rate) {
      throw new NotFoundException('Tax rate not found');
    }
    
    return rate;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const rate = await this.taxRateModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!rate) {
      throw new NotFoundException('Tax rate not found');
    }
    return { deleted: true };
  }
}
