import { Logger } from '../core/logger';
import { BadRequestException, ForbiddenException, NotFoundException } from '../core/http-errors';
import type { HierarchyService } from '../hierarchy/hierarchy.service';
import { Model } from 'mongoose';
import { IncentivePlan, IncentivePayout } from '@bharatsales/shared-types';

export class IncentivesService {
  private readonly logger = new Logger(IncentivesService.name);

  constructor(
    private planModel: Model<IncentivePlan>,
    private payoutModel: Model<IncentivePayout>,
    // Needed to limit Sales Managers to their own team.
    private hierarchyService?: HierarchyService,
  ) {}

  private static isAdmin(user?: any): boolean {
    return !user || ['Super Admin', 'Organization Admin'].includes(user.role);
  }

  async getIncentivePlans(organizationId: string): Promise<IncentivePlan[]> {
    return this.planModel.find({ organizationId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Admins see every payout; a Sales Manager sees their team's; anyone else
   * (e.g. a Sales Representative) sees only their own.
   */
  async getIncentivePayouts(organizationId: string, user?: any): Promise<IncentivePayout[]> {
    const query: any = { organizationId };
    if (!IncentivesService.isAdmin(user)) {
      if (user.role === 'Sales Manager' && this.hierarchyService) {
        const team = await this.hierarchyService.getTeamUserIds(organizationId, user.sub);
        query.rep = { $in: [...team.map(String), String(user.sub)] };
      } else {
        query.rep = String(user.sub);
      }
    }
    return this.payoutModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async createIncentivePlan(organizationId: string, data: Partial<IncentivePlan>): Promise<IncentivePlan> {
    const newPlan = new this.planModel({
      ...data,
      organizationId,
      status: data.status || 'Active',
    });
    return newPlan.save();
  }

  /**
   * Payouts always start Pending (Approved/Paid only through
   * updatePayoutStatus, Organization Admin). A non-admin may only propose a
   * payout for a rep on their own team, never for themselves.
   */
  async createIncentivePayout(organizationId: string, data: Partial<IncentivePayout>, user?: any): Promise<IncentivePayout> {
    if (!IncentivesService.isAdmin(user)) {
      const rep = String(data.rep ?? '');
      if (rep === String(user.sub)) {
        throw new ForbiddenException('You cannot create an incentive payout for yourself');
      }
      const team = this.hierarchyService ? await this.hierarchyService.getTeamUserIds(organizationId, user.sub) : [];
      if (!team.map(String).includes(rep)) {
        throw new ForbiddenException('Payouts can only be created for representatives on your team');
      }
    }
    const { status: _ignored, ...rest } = data as any;
    const newPayout = new this.payoutModel({
      ...rest,
      organizationId,
      status: 'Pending',
    });
    return newPayout.save();
  }

  /** Pending -> Approved -> Paid. Organization Admin only (enforced by the route). */
  async updatePayoutStatus(organizationId: string, id: string, status: 'Approved' | 'Paid'): Promise<IncentivePayout> {
    const payout: any = await this.payoutModel.findOne({ _id: id, organizationId }).exec();
    if (!payout) throw new NotFoundException('Incentive payout not found');
    const allowed: Record<string, string[]> = { Pending: ['Approved'], Approved: ['Paid'], Paid: [] };
    if (!(allowed[payout.status] || []).includes(status)) {
      throw new BadRequestException(`Cannot change payout status from ${payout.status} to ${status}`);
    }
    payout.status = status;
    return payout.save();
  }
}
