import { NotFoundException } from '../core/http-errors';
import { Model } from 'mongoose';

// Tenant fields an org admin may edit from the Settings page / profile.
// Billing and lifecycle fields (plan, status, billingCycle, nextBillingDate,
// subscriptionUsersLimit, subscriptionStorageUsed, billingHistory) and ids /
// timestamps are never writable through this endpoint.
export const EDITABLE_TENANT_SETTINGS_FIELDS = [
  'name',
  'timezone',
  'currency',
  'branding',
  'gstNumber',
  'address',
  'country',
  'industry',
  'geofenceRadius',
  'gpsAccuracy',
  'workingDays',
  'shiftStart',
  'shiftEnd',
  'orderApprovalThreshold',
  'discountAuthority',
  'fiscalYearStart',
] as const;

export class SettingsService {
  constructor(private readonly tenantModel: Model<any>) {}

  async getSettings(organizationId: string) {
    const org = await this.tenantModel.findById(organizationId).exec();
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  // Whitelisted projection for self-service branding lookups (see
  // SettingsController.getBranding) — never returns billing/GST/subscription
  // fields, only what's needed to render org identity in a client app.
  async getBranding(organizationId: string) {
    const org = await this.tenantModel.findById(organizationId).select('name branding').exec();
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return { name: org.name, branding: org.branding || {} };
  }

  async updateSettings(organizationId: string, rawUpdateData: any) {
    const updateData: Record<string, any> = {};
    if (rawUpdateData && typeof rawUpdateData === 'object') {
      for (const key of EDITABLE_TENANT_SETTINGS_FIELDS) {
        if (rawUpdateData[key] !== undefined) updateData[key] = rawUpdateData[key];
      }
    }
    if (updateData.branding && typeof updateData.branding === 'object') {
      const { logoUrl, primaryColor } = updateData.branding;
      updateData.branding = {
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(primaryColor !== undefined ? { primaryColor } : {}),
      };
    }
    const org = await this.tenantModel.findByIdAndUpdate(
      organizationId,
      { $set: updateData },
      { new: true }
    ).exec();
    
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    
    return org;
  }
}
