import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PriceList } from '../schemas/price-list.schema';
import { PriceList as SharedPriceList } from '@bharatsales/shared-types';

@Injectable()
export class PriceListsService {
  constructor(@InjectModel('PriceList') private priceListModel: Model<PriceList>) {}

  async findAllByOrgId(organizationId: string): Promise<PriceList[]> {
    return this.priceListModel.find({ organizationId }).exec();
  }

  async create(organizationId: string, data: Omit<SharedPriceList, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<PriceList> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const newPriceList = new this.priceListModel({ ...data, organizationId });
    return newPriceList.save();
  }

  async update(organizationId: string, id: string, data: Partial<SharedPriceList>): Promise<PriceList> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const priceList = await this.priceListModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    if (!priceList) throw new NotFoundException('Price list not found');
    return priceList;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const priceList = await this.priceListModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!priceList) throw new NotFoundException('Price list not found');
    return { deleted: true };
  }
}
