import { Injectable } from '@nestjs/common';
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
    
    // Seed for demo if empty
    if (records.length === 0) {
      const defaults = [
        { id: 'APP-1001', organizationId, outlet: 'Supermart', order: 'ORD-5001', type: 'Credit Limit', reason: 'Order exceeds current credit limit by ₹5,000', amount: 5000, priority: 'High' as const, requestedBy: 'Amit Patel', date: '2024-03-15', status: 'Pending' as const },
        { id: 'APP-1002', organizationId, outlet: 'Kirana Store', order: 'ORD-5002', type: 'Discount', reason: 'Requested 15% discount for bulk order', amount: 2500, priority: 'Medium' as const, requestedBy: 'Rahul Singh', date: '2024-03-14', status: 'Approved' as const },
      ];
      await this.approvalModel.insertMany(defaults);
      const newRecords = await this.approvalModel.find({ organizationId }).exec();
      return newRecords.map(doc => ({
        id: doc.id,
        organizationId: doc.organizationId,
        outlet: doc.outlet,
        order: doc.order,
        type: doc.type,
        reason: doc.reason,
        amount: doc.amount,
        priority: doc.priority,
        requestedBy: doc.requestedBy,
        date: doc.date,
        status: doc.status
      }));
    }

    return records.map(doc => ({
      id: doc.id,
      organizationId: doc.organizationId,
      outlet: doc.outlet,
      order: doc.order,
      type: doc.type,
      reason: doc.reason,
      amount: doc.amount,
      priority: doc.priority,
      requestedBy: doc.requestedBy,
      date: doc.date,
      status: doc.status
    }));
  }

  async findAllRules(organizationId: string): Promise<SharedRule[]> {
    const records = await this.ruleModel.find({ organizationId }).exec();
    
    if (records.length === 0) {
      const defaults = [
        { organizationId, trigger: 'Order Value > ₹50,000', approver: 'Regional Manager', enabled: true },
        { organizationId, trigger: 'Discount > 10%', approver: 'Sales Head', enabled: true },
        { organizationId, trigger: 'Credit Limit Exceeded', approver: 'Finance Team', enabled: true },
        { organizationId, trigger: 'New Distributor Onboarding', approver: 'Director', enabled: false },
      ];
      await this.ruleModel.insertMany(defaults);
      const newRecords = await this.ruleModel.find({ organizationId }).exec();
      return newRecords.map(doc => ({
        organizationId: doc.organizationId,
        trigger: doc.trigger,
        approver: doc.approver,
        enabled: doc.enabled
      }));
    }

    return records.map(doc => ({
      organizationId: doc.organizationId,
      trigger: doc.trigger,
      approver: doc.approver,
      enabled: doc.enabled
    }));
  }
}
