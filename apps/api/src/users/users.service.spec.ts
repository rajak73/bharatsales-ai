import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { Tenant } from '../schemas/tenant.schema';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserModel: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: 'newUserId', toObject: () => ({ ...data, _id: 'newUserId' }) }),
    toObject: () => ({ ...data, _id: 'newUserId' }),
  }));
  Object.assign(mockUserModel, {
    findOne: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('Token'), useValue: mockTokenModel },
        { provide: getModelToken(Tenant.name), useValue: mockTenantModel },
        { provide: HierarchyService, useValue: mockHierarchyService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
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
