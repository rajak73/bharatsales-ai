import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { Tenant, TenantSchema } from '../schemas/tenant.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { PlatformSettings, PlatformSettingsSchema } from '../schemas/platform-settings.schema';
import { AuthModule } from '../auth/auth.module';
import { SupportModule } from '../support/support.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: PlatformSettings.name, schema: PlatformSettingsSchema },
    ]),
    AuthModule,
    SupportModule,
  ],
  controllers: [SuperadminController],
  providers: [SuperadminService],
})
export class SuperadminModule {}
