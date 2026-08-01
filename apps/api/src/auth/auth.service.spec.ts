import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SendGridEmailProvider } from '../common/email.provider';

describe('AuthService', () => {
  let service: AuthService;

  class MockDoc {
    save: any;
    constructor(private data: any) {
      this.save = jest.fn().mockResolvedValue({ ...data, _id: 'newId' });
    }
  }

  const mockUserModel: any = jest.fn().mockImplementation((data: any) => new MockDoc(data));
  Object.assign(mockUserModel, {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }),
  });

  const mockTenantModel: any = jest.fn().mockImplementation((data: any) => new MockDoc(data));
  Object.assign(mockTenantModel, {
    findById: jest.fn(),
  });

  const mockSessionModel = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  };

  const mockTokenModel = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockNotificationsService = { create: jest.fn().mockResolvedValue(undefined) };
  const mockEmailProvider = { sendEmail: jest.fn().mockResolvedValue(true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('Tenant'), useValue: mockTenantModel },
        { provide: getModelToken('Session'), useValue: mockSessionModel },
        { provide: getModelToken('Token'), useValue: mockTokenModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuditService, useValue: {} },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: SendGridEmailProvider, useValue: mockEmailProvider },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyOtp', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.verifyOtp('test@test.com', '123456')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create the new tenant with status Pending Approval, not Trial', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await service.register({ companyName: 'Acme Corp', firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com', password: 'secret123' });

      expect(mockTenantModel).toHaveBeenCalledWith(expect.objectContaining({ name: 'Acme Corp', status: 'Pending Approval' }));
    });

    it('should notify every platform admin', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      mockUserModel.find.mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: 'admin1', organizationId: 'org0' }]) }) });

      await service.register({ companyName: 'Acme Corp', firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com', password: 'secret123' });

      expect(mockNotificationsService.create).toHaveBeenCalledWith('org0', 'admin1', expect.objectContaining({ type: 'org_registered' }));
    });
  });

  describe('login — Pending Approval gate', () => {
    it('should reject login for a user whose organization is Pending Approval', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ status: 'Active', platformAdmin: false, organizationId: 'org1' }) });
      mockTenantModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ status: 'Pending Approval' }) });

      await expect(service.login({ email: 'jane@acme.com', password: 'secret123' })).rejects.toThrow('Your organization is awaiting platform administrator approval.');
    });
  });
});
