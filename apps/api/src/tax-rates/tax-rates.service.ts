import { Injectable } from '@nestjs/common';
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
}
