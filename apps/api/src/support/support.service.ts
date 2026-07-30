import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SupportTicket } from '../schemas/support-ticket.schema';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel('SupportTicket') private ticketModel: Model<SupportTicket>,
  ) {}

  async create(organizationId: string, raisedByUserId: string, data: { subject: string; message: string; priority?: string }) {
    const ticket = new this.ticketModel({
      organizationId,
      raisedByUserId,
      subject: data.subject,
      message: data.message,
      priority: data.priority || 'Medium',
      status: 'Open'
    });
    return ticket.save();
  }

  async findAllForOrg(organizationId: string) {
    return this.ticketModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  // Cross-tenant view for the Super Admin Support console — deliberately
  // unscoped, mirroring the same precedent as AuditService.getGlobalLogs().
  async findAllGlobal() {
    return this.ticketModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateStatus(id: string, status: string) {
    const ticket = await this.ticketModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }
}
