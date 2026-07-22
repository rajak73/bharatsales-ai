import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Approval } from '../schemas/approval.schema';
import { ApprovalRule } from '../schemas/approval-rule.schema';
import { Approval as SharedApproval, ApprovalRule as SharedRule } from '@bharatsales/shared-types';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectModel(Approval.name) private approvalModel: Model<Approval>,
    @InjectModel(ApprovalRule.name) private ruleModel: Model<ApprovalRule>,
  ) {}

  async findAllApprovals(organizationId: string): Promise<SharedApproval[]> {
    const records = await this.approvalModel.find({ organizationId }).exec();

    return records.map(doc => ({
      id: doc.id,
      organizationId: doc.organizationId,
      outlet: doc.outlet,
      order: doc.order,
      type: doc.type,
      reason: doc.reason,
      amount: doc.amount,
      priority: doc.priority as 'High'|'Medium'|'Low',
      requestedBy: doc.requestedBy,
      date: doc.date,
      status: doc.status as 'Pending'|'Approved'|'Rejected'
    }));
  }

  async findAllRules(organizationId: string): Promise<SharedRule[]> {
    const records = await this.ruleModel.find({ organizationId }).exec();

    return records.map(doc => ({
      id: doc.id,
      organizationId: doc.organizationId,
      trigger: doc.trigger,
      approver: doc.approver,
      enabled: doc.enabled
    }));
  }

  // --- Approvals CRUD ---

  async createApproval(organizationId: string, data: any): Promise<Approval> {
    const approval = new this.approvalModel({
      ...data,
      organizationId,
      date: new Date().toISOString(),
      status: 'Pending'
    });
    return approval.save();
  }

  async updateApproval(organizationId: string, id: string, data: any): Promise<Approval> {
    const approval = await this.approvalModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    if (!approval) throw new NotFoundException('Approval not found');
    return approval;
  }

  async deleteApproval(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const approval = await this.approvalModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!approval) throw new NotFoundException('Approval not found');
    return { deleted: true };
  }

  // --- Approval Rules CRUD ---

  async createRule(organizationId: string, data: any): Promise<ApprovalRule> {
    const rule = new this.ruleModel({
      ...data,
      organizationId
    });
    return rule.save();
  }

  async updateRule(organizationId: string, id: string, data: any): Promise<ApprovalRule> {
    const rule = await this.ruleModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true }
    ).exec();
    if (!rule) throw new NotFoundException('Approval rule not found');
    return rule;
  }

  async deleteRule(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const rule = await this.ruleModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!rule) throw new NotFoundException('Approval rule not found');
    return { deleted: true };
  }
}
