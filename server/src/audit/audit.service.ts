import { Model } from 'mongoose';
import { AuditLogDocument } from '../schemas';

export class AuditService {
  constructor(private auditLogModel: Model<AuditLogDocument>) {}

  async logAction(data: {
    organizationId: string;
    actorId: string;
    actorRole: string;
    action: string;
    entityName: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    deviceInfo?: string;
    reason?: string;
  }) {
    const log = new this.auditLogModel(data);
    await log.save();
  }

  async getGlobalLogs(limit: number = 50) {
    return this.auditLogModel.find().sort({ timestamp: -1, createdAt: -1 }).limit(limit).exec();
  }
}
