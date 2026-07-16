import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from '../schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'bharatsales-super-secret-key-2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
