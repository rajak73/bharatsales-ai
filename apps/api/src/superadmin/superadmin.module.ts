import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { Tenant, TenantSchema } from '../schemas/tenant.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { PlatformSettings, PlatformSettingsSchema } from '../schemas/platform-settings.schema';
import { Session, SessionSchema } from '../schemas/session.schema';
import { AuthModule } from '../auth/auth.module';
import { SupportModule } from '../support/support.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: PlatformSettings.name, schema: PlatformSettingsSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    AuthModule,
    SupportModule,
    NotificationsModule,
  ],
  controllers: [SuperadminController],
  providers: [SuperadminService],
})
export class SuperadminModule {}
