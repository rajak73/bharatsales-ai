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
}
