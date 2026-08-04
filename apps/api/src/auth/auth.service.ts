import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserDocument, TenantDocument, SessionDocument, TokenDocument } from '../schemas';
import { BrevoEmailProvider, renderEmailHtml } from '../common/email.provider';

export interface ISMSProvider {
  sendSMS(to: string, message: string): Promise<boolean>;
}

export interface ISSOProvider {
  getAuthUrl(): string;
  verifyToken(token: string): Promise<any>;
}

import { Logger } from '@nestjs/common';

class TwilioSMSProvider implements ISMSProvider {
  private readonly logger = new Logger(TwilioSMSProvider.name);
  private accountSid = process.env.TWILIO_ACCOUNT_SID;
  private authToken = process.env.TWILIO_AUTH_TOKEN;

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (this.accountSid && this.authToken) {
      this.logger.log(`Sending SMS to ${to} via Twilio...`);
      // Simulating real API call
      return true;
    }
    this.logger.debug(`[Development Mode] SMS to ${to}. Message: ${message}`);
    return true;
  }
}

class MockGoogleSSOProvider implements ISSOProvider {
  private readonly logger = new Logger(MockGoogleSSOProvider.name);
  getAuthUrl(): string {
    return 'https://accounts.google.com/o/oauth2/v2/auth?client_id=mock-client-id&redirect_uri=mock-redirect&response_type=code&scope=email%20profile';
  }
  async verifyToken(token: string): Promise<any> {
    // In a real app, this verifies the OAuth token with Google
    this.logger.log(`Verifying token ${token}`);
    return { email: 'mockuser@gmail.com', name: 'Mock Google User' };
  }
}

class MockMicrosoftSSOProvider implements ISSOProvider {
  private readonly logger = new Logger(MockMicrosoftSSOProvider.name);
  getAuthUrl(): string {
    return 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=mock-client-id&response_type=code&redirect_uri=mock-redirect&scope=user.read';
  }
  async verifyToken(token: string): Promise<any> {
    // In a real app, this verifies the OAuth token with Microsoft
    this.logger.log(`Verifying token ${token}`);
    return { email: 'mockuser@outlook.com', name: 'Mock Microsoft User' };
  }
}

