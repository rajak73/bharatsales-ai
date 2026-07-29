import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AppNotification as IAppNotification } from '@bharatsales/shared-types';

export type AppNotificationDocument = AppNotification & Document;

@Schema({ timestamps: true, collection: 'app_notifications' })
export class AppNotification implements Omit<IAppNotification, 'id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true, index: true }) organizationId: string;
  @Prop({ required: true, index: true }) userId: string;
  @Prop({ required: true }) type: string;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) message: string;
  @Prop({ required: true }) time: string;
  @Prop({ default: false }) read: boolean;
}

export const AppNotificationSchema = SchemaFactory.createForClass(AppNotification);

// Transform _id to id when sending to frontend
AppNotificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});
