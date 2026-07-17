import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PriceList } from '../schemas';

@Injectable()
export class PriceListsService {
  constructor(
    @InjectModel('PriceList') private readonly priceListModel: Model<PriceList>,
  ) {}

  async findAllByOrgId(organizationId: string): Promise<PriceList[]> {
    return this.priceListModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async findAllItemsByOrgId(organizationId: string): Promise<any[]> {
    // A simplified item fetch since items might be stored within price lists or products.
    // In actual implementation, this could fetch embedded rules or joined documents.
    const lists = await this.priceListModel.find({ organizationId }).exec();
    return lists.map(list => ({
      priceListId: list._id,
      rules: list.pricingRules,
    }));
  }
}
