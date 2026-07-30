import { Test, TestingModule } from '@nestjs/testing';
import { SuperadminService } from './superadmin.service';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { AuditService } from '../audit/audit.service';

describe('SuperadminService', () => {
  let service: SuperadminService;

  const mockTenantModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    db: { model: jest.fn() },
  };

  const mockUserModel = {
    find: jest.fn(),
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockPlatformSettingsModel = {
    findOne: jest.fn(),
  };

  const mockConnection = { readyState: 1 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperadminService,
        { provide: getModelToken('Tenant'), useValue: mockTenantModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('PlatformSettings'), useValue: mockPlatformSettingsModel },
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: AuditService, useValue: { getGlobalLogs: jest.fn() } },
      ],
    }).compile();

    service = module.get<SuperadminService>(SuperadminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should query users without any organizationId filter by default (cross-tenant)', async () => {
      mockUserModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }) });
      mockTenantModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }) });

      await service.getAllUsers();
      expect(mockUserModel.find).toHaveBeenCalledWith({});
    });

    it('should apply an organizationId filter only when explicitly requested', async () => {
      mockUserModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }) });
      mockTenantModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }) });

      await service.getAllUsers({ organizationId: 'org1' });
      expect(mockUserModel.find).toHaveBeenCalledWith({ organizationId: 'org1' });
    });
  });

  describe('updateSubscription', () => {
    it('should update the real flat schema fields, not a nonexistent subscription object', async () => {
      mockTenantModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'tenant1', plan: 'Growth' }) });

      await service.updateSubscription('tenant1', { plan: 'Growth', billingCycle: 'Monthly', subscriptionUsersLimit: 25 });

      expect(mockTenantModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'tenant1',
        { plan: 'Growth', billingCycle: 'Monthly', subscriptionUsersLimit: 25 },
        { new: true }
      );
    });
  });

  describe('getMetrics', () => {
    it('should compute MRR from the real tenant.plan field', async () => {
      mockTenantModel.find.mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ plan: 'Growth' }, { plan: 'Starter' }]) }) });

      const result = await service.getMetrics();
      expect(result.mrr).toBe(24999 + 9999);
    });
  });
});
