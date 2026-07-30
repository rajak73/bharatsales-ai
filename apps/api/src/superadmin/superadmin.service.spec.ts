import { Test, TestingModule } from '@nestjs/testing';
import { SuperadminService } from './superadmin.service';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('SuperadminService', () => {
  let service: SuperadminService;

  const mockTenantModel: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    _id: 'newTenantId',
    save: jest.fn().mockResolvedValue({ ...data, _id: 'newTenantId' }),
  }));
  Object.assign(mockTenantModel, {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    db: { model: jest.fn() },
  });

  const mockUserModel: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: 'newUserId' }),
  }));
  Object.assign(mockUserModel, {
    find: jest.fn(),
    findOne: jest.fn(),
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  });

  const mockPlatformSettingsModel = {
    findOne: jest.fn(),
  };

  const mockSessionModel = {
    aggregate: jest.fn(),
  };

  const mockConnection = { readyState: 1 };
  const mockNotificationsService = { create: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperadminService,
        { provide: getModelToken('Tenant'), useValue: mockTenantModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('PlatformSettings'), useValue: mockPlatformSettingsModel },
        { provide: getModelToken('Session'), useValue: mockSessionModel },
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: AuditService, useValue: { getGlobalLogs: jest.fn() } },
        { provide: NotificationsService, useValue: mockNotificationsService },
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

  describe('createTenant', () => {
    it('should also create an Organization Admin user when admin credentials are supplied', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await service.createTenant({
        name: 'Acme Corp',
        plan: 'Starter',
        adminName: 'Jane Doe',
        adminEmail: 'jane@acme.com',
        adminPassword: 'secret123',
      } as any);

      expect(mockUserModel).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 'newTenantId',
        email: 'jane@acme.com',
        name: 'Jane Doe',
        role: 'Organization Admin',
        status: 'Active',
      }));
    });

    it('should not create a user when no admin email is supplied', async () => {
      await service.createTenant({ name: 'Acme Corp', plan: 'Starter' } as any);
      expect(mockUserModel).not.toHaveBeenCalled();
    });

    it('should reject creation if the admin email is already in use', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'existing' }) });

      await expect(service.createTenant({
        name: 'Acme Corp',
        adminName: 'Jane Doe',
        adminEmail: 'jane@acme.com',
        adminPassword: 'secret123',
      } as any)).rejects.toThrow('A user with this admin email already exists');
    });
  });

  describe('updateTenantStatus', () => {
    it("should notify the organization's admins when status changes", async () => {
      mockTenantModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'tenant1', status: 'Suspended' }) });
      mockUserModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 'admin1' }]) }) });

      await service.updateTenantStatus('tenant1', 'Suspended');

      expect(mockUserModel.find).toHaveBeenCalledWith({ organizationId: 'tenant1', role: 'Organization Admin' });
      expect(mockNotificationsService.create).toHaveBeenCalledWith('tenant1', 'admin1', expect.objectContaining({ type: 'org_status_changed' }));
    });
  });

  describe('updateSubscription', () => {
    it('should update the real flat schema fields, not a nonexistent subscription object', async () => {
      mockTenantModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'tenant1', plan: 'Growth' }) });
      mockUserModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) });

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

  describe('getLoginStatistics', () => {
    it('should aggregate sessions by day and by organization', async () => {
      mockSessionModel.aggregate
        .mockResolvedValueOnce([{ _id: '2026-07-29', count: 3 }])
        .mockResolvedValueOnce([{ _id: 'org1', count: 3 }]);
      mockTenantModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 'org1', name: 'Acme Corp' }]) }) }) });

      const result = await service.getLoginStatistics();

      expect(result.dailyLogins).toEqual([{ date: '2026-07-29', count: 3 }]);
      expect(result.byOrg).toEqual([{ organizationId: 'org1', organizationName: 'Acme Corp', count: 3 }]);
    });
  });
});
