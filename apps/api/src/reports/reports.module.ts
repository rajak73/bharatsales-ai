import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { OrderSchema, OutletSchema, ReportJobSchema, ScheduledReportSchema, ClaimSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Outlet', schema: OutletSchema },
      { name: 'ReportJob', schema: ReportJobSchema },
      { name: 'ScheduledReport', schema: ScheduledReportSchema },
      { name: 'Claim', schema: ClaimSchema }
    ])
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
