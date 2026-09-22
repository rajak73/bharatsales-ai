import { NotFoundException } from '../core/http-errors';
import { Model } from 'mongoose';
import { TaxRate } from '../schemas/tax-rate.schema';
import { TaxRate as SharedTaxRate } from '@bharatsales/shared-types';
import { toSafeUpdate } from '../core/query-safety';

export class TaxRatesService {
  constructor(private taxRateModel: Model<TaxRate>) {}

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
      { _id: String(id), organizationId },
      { $set: toSafeUpdate(data) },
      { new: true }
    ).exec();
    if (!taxRate) throw new NotFoundException('Tax rate not found');
    return taxRate;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const taxRate = await this.taxRateModel.findOneAndDelete({ _id: String(id), organizationId }).exec();
    if (!taxRate) throw new NotFoundException('Tax rate not found');
    return { deleted: true };
  }
}
