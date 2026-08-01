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
