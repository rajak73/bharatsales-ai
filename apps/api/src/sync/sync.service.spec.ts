import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';

import { getModelToken } from '@nestjs/mongoose';
import { OrdersService } from '../orders/orders.service';
import { InventoryService } from '../inventory/inventory.service';

describe('SyncService', () => {
  let service: SyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: getModelToken('Order'), useValue: {} },
        { provide: getModelToken('Visit'), useValue: {} },
        { provide: getModelToken('Collection'), useValue: {} },
        { provide: getModelToken('Product'), useValue: {} },
        { provide: getModelToken('PriceList'), useValue: {} },
        { provide: getModelToken('Outlet'), useValue: {} },
        { provide: OrdersService, useValue: {} },
        { provide: InventoryService, useValue: {} },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
