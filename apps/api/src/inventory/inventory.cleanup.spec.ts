import { Test, TestingModule } from '@nestjs/testing';
import { InventoryCleanupService } from './inventory.cleanup.service';
import { getModelToken } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';

describe('InventoryCleanupService', () => {
  let service: InventoryCleanupService;
  
  const mockOrderModel = {
    find: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([])
  };
  
  const mockInventoryService = {
    releaseReservedStock: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryCleanupService,
        { provide: getModelToken('Order'), useValue: mockOrderModel },
        { provide: InventoryService, useValue: mockInventoryService }
      ],
    }).compile();

    service = module.get<InventoryCleanupService>(InventoryCleanupService);
  });

  it('should find expired orders and release stock', async () => {
    await service.handleCron();
    expect(mockOrderModel.find).toHaveBeenCalled();
  });
});
