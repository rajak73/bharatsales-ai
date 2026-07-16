import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserSchema, TenantSchema, SessionSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Tenant', schema: TenantSchema },
      { name: 'Session', schema: SessionSchema },
    ]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'bharatsales-super-secret-key-2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
