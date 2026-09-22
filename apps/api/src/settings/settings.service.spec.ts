import { NotFoundException } from '../core/http-errors';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockTenantModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const chain = (result: any) => ({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(result) }) });

  beforeEach(async () => {
    service = new SettingsService(mockTenantModel as any);
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

  describe('updateSettings — billing fields are never writable', () => {
    it('should only $set whitelisted tenant settings fields', async () => {
      mockTenantModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'org1' }) });

      await service.updateSettings('org1', {
        name: 'Acme', industry: 'FMCG', workingDays: ['Monday'],
        plan: 'Enterprise', status: 'Active', subscriptionUsersLimit: 9999,
        billingHistory: [], billingCycle: 'Monthly', nextBillingDate: '2099-01-01',
        subscriptionStorageUsed: '1TB', organizationId: 'x', _id: 'y',
      });

      expect(mockTenantModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'org1',
        { $set: { name: 'Acme', industry: 'FMCG', workingDays: ['Monday'] } },
        { new: true }
      );
    });
  });
});
