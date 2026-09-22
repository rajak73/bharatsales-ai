import { Schema, Document } from 'mongoose';

export type AppNotificationDocument = AppNotification & Document;

export interface AppNotification {
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const AppNotificationSchema = new Schema(
  {
    organizationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    time: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'app_notifications' },
);

// Transform _id to id when sending to frontend
AppNotificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});
