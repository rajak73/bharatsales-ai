import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Outlet } from '../schemas/outlet.schema';
import { Order } from '../schemas/order.schema';
import { Visit } from '../schemas/visit.schema';
import { Outlet as SharedOutlet } from '@bharatsales/shared-types';

@Injectable()
export class OutletsService {
  constructor(
    @InjectModel(Outlet.name) private outletModel: Model<Outlet>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Visit.name) private visitModel: Model<Visit>
  ) {}

  async findAllByOrgId(organizationId: string): Promise<Outlet[]> {
    return this.outletModel.find({ organizationId }).exec();
  }

  async getOutlet360(organizationId: string, outletId: string) {
    const [outlet, recentOrders, recentVisits] = await Promise.all([
      this.outletModel.findOne({ _id: outletId, organizationId }).exec(),
      this.orderModel.find({ outletId, organizationId }).sort({ orderDate: -1 }).limit(5).exec(),
      this.visitModel.find({ outletId, organizationId }).sort({ checkInTime: -1 }).limit(5).exec(),
    ]);

    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    const totalOrders = await this.orderModel.countDocuments({ outletId, organizationId }).exec();
    const allOrders = await this.orderModel.find({ outletId, organizationId }).exec();
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.totals?.grandTotal || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      outlet,
      recentOrders,
      recentVisits,
      analytics: {
        totalOrders,
        totalRevenue,
        averageOrderValue
      }
    };
  }

  async create(organizationId: string, outletData: Omit<SharedOutlet, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Outlet> {
    const newOutlet = new this.outletModel({
      ...outletData,
      organizationId,
      status: outletData.status || 'Active', // Default status if not provided
    });
    return newOutlet.save();
  }

  async softDelete(organizationId: string, id: string): Promise<Outlet> {
    const outlet = await this.outletModel.findOne({ _id: id, organizationId });
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }
    // BR-015: Never hard delete. Just mark inactive.
    outlet.status = 'Inactive';
    return outlet.save();
  }

  async update(organizationId: string, id: string, data: any): Promise<Outlet> {
    const outlet = await this.outletModel.findOne({ _id: id, organizationId });
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    // Safely apply dot-notation update using mongoose $set (e.g. { 'commercial.assignedDistributorId': 'dist_id' })
    const updated = await this.outletModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    );
    if (!updated) {
      throw new NotFoundException('Outlet not found during update');
    }
    return updated;
  }
}
