import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockTenantModel = {
    findById: jest.fn(),
  };

  const chain = (result: any) => ({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(result) }) });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getModelToken('Tenant'), useValue: mockTenantModel },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBranding', () => {
    it('should return only name and branding, never the full tenant document', async () => {
      mockTenantModel.findById.mockReturnValue(chain({
        name: 'Bharat Foods Pvt Ltd',
        branding: { logoUrl: 'https://x/logo.png', primaryColor: '#2563EB' },
        gstNumber: 'SHOULD_NOT_LEAK',
      }));

      const result = await service.getBranding('org1');

      expect(mockTenantModel.findById).toHaveBeenCalledWith('org1');
      expect(result).toEqual({
        name: 'Bharat Foods Pvt Ltd',
        branding: { logoUrl: 'https://x/logo.png', primaryColor: '#2563EB' },
      });
      expect((result as any).gstNumber).toBeUndefined();
    });

    it('should default branding to an empty object when the org has none set', async () => {
      mockTenantModel.findById.mockReturnValue(chain({ name: 'Acme Corp', branding: undefined }));

      const result = await service.getBranding('org1');

      expect(result).toEqual({ name: 'Acme Corp', branding: {} });
    });

    it('should throw NotFoundException when the organization does not exist', async () => {
      mockTenantModel.findById.mockReturnValue(chain(null));

      await expect(service.getBranding('org-missing')).rejects.toThrow(NotFoundException);
    });
  });
});
