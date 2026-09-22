import { InventoryCleanupService } from './inventory.cleanup.service';

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
    service = new InventoryCleanupService(mockOrderModel as any, mockInventoryService as any);
  });

  it('should find expired orders and release stock', async () => {
    await service.handleCron();
    expect(mockOrderModel.find).toHaveBeenCalled();
  });

  it('should record a statusHistory entry when auto-cancelling a stale order', async () => {
    const staleOrder: any = {
      _id: 'o1',
      organizationId: 'org1',
      status: 'Pending_Approval',
      items: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockOrderModel.exec.mockResolvedValueOnce([staleOrder]);

    await service.handleCron();

    expect(staleOrder.status).toBe('Cancelled');
    expect(staleOrder.statusHistory).toHaveLength(1);
    expect(staleOrder.statusHistory[0]).toEqual(expect.objectContaining({ status: 'Cancelled', actorId: 'system' }));
    expect(staleOrder.save).toHaveBeenCalled();
  });
});
