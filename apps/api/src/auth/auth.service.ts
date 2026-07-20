import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { UserDocument, TenantDocument, SessionDocument, TokenDocument } from '../schemas';

@Injectable()
export class AuthService {
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
    
    // TODO: Integrate SMS/Email provider to send OTP
    console.log(`[Mock SMS/Email] OTP for ${email} is ${otp}`);
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

    // TODO: Generate reset token and send email
    console.log(`[Mock Email] Password reset link: http://localhost:6003/reset-password?token=${resetToken}`);
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
