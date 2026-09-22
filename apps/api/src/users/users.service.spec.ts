import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserModel: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: 'newUserId', toObject: () => ({ ...data, _id: 'newUserId' }) }),
    toObject: () => ({ ...data, _id: 'newUserId' }),
  }));
  Object.assign(mockUserModel, {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  });

  const mockTokenModel: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: 'newTokenId' }),
  }));
  const mockTenantModel = { findById: jest.fn() };
  const mockHierarchyService = { getTeamUserIds: jest.fn() };
  const mockEmailProvider = { sendEmail: jest.fn().mockResolvedValue(true) };

  beforeEach(async () => {
    service = new UsersService(
      mockUserModel as any,
      mockTokenModel as any,
      mockTenantModel as any,
      mockHierarchyService as any,
      mockEmailProvider as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser — role escalation guards', () => {
    it('should block a Sales Manager from creating an Organization Admin', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(
        service.createUser('org1', 'Sales Manager', { email: 'new@org.com', password: 'pw', role: 'Organization Admin' } as any)
      ).rejects.toThrow('Only Organization Admins can create other Organization Admins.');
    });

    it('should block a Distributor from creating a non-Distributor-role user', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(
        service.createUser('org1', 'Distributor', { email: 'staff@dist.com', password: 'pw', role: 'Sales Representative' } as any, 'dist1')
      ).rejects.toThrow('Distributors can only create staff with the Distributor role.');
    });
  });

  describe('findAllByOrgId — Super Admin exclusion', () => {
    it('excludes Super Admin from an org team list, even if their user doc carries that organizationId', async () => {
      const execMock = jest.fn().mockResolvedValue([{ name: 'Bharat Admin', role: 'Organization Admin' }]);
      const selectMock = jest.fn().mockReturnValue({ exec: execMock });
      mockUserModel.find.mockReturnValue({ select: selectMock });

      await service.findAllByOrgId('org1');

      expect(mockUserModel.find).toHaveBeenCalledWith({ organizationId: 'org1', role: { $ne: 'Super Admin' } });
    });
  });

  describe('findAllByOrgId — Sales Manager scoping', () => {
    it('returns an empty list (no query, no CastError) when the manager has no team', async () => {
      mockHierarchyService.getTeamUserIds.mockResolvedValue([]);
      mockUserModel.find.mockClear();

      const result = await service.findAllByOrgId('org1', { role: 'Sales Manager', sub: 'manager1' });

      expect(result).toEqual([]);
      expect(mockUserModel.find).not.toHaveBeenCalled();
    });

    it('scopes the list to the manager\'s team ids only', async () => {
      mockHierarchyService.getTeamUserIds.mockResolvedValue(['repA']);
      const execMock = jest.fn().mockResolvedValue([{ name: 'Rep A' }]);
      mockUserModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: execMock }) });

      await service.findAllByOrgId('org1', { role: 'Sales Manager', sub: 'manager1' });

      expect(mockUserModel.find).toHaveBeenCalledWith(expect.objectContaining({ _id: { $in: ['repA'] } }));
    });
  });

  describe('updateUser / deleteUser — cross-role scoping', () => {
    it('should block a Distributor from updating a user outside their own distributor staff', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'target1', distributorId: 'otherDist' }) });

      await expect(
        service.updateUser('org1', { role: 'Distributor', distributorId: 'dist1' }, 'target1', { name: 'Hacked' })
      ).rejects.toThrow('Distributors can only manage their own staff.');
    });

    it('should allow a Distributor to update their own staff', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'target1', distributorId: 'dist1' }) });
      mockUserModel.findOneAndUpdate.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'target1', name: 'Updated' }) }) });

      const result = await service.updateUser('org1', { role: 'Distributor', distributorId: 'dist1' }, 'target1', { name: 'Updated' });
      expect(result).toEqual({ _id: 'target1', name: 'Updated' });
    });

    it('should block a Sales Manager from updating a user outside their team', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'target1' }) });
      mockHierarchyService.getTeamUserIds.mockResolvedValue(['repA', 'repB']);

      await expect(
        service.updateUser('org1', { role: 'Sales Manager', sub: 'manager1' }, 'target1', { name: 'Hacked' })
      ).rejects.toThrow('Sales Managers can only manage users on their own team.');
    });

    it('should block a Distributor from deleting a user outside their own distributor staff', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'target1', distributorId: 'otherDist' }) });

      await expect(
        service.deleteUser('org1', { role: 'Distributor', distributorId: 'dist1' }, 'target1')
      ).rejects.toThrow('Distributors can only manage their own staff.');
    });

    it('should allow an Organization Admin to update any user in the org', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'target1' }) });
      mockUserModel.findOneAndUpdate.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'target1', name: 'Updated' }) }) });

      const result = await service.updateUser('org1', { role: 'Organization Admin' }, 'target1', { name: 'Updated' });
      expect(result).toEqual({ _id: 'target1', name: 'Updated' });
    });
  });

  describe('createUser', () => {
    it('should block user creation once the org has reached its subscriptionUsersLimit', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockTenantModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ subscriptionUsersLimit: 2 }) });
      mockUserModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(2) });

      await expect(
        service.createUser('org1', 'Organization Admin', { email: 'new@org.com', password: 'pw' })
      ).rejects.toThrow('Organization has reached its maximum user limit of 2. Please upgrade your plan.');
    });

    it('should allow user creation when under the subscriptionUsersLimit', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockTenantModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ subscriptionUsersLimit: 10 }) });
      mockUserModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(2) });

      const result = await service.createUser('org1', 'Organization Admin', { email: 'new@org.com', password: 'pw' });
      expect(result).toBeDefined();
    });
  });

  describe('createUser — mass assignment / password', () => {
    it('should drop privileged fields from the body', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockTenantModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await service.createUser('org1', 'Organization Admin', {
        email: 'x@org.com', password: 'pw', role: 'Sales Representative',
        platformAdmin: true, emailVerified: true, failedLoginAttempts: -100, lockedUntil: null,
        organizationId: 'otherOrg', distributorId: 'dist9',
      } as any);

      const created = mockUserModel.mock.calls[mockUserModel.mock.calls.length - 1][0];
      expect(created.organizationId).toBe('org1');
      expect(created.platformAdmin).toBeUndefined();
      expect(created.emailVerified).toBeUndefined();
      expect(created.failedLoginAttempts).toBeUndefined();
      expect(created).not.toHaveProperty('lockedUntil');
      expect(created.distributorId).toBeUndefined();
    });

    it('should accept distributorId only when an Org Admin creates a Distributor user', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockTenantModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await service.createUser('org1', 'Organization Admin', { email: 'd@org.com', password: 'pw', role: 'Distributor', distributorId: 'dist1' } as any);

      const created = mockUserModel.mock.calls[mockUserModel.mock.calls.length - 1][0];
      expect(created.distributorId).toBe('dist1');
    });

    it('should require a password instead of defaulting to a shared one', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(
        service.createUser('org1', 'Organization Admin', { email: 'nopw@org.com', role: 'Sales Representative' } as any)
      ).rejects.toThrow('Password is required');
    });
  });

  describe('updateUser — mass assignment', () => {
    it('should never $set privileged fields', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'target1' }) });
      mockUserModel.findOneAndUpdate.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'target1' }) }) });

      await service.updateUser('org1', { role: 'Organization Admin' }, 'target1', {
        name: 'New', platformAdmin: true, distributorId: 'd', emailVerified: true, organizationId: 'x', lockedUntil: null,
      } as any);

      expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'target1', organizationId: 'org1' },
        { $set: { name: 'New' } },
        { new: true }
      );
    });
  });

  describe('inviteUser — role hierarchy & token exposure', () => {
    it('should block a Distributor from inviting an Organization Admin', async () => {
      await expect(
        service.inviteUser('org1', 'Distributor', 'boss@org.com', 'Organization Admin', undefined, undefined, 'dist1')
      ).rejects.toThrow(/Organization Admin/);
    });

    it('should block a Sales Representative from inviting an Organization Admin', async () => {
      await expect(
        service.inviteUser('org1', 'Sales Representative', 'boss@org.com', 'Organization Admin')
      ).rejects.toThrow('Only Organization Admins can create other Organization Admins.');
    });

    it('should block a Distributor from inviting a non-Distributor role', async () => {
      await expect(
        service.inviteUser('org1', 'Distributor', 'rep@org.com', 'Sales Representative', undefined, undefined, 'dist1')
      ).rejects.toThrow('Distributors can only create staff with the Distributor role.');
    });

    it('should not return inviteToken outside NODE_ENV=test', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockTenantModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      const prev = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        const res = await service.inviteUser('org1', 'Organization Admin', 'p@org.com', 'Sales Representative');
        expect(res).not.toHaveProperty('inviteToken');
      } finally {
        process.env.NODE_ENV = prev;
      }
    });

    it('should return inviteToken under NODE_ENV=test', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockTenantModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      const prev = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      try {
        const res = await service.inviteUser('org1', 'Organization Admin', 't@org.com', 'Sales Representative');
        expect(typeof res.inviteToken).toBe('string');
      } finally {
        process.env.NODE_ENV = prev;
      }
    });
  });

  describe('inviteUser', () => {
    it('should store the provided name and territoryIds on the invited user', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockTenantModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await service.inviteUser('org1', 'Organization Admin', 'rep@org.com', 'Sales Representative', 'Jane Rep', ['territory1']);

      expect(mockUserModel).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Jane Rep',
        territoryIds: ['territory1'],
        status: 'Invited',
      }));
    });

    it('should default to a placeholder name and empty territoryIds when not provided', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockTenantModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await service.inviteUser('org1', 'Organization Admin', 'rep2@org.com', 'Sales Representative');

      expect(mockUserModel).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Invited User',
        territoryIds: [],
      }));
    });
  });
});
