import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { TaxRatesService } from './tax-rates.service';

describe('TaxRatesService', () => {
  let service: TaxRatesService;

  const mockTaxRateModel: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: 'newTaxRateId' }),
  }));
  Object.assign(mockTaxRateModel, {
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  });

  const chain = (result: any) => ({ exec: jest.fn().mockResolvedValue(result) });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxRatesService,
        { provide: getModelToken('TaxRate'), useValue: mockTaxRateModel },
      ],
    }).compile();

    service = module.get<TaxRatesService>(TaxRatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list tax rates scoped to the organization', async () => {
    mockTaxRateModel.find.mockReturnValue(chain([{ _id: 't1', name: 'GST 18%' }]));
    const result = await service.findAllByOrgId('org1');
    expect(mockTaxRateModel.find).toHaveBeenCalledWith({ organizationId: 'org1' });
    expect(result).toEqual([{ _id: 't1', name: 'GST 18%' }]);
  });

  it('should create a tax rate scoped to the organization, ignoring a spoofed organizationId', async () => {
    const result: any = await service.create('org1', { name: 'GST 18%', percentage: 18, country: 'India', organizationId: 'org2' } as any);
    expect(result.organizationId).toBe('org1');
  });

  it('should throw NotFoundException updating a tax rate from another organization', async () => {
    mockTaxRateModel.findOneAndUpdate.mockReturnValue(chain(null));
    await expect(service.update('org1', 't1', { percentage: 12 })).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException deleting a tax rate from another organization', async () => {
    mockTaxRateModel.findOneAndDelete.mockReturnValue(chain(null));
    await expect(service.remove('org1', 't1')).rejects.toThrow(NotFoundException);
  });

  it('should delete a tax rate scoped to the organization', async () => {
    mockTaxRateModel.findOneAndDelete.mockReturnValue(chain({ _id: 't1' }));
    const result = await service.remove('org1', 't1');
    expect(result).toEqual({ deleted: true });
  });
});
