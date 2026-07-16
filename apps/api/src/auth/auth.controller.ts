import { Controller, Post, Get, Delete, Param, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { Request } from 'express';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: any) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: { email: string; password?: string; otp?: string; deviceInfo?: string }, @Req() request: Request) {
    const ipAddress = request.ip;
    return this.authService.login(loginDto, ipAddress);
  }

  @HttpCode(HttpStatus.OK)
  @Post('otp/request')
  async requestOtp(@Body() body: { email: string }) {
    if (!body.email) {
      return { statusCode: 400, message: 'Email is required' };
    }
    return this.authService.requestOtp(body.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('otp/verify')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    if (!body.email || !body.otp) {
      return { statusCode: 400, message: 'Email and OTP are required' };
    }
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    if (!body.email) {
      return { statusCode: 400, message: 'Email is required' };
    }
    return this.authService.forgotPassword(body.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    if (!body.token || !body.newPassword) {
      return { statusCode: 400, message: 'Token and newPassword are required' };
    }
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      return { statusCode: 400, message: 'Refresh token is required' };
    }
    return this.authService.refresh(body.refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      return { statusCode: 400, message: 'Refresh token is required' };
    }
    return this.authService.logout(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@Req() req: any) {
    return this.authService.getActiveSessions(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('sessions/:id')
  async revokeSession(@Param('id') sessionId: string, @Req() req: any) {
    return this.authService.revokeSession(sessionId, req.user.sub);
  }
}
