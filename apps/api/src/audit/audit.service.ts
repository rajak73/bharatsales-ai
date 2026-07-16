import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLogDocument } from '../schemas';

@Injectable()
export class AuditService {
  constructor(@InjectModel('AuditLog') private auditLogModel: Model<AuditLogDocument>) {}

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
}
