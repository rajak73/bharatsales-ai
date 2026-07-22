import { Injectable, NotFoundException } from '@nestjs/common';
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
    // Return embedded pricing rules
    const lists = await this.priceListModel.find({ organizationId }).exec();
    return lists.map(list => ({
      priceListId: list._id,
      name: list.name,
      rules: list.pricingRules,
    }));
  }

  async create(organizationId: string, data: any): Promise<PriceList> {
    delete data.organizationId;
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;
    
    const newList = new this.priceListModel({
      ...data,
      organizationId,
      status: data.status || 'Active',
    });
    return newList.save();
  }

  async update(organizationId: string, id: string, data: any): Promise<PriceList> {
    delete data.organizationId;
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;

    const list = await this.priceListModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    
    if (!list) {
      throw new NotFoundException('Price list not found');
    }
    
    return list;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const list = await this.priceListModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!list) {
      throw new NotFoundException('Price list not found');
    }
    return { deleted: true };
  }
}
