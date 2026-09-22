import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockOrderModel = { find: jest.fn() };
  const mockCollectionModel = {};
  const mockVisitModel = { find: jest.fn().mockResolvedValue([]) };
  const mockUserModel = { find: jest.fn().mockResolvedValue([]), countDocuments: jest.fn().mockResolvedValue(0) };
  const mockOutletModel = { countDocuments: jest.fn().mockResolvedValue(0) };
  const mockTargetModel = {};
  const mockInventoryModel = {};

  beforeEach(async () => {
    service = new AnalyticsService(
      mockOrderModel as any,
      mockCollectionModel as any,
      mockVisitModel as any,
      mockUserModel as any,
      mockOutletModel as any,
      mockTargetModel as any,
      mockInventoryModel as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should compute revenueGrowth/orderGrowth as a real period-over-period comparison, not a hardcoded value', async () => {
    // Distinguish the "this month" query ($gte only) from the "previous month"
    // query ($gte + $lt) and the per-day salesData loop queries ($gte + $lte).
    const sortLimit = { sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) };
    mockOrderModel.find.mockImplementation((query: any) => {
      if (!query.createdAt) return sortLimit; // recentOrders (find({organizationId}).sort().limit())
      const dateQuery = query.createdAt;
      if (dateQuery.$lte) {
        return Promise.resolve([]); // 7-day sales chart loop — irrelevant here
      }
      if (dateQuery.$lt) {
        return Promise.resolve([{ totals: { grandTotal: 1000 }, items: [] }]); // previous month: 1000
      }
      return Promise.resolve([{ totals: { grandTotal: 1500 }, items: [] }]); // this month: 1500
    });

    const result: any = await service.getDashboardData('org1', { role: 'Organization Admin' });

    expect(result.kpis.revenueGrowth).toBe(50); // (1500-1000)/1000 * 100
    expect(result.kpis.revenueGrowth).not.toBe(12);
    expect(result.kpis.orderGrowth).not.toBe(8);
  });

  it('should not attribute revenue to a fabricated "North Zone" when no real zone data exists', async () => {
    const sortLimit2 = { sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) };
    mockOrderModel.find.mockImplementation((query: any) => {
      if (!query.createdAt) return sortLimit2;
      const dateQuery = query.createdAt;
      if (dateQuery.$lte || dateQuery.$lt) return Promise.resolve([]);
      return Promise.resolve([{ totals: { grandTotal: 500 }, items: [], createdByUserId: 'user1' }]);
    });

    const result: any = await service.getDashboardData('org1', { role: 'Organization Admin' });

    expect(result.zonePerformance.some((z: any) => z.zone === 'North Zone')).toBe(false);
    expect(result.zonePerformance.some((z: any) => z.zone === 'Unassigned')).toBe(true);
  });

  it('returns top products with catalogue names/SKUs instead of raw product ids', async () => {
    const pid = '6ab25742714d4cd1e93ba790';
    const sortLimit3 = { sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) };
    mockOrderModel.find.mockImplementation((query: any) => {
      if (!query.createdAt) return sortLimit3;
      if (query.createdAt.$lte || query.createdAt.$lt) return Promise.resolve([]);
      // A seeded/legacy line with no name snapshot and no line total.
      return Promise.resolve([{ totals: { grandTotal: 2400 }, items: [{ productId: pid, quantity: 50, unitPrice: 48 }] }]);
    });
    const exec = jest.fn().mockResolvedValue([{ _id: pid, name: 'Bharat Atta 5kg', sku: 'ATTA-5' }]);
    const mockProductModel = { find: jest.fn().mockReturnValue({ select: () => ({ lean: () => ({ exec }) }) }) };
    const withProducts = new AnalyticsService(
      mockOrderModel as any, mockCollectionModel as any, mockVisitModel as any, mockUserModel as any,
      mockOutletModel as any, mockTargetModel as any, mockInventoryModel as any, mockProductModel as any,
    );

    const result: any = await withProducts.getDashboardData('org1', { role: 'Organization Admin' });

    expect(mockProductModel.find).toHaveBeenCalledWith({ organizationId: 'org1', _id: { $in: [pid] } });
    expect(result.topProducts).toEqual([
      { name: 'Bharat Atta 5kg', sku: 'ATTA-5', productId: pid, sales: 50, revenue: 2400 },
    ]);
  });

  it('falls back to the order-line name, then the product id, when the catalogue has no match', async () => {
    const sortLimit4 = { sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) };
    mockOrderModel.find.mockImplementation((query: any) => {
      if (!query.createdAt) return sortLimit4;
      if (query.createdAt.$lte || query.createdAt.$lt) return Promise.resolve([]);
      return Promise.resolve([{ totals: { grandTotal: 300 }, items: [
        { productId: 'legacy-1', name: 'Snapshot Name', quantity: 2, total: 200 },
        { productId: 'legacy-2', quantity: 1, total: 100 },
      ] }]);
    });

    const result: any = await service.getDashboardData('org1', { role: 'Organization Admin' });

    expect(result.topProducts.map((p: any) => p.name)).toEqual(['Snapshot Name', 'legacy-2']);
  });
});
