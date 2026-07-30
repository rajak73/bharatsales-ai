import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportStats, Order, Outlet, ReportJob, ScheduledReport } from '@bharatsales/shared-types';
import { randomUUID } from 'crypto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Outlet') private outletModel: Model<Outlet>,
    @InjectModel('ReportJob') private reportJobModel: Model<ReportJob>,
    @InjectModel('ScheduledReport') private scheduledReportModel: Model<ScheduledReport>
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

  async getReports(organizationId: string, role?: string): Promise<Report[]> {
    const reports = this.predefinedReports.map(r => ({ ...r, organizationId }));
    if (role === 'Distributor') {
      return reports.filter(r => ReportsService.DISTRIBUTOR_CATEGORIES.includes(r.category));
    }
    return reports;
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

  async runReport(organizationId: string, payload: any): Promise<{ jobId: string }> {
    const jobId = `job-${randomUUID()}`;
    await this.reportJobModel.create({
      organizationId,
      jobId,
      status: 'Processing',
      progress: 0
    });

    this.generateReportAsync(organizationId, payload, jobId).catch(async err => {
      this.logger.error(`Report generation failed for ${jobId}`, err);
      await this.reportJobModel.updateOne({ jobId }, { status: 'Failed', error: err.message });
    });

    return { jobId };
  }

  private async generateReportAsync(organizationId: string, payload: any, jobId: string) {
    await this.reportJobModel.updateOne({ jobId }, { progress: 20 });
    const db = this.orderModel.db;
    let rows: string[][] = [];

    switch (payload.reportId || payload.reportName) {
      case 'rep-01':
      case 'Order Report': {
        const data = await this.orderModel.find({ organizationId }).populate('outletId').exec();
        rows = [['Order ID', 'Date', 'Outlet Name', 'Status', 'Grand Total', 'Created By']];
        for (const r of data) {
          let outletName = 'Unknown Outlet';
          if (r.outletId) {
            const outletDoc = await this.outletModel.findById(r.outletId);
            if (outletDoc) outletName = outletDoc.name;
          }
          rows.push([ r.orderNumber || r._id.toString(), new Date(r.createdAt as any).toISOString().split('T')[0], outletName, r.status, (r.totals?.grandTotal || 0).toString(), r.createdByUserId || 'System' ]);
        }
        break;
      }
      case 'rep-02':
      case 'Attendance Report': {
        const model = db.model('Attendance');
        const data = await model.find({ organizationId }).exec();
        rows = [['Date', 'User ID', 'Start Time', 'End Time', 'Status']];
        data.forEach((r: any) => rows.push([r.date, r.user, r.startTime, r.endTime || '', r.status]));
        break;
      }
      case 'rep-03':
      case 'Visits Report': {
        const model = db.model('Visit');
        const data = await model.find({ organizationId }).exec();
        rows = [['Visit ID', 'Outlet ID', 'User ID', 'Productive', 'Status']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.outlet, r.user, r.isProductive ? 'Yes' : 'No', r.status]));
        break;
      }
      case 'rep-04':
      case 'Inventory Report': {
        const model = db.model('Inventory');
        const data = await model.find({ organizationId }).exec();
        rows = [['Product ID', 'Batch', 'Quantity', 'Status']];
        data.forEach((r: any) => rows.push([r.productId, r.batch, r.quantity.toString(), r.status]));
        break;
      }
      case 'rep-05':
      case 'Dispatch Report': {
        const model = db.model('Dispatch');
        const data = await model.find({ organizationId }).exec();
        rows = [['Dispatch ID', 'Order ID', 'Status', 'Driver']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.orderId, r.status, r.driverId || '']));
        break;
      }
      case 'rep-06':
      case 'Delivery Report': {
        const model = db.model('Delivery');
        const data = await model.find({ organizationId }).exec();
        rows = [['Delivery ID', 'Dispatch ID', 'Status']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.dispatchId, r.status]));
        break;
      }
      case 'rep-07':
      case 'Returns Report': {
        const model = db.model('ReturnOrder');
        const data = await model.find({ organizationId }).exec();
        rows = [['Return ID', 'Order ID', 'Outlet ID', 'Status', 'Value']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.orderId || '', r.outlet, r.status, r.value]));
        break;
      }
      case 'rep-08':
      case 'Claims Report': {
        const model = db.model('Claim');
        const data = await model.find({ organizationId }).exec();
        rows = [['Claim ID', 'Type', 'Amount', 'Status']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.type, r.amount.toString(), r.status]));
        break;
      }
      case 'rep-09':
      case 'Collections Report': {
        const model = db.model('Collection');
        const data = await model.find({ organizationId }).exec();
        rows = [['Collection ID', 'Outlet ID', 'Amount', 'Mode', 'Status']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.outlet, r.amount.toString(), r.mode, r.status]));
        break;
      }
      case 'rep-10':
      case 'Outstanding Report': {
        const data = await this.outletModel.find({ organizationId }).exec();
        rows = [['Outlet ID', 'Name', 'Outstanding Balance', 'Credit Limit']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.name, r.commercial?.outstandingBalance?.toString() || '0', r.commercial?.creditLimit?.toString() || '0']));
        break;
      }
      case 'rep-11':
      case 'Targets Report': {
        const model = db.model('Target');
        const data = await model.find({ organizationId }).exec();
        rows = [['Target ID', 'Entity Type', 'Entity ID', 'Metric', 'Target Value']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.entityType, r.entityId, r.targetMetric || 'SalesValue', r.targetValue.toString()]));
        break;
      }
      case 'rep-12':
      case 'Audit Report': {
        const model = db.model('AuditLog');
        const data = await model.find({ organizationId }).exec();
        rows = [['Audit ID', 'Entity', 'Action', 'User ID', 'Date']];
        data.forEach((r: any) => rows.push([r._id.toString(), r.entity, r.action, r.userId, r.createdAt]));
        break;
      }
      default: {
        rows = [['Error'], ['No data available for this report type']];
      }
    }

    const csvData = rows.map(r => r.join(',')).join('\n');
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

  async getJobStatus(organizationId: string, jobId: string): Promise<any> {
    const job = await this.reportJobModel.findOne({ organizationId, jobId }).exec();
    if (!job) throw new Error(`Job ${jobId} not found`);
    return { status: job.status, progress: job.progress, url: job.url, error: job.error };
  }

  async getExport(organizationId: string, jobId: string): Promise<any> {
    const job = await this.reportJobModel.findOne({ organizationId, jobId }).exec();
    if (!job || job.status !== 'Completed' || !job.data) throw new Error(`Export for job ${jobId} is not ready`);
    return { data: job.data, filename: `Report_${jobId.substring(0, 8)}.csv`, contentType: 'text/csv' };
  }
}
