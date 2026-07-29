import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Outlet } from '../schemas/outlet.schema';
import { Order } from '../schemas/order.schema';
import { Visit } from '../schemas/visit.schema';
import { Outlet as SharedOutlet } from '@bharatsales/shared-types';
import { Tenant } from '../schemas/tenant.schema';
import { HierarchyService } from '../hierarchy/hierarchy.service';

@Injectable()
export class OutletsService {
  constructor(
    @InjectModel(Outlet.name) private outletModel: Model<Outlet>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Visit.name) private visitModel: Model<Visit>,
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    private readonly hierarchyService: HierarchyService
  ) {}

  async findAllByOrgId(organizationId: string, user?: any): Promise<Outlet[]> {
    const query: any = { organizationId };

    if (user && !['Super Admin', 'Organization Admin'].includes(user.role)) {
      if (!user.territoryIds || user.territoryIds.length === 0) {
        return []; // Non-admin with no territory sees nothing
      }
      const descendantIds = await this.hierarchyService.getDescendantTerritoryIds(organizationId, user.territoryIds);
      query.$or = [
        { territoryId: { $in: descendantIds } },
        { territoryId: { $exists: false } },
        { territoryId: null }
      ];
    }

    return this.outletModel.find(query).exec();
  }

  async getOutlet360(organizationId: string, outletId: string) {
    const [outlet, recentOrders, recentVisits] = await Promise.all([
      this.outletModel.findOne({ _id: outletId, organizationId }).exec(),
      this.orderModel.find({ outletId, organizationId }).sort({ orderDate: -1 }).limit(5).exec(),
      this.visitModel.find({ outlet: outletId, organizationId }).sort({ checkInTime: -1 }).limit(5).exec(),
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

  async create(organizationId: string, createdByUserId: string, outletData: Partial<SharedOutlet>): Promise<Outlet> {
    const existing = await this.outletModel.findOne({
      organizationId,
      $or: [
        { mobile: outletData.mobile },
        ...(outletData.tax?.gstin ? [{ 'tax.gstin': outletData.tax.gstin }] : [])
      ]
    }).exec();
    if (existing) {
      throw new BadRequestException('An outlet with this mobile number or GSTIN already exists.');
    }

    // Tier limit validation
    const tenant = await this.tenantModel.findById(organizationId).exec();
    if (tenant) {
      const maxOutlets = (tenant as any).commercialSettings?.maxOutlets || 0; // assuming it exists or similar limit
      if (maxOutlets > 0) {
        const currentOutletCount = await this.outletModel.countDocuments({ organizationId }).exec();
        if (currentOutletCount >= maxOutlets) {
          throw new BadRequestException(`Organization has reached its maximum outlet limit of ${maxOutlets}. Please upgrade your plan.`);
        }
      }
    }

    const newOutlet = new this.outletModel({
      ...outletData,
      organizationId,
      status: 'Pending Approval', // BR-002 Default to Pending Approval
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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

  async approve(organizationId: string, id: string): Promise<Outlet> {
    const outlet = await this.outletModel.findOne({ _id: id, organizationId });
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }
    outlet.status = 'Active';
    return outlet.save();
  }

  async update(organizationId: string, id: string, data: any): Promise<Outlet> {
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
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
