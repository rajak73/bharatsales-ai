import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { ClaimSchema } from '../schemas/claim.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Claim', schema: ClaimSchema }])
  ],
  controllers: [ClaimsController],
  providers: [ClaimsService],
  exports: [ClaimsService]
})
export class ClaimsModule {}
