import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, index: true })
  organizationId: string;

  @Prop({ required: true, index: true })
  actorId: string;

  @Prop({ required: true })
  actorRole: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  entityName: string;

  @Prop()
  entityId?: string;

  @Prop({ type: Object })
  details: Record<string, any>;

  @Prop()
  ipAddress?: string;

  @Prop()
  deviceInfo?: string;

  @Prop()
  reason?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
