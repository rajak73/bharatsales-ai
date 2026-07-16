import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Outlet360Details, Outlet360Order, Outlet360Visit } from '@bharatsales/shared-types';

@Injectable()
export class Outlet360Service {
  constructor(
    @InjectModel('Outlet') private readonly outletModel: Model<any>,
    @InjectModel('Order') private readonly orderModel: Model<any>,
    @InjectModel('Visit') private readonly visitModel: Model<any>,
  ) {}

  private async getOutletByCode(code: string) {
    const outlet = await this.outletModel.findOne({ code });
    if (!outlet) throw new NotFoundException('Outlet not found');
    return outlet;
  }

  async getOutletDetails(organizationId: string, outletCode: string): Promise<Outlet360Details | null> {
    const outlet = await this.outletModel.findOne({ code: outletCode });
    if (!outlet) return null;

    return {
      code: outlet.code,
      name: outlet.name,
      owner: outlet.owner || 'Unknown',
      status: outlet.status,
      tier: 'Gold', // Mock tier
      category: outlet.type || 'General',
      mobile: outlet.phone || 'N/A',
      email: outlet.email || 'N/A',
      language: 'English',
      address: outlet.address || 'N/A',
      state: 'Maharashtra',
      pin: '400001',
      gstin: '27AAAAA0000A1Z5',
      creditLimit: '₹50,000',
      outstanding: '₹12,500',
      distributor: 'Super Distributor Pvt Ltd'
    };
  }

  async getOutletOrders(organizationId: string, outletCode: string): Promise<Outlet360Order[]> {
    const outlet = await this.getOutletByCode(outletCode);
    const orders = await this.orderModel.find({ outlet: outlet._id }).sort({ createdAt: -1 });

    return orders.map(o => ({
      id: o._id.toString(),
      orderNumber: `ORD-${o._id.toString().substring(0, 6)}`,
      date: o.createdAt.toISOString().split('T')[0],
      amount: o.totalAmount,
      status: o.status,
      items: o.items.length
    }));
  }

  async getOutletVisits(organizationId: string, outletCode: string): Promise<Outlet360Visit[]> {
    const outlet = await this.getOutletByCode(outletCode);
    const visits = await this.visitModel.find({ outlet: outlet._id }).populate('user', 'name').sort({ checkInTime: -1 });

    return visits.map(v => ({
      date: v.checkInTime.toISOString().split('T')[0],
      rep: v.user?.name || 'Unknown Rep',
      duration: '15 mins', // Simplified duration
      order: 0,
      verified: true
    }));
  }
}
