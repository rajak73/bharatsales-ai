import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PriceListsController } from './price-lists.controller';
import { PriceListsService } from './price-lists.service';
import { PriceListSchema } from '../schemas/price-list.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'PriceList', schema: PriceListSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [PriceListsController],
  providers: [PriceListsService],
})
export class PriceListsModule {}
