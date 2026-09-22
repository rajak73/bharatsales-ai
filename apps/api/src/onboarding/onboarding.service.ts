import { BadRequestException } from '../core/http-errors';
import { Model } from 'mongoose';
import { OnboardingStateDocument } from '../schemas/onboarding-state.schema';
import { TenantDocument } from '../schemas/tenant.schema';

// Step fields a client may save; organizationId / isComplete / _id are never
// taken from the request body (completion goes through completeOnboarding).
const ONBOARDING_STEP_FIELDS = ['currentStep', 'company', 'policies', 'hierarchy', 'users', 'products', 'channels'] as const;

export class OnboardingService {
  constructor(
    private onboardingModel: Model<OnboardingStateDocument>,
    private tenantModel: Model<TenantDocument>
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

    // Merge the incoming step data (whitelisted fields only)
    const safeStepData: Record<string, any> = {};
    if (stepData && typeof stepData === 'object') {
      for (const key of ONBOARDING_STEP_FIELDS) {
        if (stepData[key] !== undefined) safeStepData[key] = stepData[key];
      }
    }
    Object.assign(state, safeStepData);
    
    return state.save();
  }

  async completeOnboarding(organizationId: string) {
    const state = await this.getState(organizationId);

    // Idempotent: a second call must not touch the tenant again (it used to
    // re-activate a tenant a platform admin had since suspended).
    if (state.isComplete) {
      return { success: true, message: 'Onboarding complete.' };
    }

    // We could validate all steps here before allowing completion
    state.isComplete = true;
    await state.save();

    // Finishing onboarding only moves a Trial tenant to Active. A platform
    // decision (Pending Approval, Suspended, Archived, Past Due, Expired) is
    // never overridden by the tenant's own admin.
    await this.tenantModel.updateOne(
      { _id: organizationId, status: 'Trial' },
      { $set: { status: 'Active' } }
    ).exec();

    return { success: true, message: 'Onboarding complete.' };
  }
}
