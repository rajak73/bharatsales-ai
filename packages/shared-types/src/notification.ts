export interface NotificationLog {
  id: string;
  organizationId: string;
  method: 'SMS' | 'WhatsApp' | 'Email';
  to: string;
  message?: string;
  templateId?: string;
  payload?: any;
  status: 'Pending' | 'Sent' | 'Failed';
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
