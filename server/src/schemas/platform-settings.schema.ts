import { Schema, Document } from 'mongoose';

export type PlatformSettingsDocument = PlatformSettings & Document;

// Singleton document (one row, no organizationId) holding platform-wide
// configuration — distinct from the per-tenant Settings other roles see.
export interface PlatformSettings {
  defaultTrialDays: number;
  maintenanceMode: boolean;
  defaultPlanUserLimits: Record<string, number>;
}

export const PlatformSettingsSchema = new Schema(
  {
    defaultTrialDays: { type: Number, default: 14 },
    maintenanceMode: { type: Boolean, default: false },
    defaultPlanUserLimits: { type: Object, default: { Starter: 10, Growth: 50, Enterprise: 0 } },
  },
  { timestamps: true, collection: 'platform_settings' },
);
