import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { SchemesService } from './schemes.service';

describe('SchemesService', () => {
  let service: SchemesService;

  const mockSchemeModel: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: 'newSchemeId' }),
  }));
  Object.assign(mockSchemeModel, {
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  });

  const chain = (result: any) => ({ exec: jest.fn().mockResolvedValue(result) });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchemesService,
        { provide: getModelToken('Scheme'), useValue: mockSchemeModel },
      ],
    }).compile();

    service = module.get<SchemesService>(SchemesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list schemes scoped to the organization', async () => {
    mockSchemeModel.find.mockReturnValue(chain([{ _id: 's1', name: 'Diwali Offer' }]));
    const result = await service.findAllByOrgId('org1');
    expect(mockSchemeModel.find).toHaveBeenCalledWith({ organizationId: 'org1' });
    expect(result).toEqual([{ _id: 's1', name: 'Diwali Offer' }]);
  });

  it('should create a scheme scoped to the organization, ignoring a spoofed organizationId', async () => {
    const result: any = await service.create('org1', { name: 'New Scheme', organizationId: 'org2' } as any);
    expect(result.organizationId).toBe('org1');
  });

  it('should update a scheme scoped to the organization', async () => {
    mockSchemeModel.findOneAndUpdate.mockReturnValue(chain({ _id: 's1', name: 'Updated' }));
    const result = await service.update('org1', 's1', { name: 'Updated' });
    expect(mockSchemeModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 's1', organizationId: 'org1' },
      { $set: { name: 'Updated' } },
      { new: true }
    );
    expect(result).toEqual({ _id: 's1', name: 'Updated' });
  });

  it('should throw NotFoundException updating a scheme from another organization', async () => {
    mockSchemeModel.findOneAndUpdate.mockReturnValue(chain(null));
    await expect(service.update('org1', 's1', { name: 'X' })).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException deleting a scheme from another organization', async () => {
    mockSchemeModel.findOneAndDelete.mockReturnValue(chain(null));
    await expect(service.remove('org1', 's1')).rejects.toThrow(NotFoundException);
  });

  it('should delete a scheme scoped to the organization', async () => {
    mockSchemeModel.findOneAndDelete.mockReturnValue(chain({ _id: 's1' }));
    const result = await service.remove('org1', 's1');
    expect(result).toEqual({ deleted: true });
  });
});
