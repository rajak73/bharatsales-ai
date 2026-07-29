import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getModelToken } from '@nestjs/mongoose';

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
        outletId: { _id: 'outlet-1', name: 'Test Outlet' },
        status: 'Delivered',
        totals: { grandTotal: 5000 },
        createdByUserId: 'user-1'
      }
    ]),
    countDocuments: jest.fn().mockResolvedValue(1)
  };

  const mockOutletModel = {
    findById: jest.fn().mockResolvedValue({ _id: 'outlet-1', name: 'Test Outlet' })
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getModelToken('Order'), useValue: mockOrderModel },
        { provide: getModelToken('Outlet'), useValue: mockOutletModel },
        { 
          provide: getModelToken('ReportJob'), 
          useValue: { 
            create: jest.fn().mockResolvedValue({}),
            updateOne: jest.fn().mockResolvedValue({}),
            findOne: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue({ status: 'Completed', data: 'mock,csv,data' })
            })
          } 
        },
        { provide: getModelToken('ScheduledReport'), useValue: {} }
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
});
