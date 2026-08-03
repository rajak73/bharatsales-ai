import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Distributor } from '../schemas/distributor.schema';
import { Distributor as SharedDistributor } from '@bharatsales/shared-types';

const ACTIVE_ORDER_STATUSES = ['Submitted', 'Hold_Credit', 'Hold_Stock', 'Pending_Approval', 'Approved', 'Dispatched', 'Partial_Delivery'];

@Injectable()
export class DistributorsService {
  private readonly logger = new Logger(DistributorsService.name);

  constructor(
    @InjectModel(Distributor.name) private distributorModel: Model<Distributor>,
    @InjectModel('Order') private orderModel: Model<any>,
    @InjectModel('Inventory') private inventoryModel: Model<any>,
  ) {}

  async getDistributors(organizationId: string): Promise<any[]> {
    this.logger.log(`Fetching distributors for org ${organizationId}`);
    const distributors = await this.distributorModel.find({ organizationId }).exec();

    return Promise.all(distributors.map(async (dist: any) => {
      const distributorId = dist._id.toString();

      const [totalOrders, deliveredOrders, pendingOrders, inventoryItems] = await Promise.all([
        this.orderModel.countDocuments({ organizationId, assignedDistributorId: distributorId }).exec(),
        this.orderModel.countDocuments({ organizationId, assignedDistributorId: distributorId, status: 'Delivered' }).exec(),
        this.orderModel.countDocuments({ organizationId, assignedDistributorId: distributorId, status: { $in: ACTIVE_ORDER_STATUSES } }).exec(),
        this.inventoryModel.find({ organizationId, distributorId }).exec(),
      ]);

      const orderFulfillment = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
      const inStockItems = inventoryItems.filter((i: any) => (i.stock || 0) > 0).length;
      const fillRate = inventoryItems.length > 0 ? Math.round((inStockItems / inventoryItems.length) * 100) : 0;

      return {
        ...dist.toObject(),
        fillRate,
        orderFulfillment,
        pendingOrders,
      };
    }));
  }

  async create(organizationId: string, data: Omit<SharedDistributor, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<Distributor> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const newDistributor = new this.distributorModel({
      ...data,
      organizationId,
    });
    return newDistributor.save();
  }

  async update(organizationId: string, actorRole: string, id: string, data: Partial<Distributor>): Promise<Distributor | null> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;

    // Territory/product assignment is Organization Admin's call per BRD
    // ("Distributor Management") — a Sales Manager may update other fields
    // (e.g. status) but not reassign what territory/products a distributor covers.
    if ((data.territoryIds !== undefined || data.productIds !== undefined) && actorRole !== 'Organization Admin') {
      throw new ForbiddenException('Only Organization Admins can assign territories or products to a distributor.');
    }

    return this.distributorModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const result = await this.distributorModel.deleteOne({ _id: id, organizationId }).exec();
    return result.deletedCount === 1;
  }
}
