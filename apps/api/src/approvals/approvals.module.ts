import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { Approval, ApprovalSchema } from '../schemas/approval.schema';
import { ApprovalRule, ApprovalRuleSchema } from '../schemas/approval-rule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Approval.name, schema: ApprovalSchema },
      { name: ApprovalRule.name, schema: ApprovalRuleSchema }
    ]),
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService]
})
export class ApprovalsModule {}
