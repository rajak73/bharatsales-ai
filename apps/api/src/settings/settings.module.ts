import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { TenantSchema } from '../schemas/tenant.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Tenant', schema: TenantSchema }])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
