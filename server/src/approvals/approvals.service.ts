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

  // Set by the container once OrdersService exists (OrdersService itself
  // depends on this service, so it can't be a constructor argument).
  private onDecision?: (organizationId: string, orderNumber: string, decision: 'Approved' | 'Rejected', actorId: string, reason?: string) => Promise<void>;

  setDecisionHandler(handler: NonNullable<ApprovalsService['onDecision']>): void {
    this.onDecision = handler;
  }

  /** Marks every still-Pending request for this order as decided. */
  async settlePendingForOrder(organizationId: string, orderNumber: string, status: 'Approved' | 'Rejected'): Promise<void> {
    await this.approvalModel.updateMany(
      { organizationId, order: String(orderNumber), status: 'Pending' },
      { $set: { status } },
    ).exec();
  }

  async updateApproval(organizationId: string, id: string, data: any, actorId?: string): Promise<Approval> {
    const update = approvalUpdate(data);
    const existing = await this.approvalModel.findOne({ _id: String(id), organizationId }).exec();
    if (!existing) throw new NotFoundException('Approval not found');
    // Deciding a request acts on the order it was raised for; otherwise the
    // order would sit in Pending_Approval until the cleanup job cancels it.
    const decision = update.status;
    if (
      this.onDecision && existing.order && existing.status === 'Pending' &&
      (decision === 'Approved' || decision === 'Rejected')
    ) {
      await this.onDecision(organizationId, existing.order, decision, actorId || '', update.reason);
    }
    const approval = await this.approvalModel.findOneAndUpdate(
      { _id: String(id), organizationId },
      { $set: update },
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
