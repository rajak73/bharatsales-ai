import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnboardingStateDocument } from '../schemas/onboarding-state.schema';
import { TenantDocument } from '../schemas/tenant.schema';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel('OnboardingState') private onboardingModel: Model<OnboardingStateDocument>,
    @InjectModel('Tenant') private tenantModel: Model<TenantDocument>
  ) {}

  async getState(organizationId: string) {
    let state = await this.onboardingModel.findOne({ organizationId }).exec();
    if (!state) {
      state = new this.onboardingModel({ organizationId });
      await state.save();
    }
    return state;
  }

  async saveStep(organizationId: string, stepData: any) {
    const state = await this.getState(organizationId);
    
    if (state.isComplete) {
      throw new BadRequestException('Onboarding is already complete.');
    }

    // Merge the incoming step data
    Object.assign(state, stepData);
    
    return state.save();
  }

  async completeOnboarding(organizationId: string) {
    const state = await this.getState(organizationId);
    
    // We could validate all steps here before allowing completion
    state.isComplete = true;
    await state.save();

    // Optionally update Tenant status to Active if it was Trial
    await this.tenantModel.findByIdAndUpdate(organizationId, {
      $set: { status: 'Active' }
    }).exec();

    return { success: true, message: 'Onboarding complete.' };
  }
}
