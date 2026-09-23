import { Model, isValidObjectId } from 'mongoose';
import { Report, ReportStats, Order, Outlet, ReportJob, ScheduledReport } from '@bharatsales/shared-types';
import { randomUUID } from 'crypto';
import { Logger } from '../core/logger';
import { ForbiddenException, NotFoundException, ConflictException } from '../core/http-errors';
import type { HierarchyService } from '../hierarchy/hierarchy.service';

// The caller's identity as put on req.user by `authenticate`.
export interface ReportUser {
  sub: string;
  role: string;
  distributorId?: string;
}

// Resolved data scope for one report run.
// Stored job document: the shared type plus who requested it.
type ReportJobRecord = ReportJob & { requestedBy?: string };

type ReportScope =
  | { kind: 'org' }
  | { kind: 'distributor'; distributorId: string }
  | { kind: 'users'; userIds: string[] };

/** One CSV field: quoted when it contains a comma, quote or newline. */
function csvCell(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function isoDateTime(value: unknown): string {
  if (!value) return '';
  const d = new Date(value as any);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

function isoDate(value: unknown): string {
  return isoDateTime(value).slice(0, 10);
}

export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private orderModel: Model<Order>,
    private outletModel: Model<Outlet>,
    private reportJobModel: Model<ReportJobRecord>,
    private scheduledReportModel: Model<ScheduledReport>,
    // Optional: used to resolve a Sales Manager's team. Without it a Sales
    // Manager is scoped to their own records only (never widened to the org).
    private hierarchyService?: HierarchyService,
  ) {}

  private predefinedReports: Report[] = [
    { id: 'rep-01', organizationId: '', name: 'Order Report', desc: 'Daily sales orders', category: 'Sales', lastRun: '-', status: 'Ready' },
    { id: 'rep-02', organizationId: '', name: 'Attendance Report', desc: 'User attendance', category: 'HR', lastRun: '-', status: 'Ready' },
    { id: 'rep-03', organizationId: '', name: 'Visits Report', desc: 'Outlet visits', category: 'Execution', lastRun: '-', status: 'Ready' },
    { id: 'rep-04', organizationId: '', name: 'Inventory Report', desc: 'Stock levels', category: 'Supply Chain', lastRun: '-', status: 'Ready' },
    { id: 'rep-05', organizationId: '', name: 'Dispatch Report', desc: 'Dispatch records', category: 'Supply Chain', lastRun: '-', status: 'Ready' },
    { id: 'rep-06', organizationId: '', name: 'Delivery Report', desc: 'Delivery records', category: 'Supply Chain', lastRun: '-', status: 'Ready' },
    { id: 'rep-07', organizationId: '', name: 'Returns Report', desc: 'Return orders', category: 'Returns', lastRun: '-', status: 'Ready' },
    { id: 'rep-08', organizationId: '', name: 'Claims Report', desc: 'Claims records', category: 'Claims', lastRun: '-', status: 'Ready' },
    { id: 'rep-09', organizationId: '', name: 'Collections Report', desc: 'Payment collections', category: 'Finance', lastRun: '-', status: 'Ready' },
    { id: 'rep-10', organizationId: '', name: 'Outstanding Report', desc: 'Outstanding balances', category: 'Finance', lastRun: '-', status: 'Ready' },
    { id: 'rep-11', organizationId: '', name: 'Targets Report', desc: 'Target achievements', category: 'Performance', lastRun: '-', status: 'Ready' },
    { id: 'rep-12', organizationId: '', name: 'Audit Report', desc: 'Audit logs', category: 'Audit', lastRun: '-', status: 'Ready' },
  ];

  private static readonly DISTRIBUTOR_CATEGORIES = ['Supply Chain', 'Returns', 'Finance'];

  // Reports whose rows are per-user (attributable to a rep) and can therefore
  // be scoped to "own data" (Sales Representative) or "team data" (Sales Manager).
  private static readonly USER_SCOPED_REPORT_IDS = ['rep-01', 'rep-02', 'rep-03', 'rep-08', 'rep-09', 'rep-11'];

  // Which predefined reports a role may list/run. Organization Admin (and
  // internal callers with no role) get everything; unknown roles get nothing.
  private allowedReportsFor(role?: string): Report[] {
    if (!role || role === 'Organization Admin') return this.predefinedReports;
    if (role === 'Distributor') {
      return this.predefinedReports.filter(r => ReportsService.DISTRIBUTOR_CATEGORIES.includes(r.category));
    }
    if (role === 'Sales Manager' || role === 'Sales Representative') {
      return this.predefinedReports.filter(r => ReportsService.USER_SCOPED_REPORT_IDS.includes(r.id));
    }
    return [];
  }

  async getReports(organizationId: string, role?: string): Promise<Report[]> {
    return this.allowedReportsFor(role).map(r => ({ ...r, organizationId }));
  }

  async getReportStats(organizationId: string): Promise<ReportStats> {
    const totalOrders = await this.orderModel.countDocuments({ organizationId });
    const scheduled = await this.scheduledReportModel.countDocuments({ organizationId, status: 'Active' });
    const pendingExport = await this.reportJobModel.countDocuments({ organizationId, status: 'Processing' });
    
    return {
      total: this.predefinedReports.length,
      scheduled,
      generatedToday: totalOrders > 0 ? 1 : 0, // Mocked for now
      pendingExport
    };
  }

  async scheduleReport(organizationId: string, payload: any): Promise<ScheduledReport> {
    const newSchedule = new this.scheduledReportModel({
      organizationId,
      name: payload.report,
      frequency: payload.frequency,
      time: payload.time,
      recipients: payload.recipients,
      format: payload.format,
      status: 'Active'
    });
    return newSchedule.save();
  }

  async getSchedules(organizationId: string): Promise<ScheduledReport[]> {
    return this.scheduledReportModel.find({ organizationId }).exec();
  }

  async runReport(organizationId: string, payload: any, user?: ReportUser): Promise<{ jobId: string }> {
    const key = payload?.reportId || payload?.reportName;
    if (user) {
      const allowed = this.allowedReportsFor(user.role);
      if (!allowed.some(r => r.id === key || r.name === key)) {
        throw new ForbiddenException(`Role ${user.role} may not run report "${key}"`);
      }
    }
    const scope = await this.resolveScope(organizationId, user);

    const jobId = `job-${randomUUID()}`;
    await this.reportJobModel.create({
      organizationId,
      jobId,
      status: 'Processing',
      progress: 0,
      requestedBy: user?.sub,
    });

    this.generateReportAsync(organizationId, payload, jobId, scope).catch(async err => {
      this.logger.error(`Report generation failed for ${jobId}`, err);
      await this.reportJobModel.updateOne({ jobId }, { status: 'Failed', error: err.message });
    });

    return { jobId };
  }

  // Same per-role scoping as the list endpoints: Distributor → own
  // distributorId; Sales Representative → own records; Sales Manager → self +
  // team reps resolved through the hierarchy; Organization Admin → whole org.
  private async resolveScope(organizationId: string, user?: ReportUser): Promise<ReportScope> {
    if (!user || user.role === 'Organization Admin') return { kind: 'org' };
    if (user.role === 'Distributor') {
      return { kind: 'distributor', distributorId: user.distributorId || '__none__' };
    }
    if (user.role === 'Sales Manager') {
      const team = this.hierarchyService
        ? await this.hierarchyService.getTeamUserIds(organizationId, user.sub)
        : [];
      return { kind: 'users', userIds: [...new Set([user.sub, ...team])] };
    }
    return { kind: 'users', userIds: [user.sub] };
  }

  private async distributorOrderRefs(organizationId: string, distributorId: string) {
    const orders = await this.orderModel
      .find({ organizationId, assignedDistributorId: distributorId })
      .select('_id outletId')
      .exec();
    return {
      orderIds: orders.map((o: any) => o._id.toString()),
      outletIds: [...new Set(orders.map((o: any) => o.outletId).filter(Boolean))] as string[],
    };
  }

  // Filter for per-user reports; `field` is the model's user reference.
  private userFilter(scope: ReportScope, field: string): Record<string, any> {
    return scope.kind === 'users' ? { [field]: { $in: scope.userIds } } : {};
  }

  private async generateReportAsync(organizationId: string, payload: any, jobId: string, scope: ReportScope = { kind: 'org' }) {
    await this.reportJobModel.updateOne({ jobId }, { progress: 20 });
    const db = this.orderModel.db;
    let rows: string[][] = [];
    const distributorId = scope.kind === 'distributor' ? scope.distributorId : undefined;

    switch (payload.reportId || payload.reportName) {
      case 'rep-01':
      case 'Order Report': {
        const query: any = { organizationId, ...this.userFilter(scope, 'createdByUserId') };
        if (distributorId) query.assignedDistributorId = distributorId;
        const data = await this.orderModel.find(query).exec();

        // Batch-load outlet names in a single $in query instead of one
        // findById per order.
        const outletIds = [...new Set(
          data
            .map((r: any) => (r.outletId && typeof r.outletId === 'object' ? r.outletId._id : r.outletId))
            .filter((id: any) => id && isValidObjectId(id))
            .map((id: any) => id.toString()),
        )];
        const outlets = outletIds.length
          ? await this.outletModel.find({ _id: { $in: outletIds } }).select('name').exec()
          : [];
        const outletNames = new Map<string, string>(outlets.map((o: any) => [o._id.toString(), o.name]));

        const creatorIds = [...new Set(data.map((r: any) => r.createdByUserId?.toString()).filter((id: any) => id && isValidObjectId(id)))];
        const creators = creatorIds.length
          ? await db.model('User').find({ _id: { $in: creatorIds } }).select('name').exec()
          : [];
        const creatorNames = new Map<string, string>(creators.map((u: any) => [u._id.toString(), u.name]));

        rows = [['Order ID', 'Date', 'Outlet Name', 'Status', 'Grand Total', 'Created By']];
        for (const r of data as any[]) {
          const outletKey = r.outletId && typeof r.outletId === 'object' ? r.outletId._id?.toString() : r.outletId?.toString();
          const outletName = (outletKey && outletNames.get(outletKey)) || 'Unknown Outlet';
          rows.push([ r.orderNumber || r._id.toString(), new Date(r.createdAt as any).toISOString().split('T')[0], outletName, r.status, (r.totals?.grandTotal || 0).toString(), creatorNames.get(r.createdByUserId?.toString()) || r.createdByUserId || 'System' ]);
        }
        break;
      }
      case 'rep-02':
      case 'Attendance Report': {
        // Attendance is stored as AttendanceSession documents (one per shift).
        const model = db.model('AttendanceSession');
        const data = await model.find({ organizationId, ...this.userFilter(scope, 'user') }).sort({ startTime: -1 }).exec();
        rows = [['Date', 'User ID', 'Start Time', 'End Time', 'Status']];
        data.forEach((r: any) => rows.push([isoDate(r.startTime), String(r.user ?? ''), isoDateTime(r.startTime), isoDateTime(r.endTime), r.status]));
        break;
      }
      case 'rep-03':
      case 'Visits Report': {
        const model = db.model('Visit');
        const data = await model.find({ organizationId, ...this.userFilter(scope, 'user') }).exec();
        rows = [['Visit ID', 'Outlet ID', 'User ID', 'Productive', 'Status']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.outlet, r.user, r.isProductive ? 'Yes' : 'No', r.status]));
        break;
      }
      case 'rep-04':
      case 'Inventory Report': {
        const model = db.model('Inventory');
        const query: any = { organizationId };
        if (distributorId) query.distributorId = distributorId;
        const data = await model.find(query).exec();
        rows = [['Product ID', 'Batch', 'Quantity', 'Status']];
        data.forEach((r: any) => rows.push([r.productId, r.batch, String(r.stock ?? 0), r.status]));
        break;
      }
      case 'rep-05':
      case 'Dispatch Report': {
        const model = db.model('Dispatch');
        const query: any = { organizationId };
        if (distributorId) query.assignedDistributorId = distributorId;
        const data = await model.find(query).exec();
        rows = [['Dispatch ID', 'Order ID', 'Status', 'Driver']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.orderId, r.status, r.driver || '']));
        break;
      }
      case 'rep-06':
      case 'Delivery Report': {
        // There is no separate Delivery model: a delivery is a Dispatch whose
        // delivery has been confirmed (DispatchService.confirmDelivery).
        const model = db.model('Dispatch');
        const query: any = { organizationId, 'deliveredItems.0': { $exists: true } };
        if (distributorId) query.assignedDistributorId = distributorId;
        const data = await model.find(query).exec();
        rows = [['Delivery ID', 'Dispatch ID', 'Status']];
        data.forEach((r: any) => rows.push([r._id.toString(), r._id.toString(), r.status]));
        break;
      }
      case 'rep-07':
      case 'Returns Report': {
        const model = db.model('ReturnOrder');
        const query: any = { organizationId };
        if (distributorId) {
          const { orderIds } = await this.distributorOrderRefs(organizationId, distributorId);
          query.orderId = { $in: orderIds };
        }
        const data = await model.find(query).exec();
        rows = [['Return ID', 'Order ID', 'Outlet ID', 'Status', 'Value']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.orderId || '', r.outlet, r.status, r.value]));
        break;
      }
      case 'rep-08':
      case 'Claims Report': {
        const model = db.model('Claim');
        const data = await model.find({ organizationId, ...this.userFilter(scope, 'submittedByUserId') }).exec();
        rows = [['Claim ID', 'Type', 'Amount', 'Status']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.type, String(r.amount ?? 0), r.status]));
        break;
      }
      case 'rep-09':
      case 'Collections Report': {
        const model = db.model('Collection');
        const query: any = { organizationId, ...this.userFilter(scope, 'collectedByUserId') };
        if (distributorId) {
          // Collections have no distributorId — derive the distributor's
          // outlet-set via the orders routed to them (as CollectionsService does).
          const { outletIds } = await this.distributorOrderRefs(organizationId, distributorId);
          query.outletId = { $in: outletIds };
        }
        const data = await model.find(query).exec();
        rows = [['Collection ID', 'Outlet ID', 'Amount', 'Mode', 'Status']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.outletId, String(r.amount ?? 0), r.paymentMode, r.status]));
        break;
      }
      case 'rep-10':
      case 'Outstanding Report': {
        const query: any = { organizationId };
        if (distributorId) query['commercial.assignedDistributorId'] = distributorId;
        const data = await this.outletModel.find(query).exec();
        rows = [['Outlet ID', 'Name', 'Outstanding Balance', 'Credit Limit']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.name, r.commercial?.outstandingBalance?.toString() || '0', r.commercial?.creditLimit?.toString() || '0']));
        break;
      }
      case 'rep-11':
      case 'Targets Report': {
        const model = db.model('Target');
        const query: any = { organizationId };
        if (scope.kind === 'users') {
          query.entityType = 'User';
          query.entityId = { $in: scope.userIds };
        }
        const data = await model.find(query).exec();
        rows = [['Target ID', 'Entity Type', 'Entity ID', 'Metric', 'Target Value']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.entityType, r.entityId, r.targetMetric || 'SalesValue', String(r.targetValue ?? r.targetAmount ?? 0)]));
        break;
      }
      case 'rep-12':
      case 'Audit Report': {
        const model = db.model('AuditLog');
        const data = await model.find({ organizationId }).exec();
        rows = [['Audit ID', 'Entity', 'Action', 'User ID', 'Date']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.entityName, r.action, r.actorId, isoDateTime(r.createdAt)]));
        break;
      }
      default: {
        rows = [['Error'], ['No data available for this report type']];
      }
    }

    const csvData = rows.map(r => r.map(csvCell).join(',')).join('\n');
    await this.reportJobModel.updateOne(
      { jobId }, 
      { 
        status: 'Completed', 
        progress: 100, 
        data: csvData, 
        url: `/api/reports/exports/${jobId}` 
      }
    );
  }

  // A job is visible to whoever ran it; an Organization Admin may see any job
  // in their org. Someone else's job answers 404 so job ids cannot be probed.
  private async findOwnJob(organizationId: string, jobId: string, user?: ReportUser) {
    const job = await this.reportJobModel.findOne({ organizationId, jobId }).exec();
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    if (user && user.role !== 'Organization Admin' && job.requestedBy !== user.sub) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
    return job;
  }

  async getJobStatus(organizationId: string, jobId: string, user?: ReportUser): Promise<any> {
    const job = await this.findOwnJob(organizationId, jobId, user);
    return { status: job.status, progress: job.progress, url: job.url, error: job.error };
  }

  async getExport(organizationId: string, jobId: string, user?: ReportUser): Promise<any> {
    const job = await this.findOwnJob(organizationId, jobId, user);
    if (job.status !== 'Completed' || !job.data) throw new ConflictException(`Export for job ${jobId} is not ready`);
    return { data: job.data, filename: `Report_${jobId.substring(0, 8)}.csv`, contentType: 'text/csv' };
  }
}
