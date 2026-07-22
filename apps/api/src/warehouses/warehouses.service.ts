import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Warehouse } from '../schemas/warehouse.schema';
import { Warehouse as SharedWarehouse } from '@bharatsales/shared-types';

@Injectable()
export class WarehousesService {
  private readonly logger = new Logger(WarehousesService.name);

  constructor(@InjectModel(Warehouse.name) private warehouseModel: Model<Warehouse>) {}

  async getWarehouses(organizationId: string): Promise<Warehouse[]> {
    this.logger.log(`Fetching warehouses for org ${organizationId}`);
    return this.warehouseModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async create(organizationId: string, data: Omit<SharedWarehouse, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<Warehouse> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const newWarehouse = new this.warehouseModel({
      ...data,
      organizationId,
    });
    return newWarehouse.save();
  }

  async update(organizationId: string, id: string, data: any): Promise<Warehouse> {
    delete data.organizationId;
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;

    const warehouse = await this.warehouseModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    
    return warehouse;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const warehouse = await this.warehouseModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return { deleted: true };
  }
}
