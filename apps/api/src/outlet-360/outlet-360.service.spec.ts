import { Test, TestingModule } from '@nestjs/testing';
import { Outlet360Service } from './outlet-360.service';
import { getModelToken } from '@nestjs/mongoose';

describe('Outlet360Service', () => {
  let service: Outlet360Service;

  const mockOutletModel = { findOne: jest.fn() };
  const mockOrderModel = { find: jest.fn() };
  const mockVisitModel = { find: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Outlet360Service,
        { provide: getModelToken('Outlet'), useValue: mockOutletModel },
        { provide: getModelToken('Order'), useValue: mockOrderModel },
        { provide: getModelToken('Visit'), useValue: mockVisitModel },
      ],
    }).compile();

    service = module.get<Outlet360Service>(Outlet360Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOutletDetails', () => {
    it('should scope the outlet lookup by organizationId, not just code', async () => {
      mockOutletModel.findOne.mockResolvedValue(null);

      const result = await service.getOutletDetails('org1', 'OUT-001');

      expect(mockOutletModel.findOne).toHaveBeenCalledWith({ code: 'OUT-001', organizationId: 'org1' });
      expect(result).toBeNull();
    });

    it('should not return another organization\'s outlet by code', async () => {
      // Simulates the real query behavior: an outlet with this code exists but belongs to org2.
      mockOutletModel.findOne.mockImplementation((query: any) =>
        query.organizationId === 'org2' ? Promise.resolve({ code: 'OUT-001', name: 'Org2 Outlet' }) : Promise.resolve(null)
      );

      const result = await service.getOutletDetails('org1', 'OUT-001');
      expect(result).toBeNull();
    });
  });

  describe('getOutletOrders / getOutletVisits', () => {
    it('should throw NotFoundException if the outlet does not belong to the requesting organization', async () => {
      mockOutletModel.findOne.mockResolvedValue(null);

      await expect(service.getOutletOrders('org1', 'OUT-001')).rejects.toThrow('Outlet not found');
      expect(mockOutletModel.findOne).toHaveBeenCalledWith({ code: 'OUT-001', organizationId: 'org1' });
    });

    it('should scope order/visit queries by organizationId once the outlet is resolved', async () => {
      mockOutletModel.findOne.mockResolvedValue({ _id: 'outlet1', code: 'OUT-001' });
      mockOrderModel.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      await service.getOutletOrders('org1', 'OUT-001');

      expect(mockOrderModel.find).toHaveBeenCalledWith({ outlet: 'outlet1', organizationId: 'org1' });
    });
  });
});
