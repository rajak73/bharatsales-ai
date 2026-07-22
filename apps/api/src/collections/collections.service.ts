import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentCollection } from '@bharatsales/shared-types';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel('Collection') private readonly collectionModel: Model<PaymentCollection>
  ) {}

  async findAll(organizationId: string): Promise<PaymentCollection[]> {
    return this.collectionModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async create(organizationId: string, userId: string, data: Partial<PaymentCollection>): Promise<PaymentCollection> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const newCollection = new this.collectionModel({
      ...data,
      organizationId,
      collectedByUserId: userId,
      status: data.status || 'Pending',
      collectionDate: data.collectionDate || new Date().toISOString()
    });
    return await newCollection.save();
  }

  async updateStatus(organizationId: string, id: string, status: PaymentCollection['status']): Promise<PaymentCollection> {
    const collection = await this.collectionModel.findOneAndUpdate(
      { _id: id, organizationId },
      { status },
      { new: true }
    ).exec();

    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    return collection;
  }

  async update(organizationId: string, id: string, data: any): Promise<PaymentCollection> {
    delete data.organizationId;
    delete data._id;
    const collection = await this.collectionModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const collection = await this.collectionModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!collection) throw new NotFoundException('Collection not found');
    return { deleted: true };
  }
}
