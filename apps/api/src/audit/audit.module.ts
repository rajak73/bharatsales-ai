import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditLogSchema } from '../schemas';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'AuditLog', schema: AuditLogSchema }])
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
