import { Test, TestingModule } from '@nestjs/testing';
import { ReturnsService } from './returns.service';
import { getModelToken } from '@nestjs/mongoose';
import { InventoryService } from '../inventory/inventory.service';
import { FinanceService } from '../finance/finance.service';
import { ReturnOrder } from '../schemas/return.schema';

describe('ReturnsService Ledger Compliance', () => {
  let service: ReturnsService;
  let financeService: FinanceService;

  const mockFinanceService = {
    createCreditNote: jest.fn()
  };

  const mockModel = {
    findOne: jest.fn().mockReturnThis(),
    session: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(true)
  };

  const mockConnection = {
    startSession: jest.fn().mockResolvedValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    })
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnsService,
        { provide: getModelToken(ReturnOrder.name), useValue: mockModel },
        { provide: getModelToken('Outlet'), useValue: mockModel },
        { provide: getModelToken('Invoice'), useValue: mockModel },
        { provide: getModelToken('Order'), useValue: mockModel },
        { provide: getModelToken('Product'), useValue: mockModel },
        { provide: 'DatabaseConnection', useValue: mockConnection },
        { provide: InventoryService, useValue: {} },
        { provide: FinanceService, useValue: mockFinanceService }
      ],
    }).compile();

    service = module.get<ReturnsService>(ReturnsService);
    financeService = module.get<FinanceService>(FinanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a Credit Note instead of directly mutating the balance when return is approved', async () => {
    const mockReturn = {
      _id: 'ret-123',
      status: 'Pending',
      outlet: 'outlet-1',
      value: 5000,
      save: jest.fn().mockResolvedValue(true)
    };
    
    mockModel.exec = jest.fn().mockResolvedValue(mockReturn);

    // Override the connection to mock mongoose session
    (service as any).connection = mockConnection;

    await service.updateStatus('org-1', 'ret-123', 'Approved', 'user-1');

    expect(financeService.createCreditNote).toHaveBeenCalledWith(
      'org-1',
      'outlet-1',
      5000,
      'ret-123',
      undefined
    );
  });
});
