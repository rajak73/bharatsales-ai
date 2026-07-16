import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log_entity';
export const AuditEntity = (entityName: string) => SetMetadata(AUDIT_LOG_KEY, entityName);
