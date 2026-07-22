import { Injectable } from '@nestjs/common';
import { Report, ReportStats } from '@bharatsales/shared-types';

@Injectable()
export class ReportsService {
  
  // Standard hardcoded predefined reports for MVP
  private predefinedReports: Report[] = [
    {
      id: 'rep-01',
      organizationId: '',
      name: 'Daily Sales Summary',
      desc: 'Aggregated daily sales by region and outlet.',
      category: 'Sales',
      lastRun: 'Today, 08:00 AM',
      status: 'Ready'
    },
    {
      id: 'rep-02',
      organizationId: '',
      name: 'Monthly Collection Target',
      desc: 'Collections vs Monthly Targets.',
      category: 'Finance',
      lastRun: 'Yesterday',
      status: 'Ready'
    },
    {
      id: 'rep-03',
      organizationId: '',
      name: 'Outlet Activity Report',
      desc: 'Visits and orders per outlet.',
      category: 'Execution',
      lastRun: '2 days ago',
      status: 'Ready'
    },
    {
      id: 'rep-04',
      organizationId: '',
      name: 'Inventory Valuation',
      desc: 'Current stock count and valuation.',
      category: 'Inventory',
      lastRun: 'Today, 06:00 AM',
      status: 'Ready'
    }
  ];

  async getReports(organizationId: string): Promise<Report[]> {
    return this.predefinedReports.map(r => ({ ...r, organizationId }));
  }

  async getReportStats(organizationId: string): Promise<ReportStats> {
    return {
      total: this.predefinedReports.length,
      scheduled: 2,
      generatedToday: 1,
      pendingExport: 0
    };
  }

  // Simulated Async Reporting Jobs
  private reportJobs = new Map<string, { status: string, progress: number, url?: string }>();

  async runReport(organizationId: string, payload: any): Promise<{ jobId: string }> {
    const jobId = `job-${Date.now()}`;
    this.reportJobs.set(jobId, { status: 'Processing', progress: 0 });

    // Simulate background processing
    setTimeout(() => {
      const job = this.reportJobs.get(jobId);
      if (job) {
        job.progress = 50;
      }
    }, 1000);

    setTimeout(() => {
      const job = this.reportJobs.get(jobId);
      if (job) {
        job.status = 'Completed';
        job.progress = 100;
        job.url = `/api/reports/exports/${jobId}`;
      }
    }, 3000);

    return { jobId };
  }

  async getJobStatus(organizationId: string, jobId: string): Promise<any> {
    const job = this.reportJobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    return job;
  }

  async getExport(organizationId: string, jobId: string): Promise<any> {
    const job = this.reportJobs.get(jobId);
    if (!job || job.status !== 'Completed') {
      throw new Error(`Export for job ${jobId} is not ready`);
    }
    
    // Generate real CSV data (basic example)
    const csvContent = [
      ['Date', 'Outlet', 'Order Total', 'Status'],
      ['2023-10-01', 'Outlet A', '500', 'Delivered'],
      ['2023-10-02', 'Outlet B', '1200', 'Pending']
    ].map(e => e.join(',')).join('\n');

    return {
      data: csvContent,
      filename: `${jobId}.csv`,
      contentType: 'text/csv',
    };
  }
}
