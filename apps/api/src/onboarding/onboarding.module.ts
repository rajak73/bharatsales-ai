import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingStateSchema } from '../schemas/onboarding-state.schema';
import { TenantSchema } from '../schemas/tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'OnboardingState', schema: OnboardingStateSchema },
      { name: 'Tenant', schema: TenantSchema },
    ]),
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