@Injectable()
export class AuthService {
  private smsProvider: ISMSProvider = new TwilioSMSProvider();
  public googleSSO: ISSOProvider = new MockGoogleSSOProvider();
  public microsoftSSO: ISSOProvider = new MockMicrosoftSSOProvider();

  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Tenant') private tenantModel: Model<TenantDocument>,
    @InjectModel('Session') private sessionModel: Model<SessionDocument>,
    @InjectModel('Token') private tokenModel: Model<TokenDocument>,
    private jwtService: JwtService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private emailProvider: BrevoEmailProvider
  ) {}

  async register(registerDto: any) {
    const { companyName, firstName, lastName, email, password } = registerDto;

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const newTenant = new this.tenantModel({
      name: companyName,
      status: 'Pending Approval',
      plan: 'Starter',
    });
    const savedTenant = await newTenant.save();

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new this.userModel({
      organizationId: savedTenant._id.toString(),
      email,
      name: `${firstName} ${lastName}`.trim(),
      password: hashedPassword,
      role: 'Organization Admin',
      status: 'Active',
      emailVerified: false,
    });
    await newUser.save();

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpiresAt = new Date();
    verifyExpiresAt.setHours(verifyExpiresAt.getHours() + 24);
    await new this.tokenModel({
      userId: newUser._id.toString(),
      token: verifyToken,
      type: 'EMAIL_VERIFICATION',
      expiresAt: verifyExpiresAt,
      used: false,
    }).save();

    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:6003'}/verify-email?token=${verifyToken}`;
    await this.emailProvider.sendEmail(
      email,
      'Verify your email for BharatSales AI',
      renderEmailHtml(
        'Verify your email',
        `Welcome to BharatSales AI! Please verify your email to activate your account. This link expires in 24 hours.`,
        { label: 'Verify Email', url: verifyLink }
      )
    );

    const platformAdmins = await this.userModel.find({ platformAdmin: true }).select('_id organizationId').exec();
    for (const admin of platformAdmins) {
      this.notificationsService.create((admin as any).organizationId, (admin as any)._id.toString(), {
        type: 'org_registered',
        title: 'New Organization Registered',
        message: `"${companyName}" has self-registered and is awaiting your approval.`
      }).catch(() => {});
    }

    return { success: true, message: 'Registration submitted. Please check your email to verify your address. Your organization is also awaiting platform administrator approval — you will be notified once approved.' };
  }

  async verifyEmail(token: string) {
    const validToken = await this.tokenModel.findOne({
      token,
      type: 'EMAIL_VERIFICATION',
      used: false,
      expiresAt: { $gt: new Date() }
    }).exec();

    if (!validToken) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    const user = await this.userModel.findById(validToken.userId).exec();
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.emailVerified = true;
    await user.save();

    validToken.used = true;
    await validToken.save();

    return { success: true, message: 'Email verified successfully. You can now log in once your organization is approved.' };
  }

  async login(loginDto: { email: string; password?: string; otp?: string; deviceInfo?: string }, ipAddress?: string) {
    const { email, password, otp, deviceInfo } = loginDto;
    const user = await this.userModel.findOne({ email }).exec();

    if (!user || user.status !== 'Active') {
      throw new UnauthorizedException('User account is not active or not found');
    }

    if (user.emailVerified === false) {
      throw new UnauthorizedException('Please verify your email before logging in. Check your inbox for the verification link.');
    }

    if (!user.platformAdmin) {
      const tenant = await this.tenantModel.findById(user.organizationId).exec();
      if (!tenant || tenant.status === 'Suspended' || tenant.status === 'Archived') {
        throw new UnauthorizedException('Organization account is suspended or archived.');
      }
      if (tenant.status === 'Pending Approval') {
        throw new UnauthorizedException('Your organization is awaiting platform administrator approval.');
      }
    }

    // Account Lockout Check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(`Account is locked due to too many failed attempts. Try again later.`);
    }

    if (password) {
      if (!user.password) {
        await this.handleFailedLogin(user);
        throw new UnauthorizedException('Invalid credentials');
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        await this.handleFailedLogin(user);
        throw new UnauthorizedException('Invalid credentials');
      }
    } else if (otp) {
      const validToken = await this.tokenModel.findOne({
        userId: user._id.toString(),
        token: otp,
        type: 'OTP',
        used: false,
        expiresAt: { $gt: new Date() }
      }).exec();

      if (!validToken) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }
      validToken.used = true;
      await validToken.save();
    } else {
      throw new BadRequestException('Password or OTP is required for login');
    }

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = new this.sessionModel({
      userId: user._id,
      organizationId: user.organizationId,
      refreshToken,
      deviceInfo,
      ipAddress,
      expiresAt,
      revoked: false
    });
    await session.save();

    // Reset failed login attempts on success
    if (user.failedLoginAttempts! > 0 || user.lockedUntil) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      await user.save();
    }

    // Log the successful login audit event
    this.auditService.logAction({
      organizationId: user.organizationId,
      actorId: user._id.toString(),
      actorRole: user.role,
      action: 'LOGIN',
      entityName: 'Session',
      entityId: session._id.toString(),
      ipAddress,
      deviceInfo,
      reason: 'User authenticated successfully'
    }).catch(err => console.error('Audit Log Error:', err));

    return this.generateTokenResponse(user, refreshToken);
  }

  private async handleFailedLogin(user: UserDocument) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 15);
      user.lockedUntil = lockTime;
    }
    await user.save();
  }

  async requestOtp(email: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user || user.status !== 'Active') {
      throw new BadRequestException('User account is not active or not found');
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    const token = new this.tokenModel({
      userId: user._id.toString(),
      token: otp,
      type: 'OTP',
      expiresAt,
      used: false
    });
    await token.save();
    
    // Use SMS Provider (or Email)
    await this.smsProvider.sendSMS(
      user.mobile || email, 
      `Your BharatSales OTP is ${otp}. It will expire in 10 minutes.`
    );
    await this.emailProvider.sendEmail(
      email,
      'BharatSales OTP Verification',
      renderEmailHtml('Your verification code', `Your login OTP is <strong style="font-size:20px;letter-spacing:2px;">${otp}</strong>. It will expire in 10 minutes.`)
    );
    
    return { success: true, message: 'OTP sent to registered email/mobile.' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const validToken = await this.tokenModel.findOne({
      userId: user._id.toString(),
      token: otp,
      type: 'OTP',
      used: false,
      expiresAt: { $gt: new Date() }
    }).exec();

    if (validToken) {
      validToken.used = true;
      await validToken.save();
      return { success: true };
    }
    throw new UnauthorizedException('Invalid or expired OTP');
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user || user.status !== 'Active') {
      // Don't leak user existence
      return { success: true, message: 'If the account exists, a reset link has been sent.' };
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const token = new this.tokenModel({
      userId: user._id.toString(),
      token: resetToken,
      type: 'PASSWORD_RESET',
      expiresAt,
      used: false
    });
    await token.save();

    // Generate reset token and send email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:6003'}/reset-password?token=${resetToken}`;
    await this.emailProvider.sendEmail(
      email,
      'Reset your BharatSales password',
      renderEmailHtml(
        'Password reset requested',
        'We received a request to reset your BharatSales AI password. This link expires in 1 hour.',
        { label: 'Reset Password', url: resetLink }
      )
    );
    
    return { success: true, message: 'If the account exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const validToken = await this.tokenModel.findOne({
      token,
      type: 'PASSWORD_RESET',
      used: false,
      expiresAt: { $gt: new Date() }
    }).exec();

    if (!validToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.userModel.findById(validToken.userId).exec();
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    validToken.used = true;
    await validToken.save();

    this.auditService.logAction({
      organizationId: user.organizationId,
      actorId: user._id.toString(),
      actorRole: user.role,
      action: 'PASSWORD_RESET',
      entityName: 'User',
      entityId: user._id.toString(),
      reason: 'User completed password reset flow'
    }).catch(err => console.error('Audit Log Error:', err));

    return { success: true, message: 'Password reset successful.' };
  }

  async acceptInvitation(token: string, newPassword: string) {
    const validToken = await this.tokenModel.findOne({
      token,
      type: 'INVITATION',
      used: false,
      expiresAt: { $gt: new Date() }
    }).exec();

    if (!validToken) {
      throw new BadRequestException('Invalid or expired invitation token');
    }

    const user = await this.userModel.findById(validToken.userId).exec();
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.status !== 'Invited') {
      throw new BadRequestException('User is not in Invited state');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.status = 'Active';
    // Only someone with access to the invited mailbox could have this
    // token, so accepting the invitation doubles as email verification.
    user.emailVerified = true;
    await user.save();

    validToken.used = true;
    await validToken.save();

    return { success: true, message: 'Invitation accepted successfully. You can now login.' };
  }

  async refresh(refreshToken: string) {
    const session = await this.sessionModel.findOne({ refreshToken, revoked: false }).exec();
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userModel.findById(session.userId).exec();
    if (!user || user.status !== 'Active') {
      throw new UnauthorizedException('User account is not active');
    }

    if (!user.platformAdmin) {
      const tenant = await this.tenantModel.findById(user.organizationId).exec();
      if (!tenant || tenant.status === 'Suspended' || tenant.status === 'Archived' || tenant.status === 'Pending Approval') {
        throw new UnauthorizedException('Organization account is suspended, archived, or pending approval.');
      }
    }

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    return this.generateTokenResponse(user, newRefreshToken);
  }

  async logout(refreshToken: string) {
    const session = await this.sessionModel.findOneAndUpdate(
      { refreshToken },
      { $set: { revoked: true } }
    ).exec();

    if (session) {
      this.auditService.logAction({
        organizationId: session.organizationId,
        actorId: session.userId.toString(),
        actorRole: 'Unknown', // We don't have the user object here easily, but we can log the action
        action: 'LOGOUT',
        entityName: 'Session',
        entityId: session._id.toString(),
        reason: 'User initiated logout'
      }).catch(err => console.error('Audit Log Error:', err));
    }

    return { success: true };
  }

  async getActiveSessions(userId: string) {
    return this.sessionModel.find({ userId, revoked: false, expiresAt: { $gt: new Date() } })
      .select('-refreshToken')
      .exec();
  }

  async revokeSession(sessionId: string, userId: string) {
    const result = await this.sessionModel.updateOne(
      { _id: sessionId, userId },
      { $set: { revoked: true } }
    );
    if (result.modifiedCount === 0) {
      throw new BadRequestException('Session not found or already revoked');
    }
    return { success: true };
  }

  async registerPushToken(userId: string, pushToken: string) {
    if (!pushToken) {
      throw new BadRequestException('pushToken is required');
    }
    await this.userModel.updateOne({ _id: userId }, { $set: { pushToken } });
    return { success: true };
  }

  private async generateTokenResponse(user: UserDocument, refreshToken: string) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      orgId: user.organizationId,
      role: user.role,
      platformAdmin: user.platformAdmin === true,
      distributorId: user.distributorId,
      territoryIds: user.territoryIds || []
    };

    const access_token = await this.jwtService.signAsync(payload, { expiresIn: '15m' });

    return {
      access_token,
      refresh_token: refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        platformAdmin: user.platformAdmin === true,
        organizationId: user.organizationId
      }
    };
  }
}
