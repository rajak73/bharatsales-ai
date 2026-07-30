import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlatformSettingsDocument = PlatformSettings & Document;

// Singleton document (one row, no organizationId) holding platform-wide
// configuration — distinct from the per-tenant Settings other roles see.
@Schema({ timestamps: true, collection: 'platform_settings' })
export class PlatformSettings {
  @Prop({ default: 14 })
  defaultTrialDays: number;

  @Prop({ default: false })
  maintenanceMode: boolean;

  @Prop({ type: Object, default: { Starter: 10, Growth: 50, Enterprise: 0 } })
  defaultPlanUserLimits: Record<string, number>;
}

export const PlatformSettingsSchema = SchemaFactory.createForClass(PlatformSettings);
