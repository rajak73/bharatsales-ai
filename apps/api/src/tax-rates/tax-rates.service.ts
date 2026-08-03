import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaxRate } from '../schemas/tax-rate.schema';
import { TaxRate as SharedTaxRate } from '@bharatsales/shared-types';

@Injectable()
export class TaxRatesService {
  constructor(@InjectModel('TaxRate') private taxRateModel: Model<TaxRate>) {}

  async findAllByOrgId(organizationId: string): Promise<TaxRate[]> {
    return this.taxRateModel.find({ organizationId }).exec();
  }

  async create(organizationId: string, data: Omit<SharedTaxRate, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<TaxRate> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const newTaxRate = new this.taxRateModel({ ...data, organizationId });
    return newTaxRate.save();
  }

  async update(organizationId: string, id: string, data: Partial<SharedTaxRate>): Promise<TaxRate> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const taxRate = await this.taxRateModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    if (!taxRate) throw new NotFoundException('Tax rate not found');
    return taxRate;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const taxRate = await this.taxRateModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!taxRate) throw new NotFoundException('Tax rate not found');
    return { deleted: true };
  }
}
