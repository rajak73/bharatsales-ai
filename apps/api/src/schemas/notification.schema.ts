import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NotificationLog as INotificationLog } from '@bharatsales/shared-types';

export type NotificationLogDocument = NotificationLog & Document;

@Schema({ timestamps: true, collection: 'notification_logs' })
export class NotificationLog implements Omit<INotificationLog, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true, enum: ['SMS', 'WhatsApp', 'Email'] }) method: 'SMS' | 'WhatsApp' | 'Email';
  @Prop({ required: true }) to: string;
  @Prop() message?: string;
  @Prop() templateId?: string;
  @Prop({ type: Object }) payload?: any;
  @Prop({ required: true, enum: ['Pending', 'Sent', 'Failed'], default: 'Sent' }) status: 'Pending' | 'Sent' | 'Failed';
}

export const NotificationLogSchema = SchemaFactory.createForClass(NotificationLog);
