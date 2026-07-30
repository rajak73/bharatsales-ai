import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getModelToken } from '@nestjs/mongoose';

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getModelToken('Order'), useValue: mockOrderModel },
        { provide: getModelToken('Collection'), useValue: mockCollectionModel },
        { provide: getModelToken('Visit'), useValue: mockVisitModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('Outlet'), useValue: mockOutletModel },
        { provide: getModelToken('Target'), useValue: mockTargetModel },
        { provide: getModelToken('Inventory'), useValue: mockInventoryModel },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
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
});
