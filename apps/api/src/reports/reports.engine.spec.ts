import { ReportsService } from './reports.service';

describe('ReportsService Engine', () => {
  let service: ReportsService;

  const mockOrderModel = {
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([
      {
        _id: 'order-1',
        orderNumber: 'ORD-001',
        createdAt: '2023-10-01T10:00:00.000Z',
        outletId: '64b000000000000000000001',
        status: 'Delivered',
        totals: { grandTotal: 5000 },
        createdByUserId: 'user-1'
      }
    ]),
    countDocuments: jest.fn().mockResolvedValue(1)
  };

  // Outlet names are now batch-loaded with a single find({ _id: { $in } }).
  const mockOutletModel = {
    find: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([{ _id: '64b000000000000000000001', name: 'Test Outlet' }])
  };

  let mockReportJobModel: any;

  beforeEach(async () => {
    mockReportJobModel = {
      create: jest.fn().mockResolvedValue({}),
      updateOne: jest.fn().mockResolvedValue({}),
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ status: 'Completed', data: 'ORD-001,Test Outlet,5000' })
      })
    };
    service = new ReportsService(mockOrderModel as any, mockOutletModel as any, mockReportJobModel, {} as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('batch-loads outlet names with one $in query instead of a findById per order', async () => {
    await service.runReport('org-1', { reportId: 'rep-01' });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(mockOutletModel.find).toHaveBeenCalledTimes(1);
    expect(mockOutletModel.find).toHaveBeenCalledWith({ _id: { $in: ['64b000000000000000000001'] } });
    const csv = mockReportJobModel.updateOne.mock.calls.find((c: any[]) => c[1].status === 'Completed')[1].data;
    expect(csv).toContain('Test Outlet');
  });

  describe('runReport role scoping', () => {
    it('rejects a Distributor running a report outside their categories', async () => {
      await expect(
        service.runReport('org-1', { reportName: 'Order Report' }, { sub: 'u1', role: 'Distributor', distributorId: 'd1' })
      ).rejects.toThrow(/may not run report/);
    });

    it('scopes a Sales Representative order report to their own orders', async () => {
      await service.runReport('org-1', { reportId: 'rep-01' }, { sub: 'rep-1', role: 'Sales Representative' });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockOrderModel.find).toHaveBeenCalledWith({ organizationId: 'org-1', createdByUserId: { $in: ['rep-1'] } });
    });

    it('scopes a Sales Manager order report to self + hierarchy team', async () => {
      const hierarchy = { getTeamUserIds: jest.fn().mockResolvedValue(['rep-1', 'rep-2']) };
      const scoped = new ReportsService(mockOrderModel as any, mockOutletModel as any, mockReportJobModel, {} as any, hierarchy as any);
      await scoped.runReport('org-1', { reportId: 'rep-01' }, { sub: 'mgr-1', role: 'Sales Manager' });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(hierarchy.getTeamUserIds).toHaveBeenCalledWith('org-1', 'mgr-1');
      expect(mockOrderModel.find).toHaveBeenCalledWith({ organizationId: 'org-1', createdByUserId: { $in: ['mgr-1', 'rep-1', 'rep-2'] } });
    });

    it('rejects a Sales Manager running the org-wide Audit Report', async () => {
      await expect(
        service.runReport('org-1', { reportId: 'rep-12' }, { sub: 'mgr-1', role: 'Sales Manager' })
      ).rejects.toThrow(/may not run report/);
    });
  });

  it('should generate real CSV data from MongoDB rather than returning hardcoded strings', async () => {
    const { jobId } = await service.runReport('org-1', { reportId: 'rep-01' });

    // Give it a tiny tick to resolve the fire-and-forget promise
    await new Promise(resolve => setTimeout(resolve, 50));

    const exportData = await service.getExport('org-1', jobId);

    expect(exportData.data).toContain('ORD-001');
    expect(exportData.data).toContain('Test Outlet');
    expect(exportData.data).toContain('5000');
    expect(exportData.data).not.toContain('Outlet A'); // Ensure hardcoded mock is gone
  });

  describe('job ownership', () => {
    const jobOwnedBy = (requestedBy?: string) =>
      mockReportJobModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ status: 'Completed', data: 'csv', requestedBy }),
      });

    it('records who requested the job', async () => {
      await service.runReport('org-1', { reportId: 'rep-01' }, { sub: 'rep-1', role: 'Sales Representative' });
      expect(mockReportJobModel.create).toHaveBeenCalledWith(expect.objectContaining({ requestedBy: 'rep-1' }));
    });

    it('lets the requester download their export and check its status', async () => {
      jobOwnedBy('rep-1');
      const user = { sub: 'rep-1', role: 'Sales Representative' };
      await expect(service.getExport('org-1', 'job-1', user)).resolves.toMatchObject({ data: 'csv' });
      await expect(service.getJobStatus('org-1', 'job-1', user)).resolves.toMatchObject({ status: 'Completed' });
    });

    it("hides another user's job (404) from a non-admin in the same org", async () => {
      jobOwnedBy('rep-1');
      const other = { sub: 'rep-2', role: 'Sales Manager' };
      await expect(service.getExport('org-1', 'job-1', other)).rejects.toMatchObject({ status: 404 });
      await expect(service.getJobStatus('org-1', 'job-1', other)).rejects.toMatchObject({ status: 404 });
    });

    it('lets an Organization Admin download any job in their org', async () => {
      jobOwnedBy('rep-1');
      await expect(service.getExport('org-1', 'job-1', { sub: 'admin-1', role: 'Organization Admin' })).resolves.toMatchObject({ data: 'csv' });
    });

    it('answers 404 for a missing job and 409 for one still processing', async () => {
      mockReportJobModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.getExport('org-1', 'nope')).rejects.toMatchObject({ status: 404 });
      mockReportJobModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ status: 'Processing', requestedBy: 'rep-1' }) });
      await expect(service.getExport('org-1', 'job-1', { sub: 'rep-1', role: 'Sales Representative' })).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('getReports category restriction', () => {
    it('should return every report category for a non-Distributor role', async () => {
      const reports = await service.getReports('org-1', 'Organization Admin');
      expect(reports.some(r => r.category === 'HR')).toBe(true);
      expect(reports.some(r => r.category === 'Sales')).toBe(true);
    });

    it('should restrict a Distributor to Supply Chain, Returns, and Finance categories server-side regardless of caller intent', async () => {
      const reports = await service.getReports('org-1', 'Distributor');
      const categories = new Set(reports.map(r => r.category));
      expect(categories).toEqual(new Set(['Supply Chain', 'Returns', 'Finance']));
      expect(reports.some(r => r.category === 'HR')).toBe(false);
    });
  });
});
