import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { SchemesController } from './schemes.controller';
import { SchemesService } from './schemes.service';
import { SchemeSchema } from '../schemas/scheme.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Scheme', schema: SchemeSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [SchemesController],
  providers: [SchemesService],
})
export class SchemesModule {}
