import { NotFoundException } from '../core/http-errors';
import { Model } from 'mongoose';
import { Approval } from '../schemas/approval.schema';
import { ApprovalRule } from '../schemas/approval-rule.schema';
import { Approval as SharedApproval, ApprovalRule as SharedRule } from '@bharatsales/shared-types';

// Build a $set document from an allow-list of fields, each coerced to its
// primitive type, so a request body can never smuggle a Mongo operator or a
// nested object into an update (the routes' zod schemas already restrict the
// shape; this keeps the service safe on its own).
function pickStrings(data: any, fields: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!data || typeof data !== 'object') return out;
  for (const field of fields) {
    const value = data[field];
    if (value !== undefined && value !== null) out[field] = String(value);
  }
  return out;
}

function approvalUpdate(data: any): Record<string, string> {
  return pickStrings(data, ['status', 'reason', 'priority']);
}

function ruleUpdate(data: any): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = pickStrings(data, ['trigger', 'approver']);
  if (data && typeof data === 'object' && data.enabled !== undefined && data.enabled !== null) {
    out.enabled = data.enabled === true || data.enabled === 'true';
  }
  return out;
}

export class ApprovalsService {
  constructor(
    private approvalModel: Model<Approval>,
    private ruleModel: Model<ApprovalRule>,
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
      { _id: String(id), organizationId },
      { $set: approvalUpdate(data) },
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
      { _id: String(id), organizationId },
      { $set: ruleUpdate(data) },
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
