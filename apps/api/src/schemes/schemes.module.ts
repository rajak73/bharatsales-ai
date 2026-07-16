import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchemesController } from './schemes.controller';
import { SchemesService } from './schemes.service';
import { Scheme, SchemeSchema } from '../schemas/scheme.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Scheme.name, schema: SchemeSchema }
    ]),
  ],
  controllers: [SchemesController],
  providers: [SchemesService],
  exports: [SchemesService],
})
export class SchemesModule {}
