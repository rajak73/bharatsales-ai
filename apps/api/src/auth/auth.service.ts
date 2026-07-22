import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { UserDocument, TenantDocument, SessionDocument, TokenDocument } from '../schemas';

export interface IEmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}

export interface ISMSProvider {
  sendSMS(to: string, message: string): Promise<boolean>;
}

export interface ISSOProvider {
  getAuthUrl(): string;
  verifyToken(token: string): Promise<any>;
}

import { Logger } from '@nestjs/common';

class SendGridEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(SendGridEmailProvider.name);
  private apiKey = process.env.SENDGRID_API_KEY;

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    if (this.apiKey) {
      this.logger.log(`Sending email to ${to} via SendGrid...`);
      // Simulating real API call
      return true;
    }
    this.logger.debug(`[Development Mode] Email to ${to}. Subject: ${subject}`);
    return true;
  }
}

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
  private emailProvider: IEmailProvider = new SendGridEmailProvider();
  private smsProvider: ISMSProvider = new TwilioSMSProvider();
  public googleSSO: ISSOProvider = new MockGoogleSSOProvider();
  public microsoftSSO: ISSOProvider = new MockMicrosoftSSOProvider();

  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Tenant') private tenantModel: Model<TenantDocument>,
    @InjectModel('Session') private sessionModel: Model<SessionDocument>,
    @InjectModel('Token') private tokenModel: Model<TokenDocument>,
    private jwtService: JwtService
  ) {}

  async register(registerDto: any) {
    const { companyName, firstName, lastName, email, password } = registerDto;

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const newTenant = new this.tenantModel({
      name: companyName,
      status: 'Trial',
      plan: 'Starter',
    });
    const savedTenant = await newTenant.save();

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new this.userModel({
      organizationId: savedTenant._id.toString(),
      email,
      name: `${firstName} ${lastName}`.trim(),
      password: hashedPassword,
      role: 'Super Admin',
      status: 'Active',
    });
    const savedUser = await newUser.save();

    return { success: true, message: 'User registered successfully.' };
  }

  async login(loginDto: { email: string; password?: string; otp?: string; deviceInfo?: string }, ipAddress?: string) {
    const { email, password, otp, deviceInfo } = loginDto;
    const user = await this.userModel.findOne({ email }).exec();

    if (!user || user.status !== 'Active') {
      throw new UnauthorizedException('User account is not active or not found');
    }

    const tenant = await this.tenantModel.findById(user.organizationId).exec();
    if (!tenant || tenant.status === 'Suspended' || tenant.status === 'Archived') {
      throw new UnauthorizedException('Organization account is suspended or archived.');
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
      `Your login OTP is ${otp}. It will expire in 10 minutes.`
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
    const resetLink = `http://localhost:6003/reset-password?token=${resetToken}`;
    await this.emailProvider.sendEmail(
      email,
      'BharatSales Password Reset',
      `You requested a password reset. Click here to reset: ${resetLink}`
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

    const tenant = await this.tenantModel.findById(user.organizationId).exec();
    if (!tenant || tenant.status === 'Suspended' || tenant.status === 'Archived') {
      throw new UnauthorizedException('Organization account is suspended or archived.');
    }

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    return this.generateTokenResponse(user, newRefreshToken);
  }

  async logout(refreshToken: string) {
    await this.sessionModel.updateOne({ refreshToken }, { $set: { revoked: true } });
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

  private async generateTokenResponse(user: UserDocument, refreshToken: string) {
    const payload = { 
      sub: user._id.toString(), 
      email: user.email, 
      orgId: user.organizationId, 
      role: user.role 
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
        organizationId: user.organizationId
      }
    };
  }
}
