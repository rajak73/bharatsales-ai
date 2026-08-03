import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { PriceListsService } from './price-lists.service';

describe('PriceListsService', () => {
  let service: PriceListsService;

  const mockPriceListModel: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: 'newPriceListId' }),
  }));
  Object.assign(mockPriceListModel, {
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  });

  const chain = (result: any) => ({ exec: jest.fn().mockResolvedValue(result) });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceListsService,
        { provide: getModelToken('PriceList'), useValue: mockPriceListModel },
      ],
    }).compile();

    service = module.get<PriceListsService>(PriceListsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list price lists scoped to the organization', async () => {
    mockPriceListModel.find.mockReturnValue(chain([{ _id: 'p1', name: 'Wholesale' }]));
    const result = await service.findAllByOrgId('org1');
    expect(mockPriceListModel.find).toHaveBeenCalledWith({ organizationId: 'org1' });
    expect(result).toEqual([{ _id: 'p1', name: 'Wholesale' }]);
  });

  it('should create a price list scoped to the organization, ignoring a spoofed organizationId', async () => {
    const result: any = await service.create('org1', { name: 'Wholesale', type: 'Customer Group', status: 'Active', validFrom: '2026-01-01', organizationId: 'org2' } as any);
    expect(result.organizationId).toBe('org1');
  });

  it('should throw NotFoundException updating a price list from another organization', async () => {
    mockPriceListModel.findOneAndUpdate.mockReturnValue(chain(null));
    await expect(service.update('org1', 'p1', { status: 'Inactive' })).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException deleting a price list from another organization', async () => {
    mockPriceListModel.findOneAndDelete.mockReturnValue(chain(null));
    await expect(service.remove('org1', 'p1')).rejects.toThrow(NotFoundException);
  });

  it('should delete a price list scoped to the organization', async () => {
    mockPriceListModel.findOneAndDelete.mockReturnValue(chain({ _id: 'p1' }));
    const result = await service.remove('org1', 'p1');
    expect(result).toEqual({ deleted: true });
  });
});
