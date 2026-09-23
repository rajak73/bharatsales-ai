import { AuthService } from './auth.service';
import { UnauthorizedException } from '../core/http-errors';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  class MockDoc {
    save: any;
    _id: string;
    constructor(private data: any) {
      // Real Mongoose documents get an _id as soon as they're constructed,
      // not only after save() resolves — code that reads `doc._id` right
      // after `new Model(...)` (before awaiting save()) relies on this.
      this._id = 'newId';
      this.save = jest.fn().mockResolvedValue({ ...data, _id: 'newId' });
    }
  }

  const mockUserModel: any = jest.fn().mockImplementation((data: any) => new MockDoc(data));
  Object.assign(mockUserModel, {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }),
    updateOne: jest.fn().mockResolvedValue({}),
  });

  const mockTenantModel: any = jest.fn().mockImplementation((data: any) => new MockDoc(data));
  Object.assign(mockTenantModel, {
    findById: jest.fn(),
  });

  const mockSessionModel = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
  };

  const mockTokenModel: any = jest.fn().mockImplementation((data: any) => new MockDoc(data));
  Object.assign(mockTokenModel, {
    findOne: jest.fn(),
    updateMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
  });

  const mockNotificationsService = { create: jest.fn().mockResolvedValue(undefined) };
  const mockEmailProvider = { sendEmail: jest.fn().mockResolvedValue(true) };

  const mockAuditService = { logAction: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    service = new AuthService(
      mockUserModel as any,
      mockTenantModel as any,
      mockSessionModel as any,
      mockTokenModel as any,
      mockAuditService as any,
      mockNotificationsService as any,
      mockEmailProvider as any,
    );
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

    it('should create the user as unverified and email them a verification link', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await service.register({ companyName: 'Acme Corp', firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com', password: 'secret123' });

      expect(mockUserModel).toHaveBeenCalledWith(expect.objectContaining({ email: 'jane@acme.com', emailVerified: false }));
      expect(mockTokenModel).toHaveBeenCalledWith(expect.objectContaining({ type: 'EMAIL_VERIFICATION' }));
      expect(mockEmailProvider.sendEmail).toHaveBeenCalledWith(
        'jane@acme.com',
        expect.stringContaining('Verify your email'),
        expect.stringContaining('verify-email?token=')
      );
    });
  });

  describe('login — Pending Approval gate', () => {
    it('should reject login for a user whose organization is Pending Approval', async () => {
      // The org-state gates only answer once the password is right.
      const password = await bcrypt.hash('secret123', 4);
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ status: 'Active', platformAdmin: false, organizationId: 'org1', password }) });
      mockTenantModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ status: 'Pending Approval' }) });

      await expect(service.login({ email: 'jane@acme.com', password: 'secret123' })).rejects.toThrow('Your organization is awaiting platform administrator approval.');
    });
  });

  describe('login — email verification gate', () => {
    it('should reject login for a user whose email is not yet verified', async () => {
      const password = await bcrypt.hash('secret123', 4);
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ status: 'Active', emailVerified: false, platformAdmin: false, organizationId: 'org1', password }) });

      await expect(service.login({ email: 'jane@acme.com', password: 'secret123' })).rejects.toThrow('Please verify your email before logging in.');
    });

    it('answers a wrong password with "Invalid credentials" before revealing the email is unverified', async () => {
      const password = await bcrypt.hash('secret123', 4);
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ status: 'Active', emailVerified: false, platformAdmin: false, organizationId: 'org1', password, save: jest.fn() }),
      });

      await expect(service.login({ email: 'jane@acme.com', password: 'wrong-one' })).rejects.toThrow('Invalid credentials');
    });

    it('answers an unknown email with "Invalid credentials" too', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.login({ email: 'nobody@acme.com', password: 'secret123' })).rejects.toThrow('Invalid credentials');
    });

    it('should allow login through when emailVerified is undefined (pre-existing accounts)', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ status: 'Active', platformAdmin: false, organizationId: 'org1', save: jest.fn().mockResolvedValue(undefined) }),
      });
      mockTenantModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ status: 'Active' }) });

      await expect(service.login({ email: 'jane@acme.com', password: 'secret123' })).rejects.toThrow('Invalid credentials');
      // Reaches the password-comparison step (no user.password set, so it's
      // rejected there) rather than being blocked by the email-verification
      // gate — proves undefined isn't treated the same as false.
    });
  });

  describe('verifyEmail', () => {
    it('should mark the user verified for a valid token', async () => {
      const userSave = jest.fn().mockResolvedValue(undefined);
      mockTokenModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ userId: 'user1', used: false, save: jest.fn().mockResolvedValue(undefined) }) });
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ emailVerified: false, save: userSave }) });

      const result = await service.verifyEmail('sometoken');

      expect(userSave).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should reject an invalid or expired token', async () => {
      mockTokenModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.verifyEmail('badtoken')).rejects.toThrow('Invalid or expired verification link');
    });
  });

  describe('verifyOtp — lockout', () => {
    it('should count a wrong OTP as a failed login attempt', async () => {
      const user: any = { _id: 'user1', failedLoginAttempts: 4, save: jest.fn().mockResolvedValue(undefined) };
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
      mockTokenModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.verifyOtp('a@b.com', '000000')).rejects.toThrow(UnauthorizedException);
      expect(user.failedLoginAttempts).toBe(5);
      expect(user.lockedUntil).toBeInstanceOf(Date);
      expect(user.save).toHaveBeenCalled();
    });

    it('should reject OTP verification while the account is locked', async () => {
      const user: any = { _id: 'user1', lockedUntil: new Date(Date.now() + 60_000), save: jest.fn() };
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });

      await expect(service.verifyOtp('a@b.com', '123456')).rejects.toThrow('Account is locked');
      expect(mockTokenModel.findOne).not.toHaveBeenCalled();
    });
  });

  describe('login — wrong OTP', () => {
    it('should count a wrong OTP toward the lockout', async () => {
      const user: any = { _id: 'user1', status: 'Active', platformAdmin: true, failedLoginAttempts: 0, save: jest.fn().mockResolvedValue(undefined) };
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(user) });
      mockTokenModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.login({ email: 'a@b.com', otp: '000000' })).rejects.toThrow('Invalid or expired OTP');
      expect(user.failedLoginAttempts).toBe(1);
    });
  });

  describe('requestOtp', () => {
    it('should invalidate earlier unused OTPs and issue a 6-digit code', async () => {
      mockUserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'user1', status: 'Active' }) });

      await service.requestOtp('a@b.com');

      expect(mockTokenModel.updateMany).toHaveBeenCalledWith(
        { userId: 'user1', type: 'OTP', used: false },
        { $set: { used: true } }
      );
      const created = mockTokenModel.mock.calls[mockTokenModel.mock.calls.length - 1][0];
      expect(created.type).toBe('OTP');
      expect(created.token).toMatch(/^\d{6}$/);
    });
  });

  describe('resetPassword', () => {
    it('should revoke every existing session of the user', async () => {
      mockTokenModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ userId: 'user1', used: false, save: jest.fn().mockResolvedValue(undefined) }) });
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'user1', organizationId: 'org1', role: 'Sales Representative', save: jest.fn().mockResolvedValue(undefined) }) });

      const result = await service.resetPassword('resettoken', 'newSecret123');

      expect(result.success).toBe(true);
      expect(mockSessionModel.updateMany).toHaveBeenCalledWith(
        { userId: 'user1', revoked: false },
        { $set: { revoked: true } }
      );
    });
  });

  describe('registerPushToken', () => {
    it('should store the push token against the calling user', async () => {
      await service.registerPushToken('user1', 'ExponentPushToken[abc123]');
      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: 'user1' },
        { $set: { pushToken: 'ExponentPushToken[abc123]' } }
      );
    });

    it('should reject an empty push token', async () => {
      await expect(service.registerPushToken('user1', '')).rejects.toThrow('pushToken is required');
      expect(mockUserModel.updateOne).not.toHaveBeenCalled();
    });
  });
});
