import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';
import { VisitSchema } from '../schemas/visit.schema';
import { OutletSchema } from '../schemas/outlet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Visit', schema: VisitSchema },
      { name: 'Outlet', schema: OutletSchema }
    ])
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
