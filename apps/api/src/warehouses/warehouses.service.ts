import { Injectable, Logger } from '@nestjs/common';
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
    return this.warehouseModel.find({ organizationId }).exec();
  }

  async create(organizationId: string, data: Omit<SharedWarehouse, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<Warehouse> {
    const newWarehouse = new this.warehouseModel({
      ...data,
      organizationId,
    });
    return newWarehouse.save();
  }
}
