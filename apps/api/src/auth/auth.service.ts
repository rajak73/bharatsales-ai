import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { UserDocument, TenantDocument, SessionDocument } from '../schemas';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Tenant') private tenantModel: Model<TenantDocument>,
    @InjectModel('Session') private sessionModel: Model<SessionDocument>,
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

    if (password) {
      if (!user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else if (otp) {
      // OTP verification stub
      if (otp !== '123456') { // Mock OTP logic
        throw new UnauthorizedException('Invalid OTP');
      }
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

    return this.generateTokenResponse(user, refreshToken);
  }

  async requestOtp(email: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user || user.status !== 'Active') {
      throw new BadRequestException('User account is not active or not found');
    }
    // TODO: Integrate SMS/Email provider to send OTP
    return { success: true, message: 'OTP sent to registered email/mobile.' };
  }

  async verifyOtp(email: string, otp: string) {
    // Basic verification stub, in reality check DB for cached OTP
    if (otp === '123456') {
      return { success: true };
    }
    throw new UnauthorizedException('Invalid OTP');
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user || user.status !== 'Active') {
      // Don't leak user existence
      return { success: true, message: 'If the account exists, a reset link has been sent.' };
    }
    // TODO: Generate reset token and send email
    return { success: true, message: 'If the account exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    // TODO: Verify reset token
    // const user = ...
    // user.password = await bcrypt.hash(newPassword, 10);
    // await user.save();
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
