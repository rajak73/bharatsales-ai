import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Claim, ClaimStatus } from '@bharatsales/shared-types';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectModel('Claim') private claimModel: Model<Claim>
  ) {}

  async findAll(organizationId: string): Promise<Claim[]> {
    return this.claimModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  async findById(organizationId: string, id: string): Promise<Claim> {
    const claim = await this.claimModel.findOne({ _id: id, organizationId }).exec();
    if (!claim) {
      throw new NotFoundException(`Claim ${id} not found`);
    }
    return claim;
  }

  async create(organizationId: string, userId: string, data: Partial<Claim>): Promise<Claim> {
    const newClaim = new this.claimModel({
      ...data,
      organizationId,
      claimNumber: data.claimNumber || `CLM-${Date.now()}`,
      submittedByUserId: userId,
      status: 'Pending',
    });
    return newClaim.save();
  }

  async updateStatus(
    organizationId: string, 
    id: string, 
    status: ClaimStatus, 
    actorId: string,
    reason?: string
  ): Promise<Claim> {
    const claim = await this.findById(organizationId, id);
    
    if (claim.status !== 'Pending' && status !== 'Settled') {
       throw new BadRequestException(`Cannot transition claim from ${claim.status} to ${status}`);
    }

    claim.status = status;
    if (reason) claim.reason = reason;
    
    if (status === 'Approved' || status === 'Rejected') {
      claim.approvedByUserId = actorId;
      claim.approvedAt = new Date().toISOString();
    }

    return (claim as any).save();
  }
}
