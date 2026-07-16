import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../schemas/product.schema';
import { Product as SharedProduct } from '@bharatsales/shared-types';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  async findAllByOrgId(organizationId: string): Promise<Product[]> {
    return this.productModel.find({ organizationId }).exec();
  }

  async create(organizationId: string, productData: Omit<SharedProduct, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const newProduct = new this.productModel({
      ...productData,
      organizationId,
      status: productData.status || 'Active', // Default status if not provided
    });
    return newProduct.save();
  }

  async update(organizationId: string, id: string, updateData: Partial<SharedProduct>): Promise<Product> {
    const product = await this.productModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateData },
      { new: true }
    ).exec();
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  }

  async remove(organizationId: string, id: string): Promise<{ deleted: boolean }> {
    const product = await this.productModel.findOneAndDelete({ _id: id, organizationId }).exec();
    if (!product) {
      throw new Error('Product not found');
    }
    return { deleted: true };
  }
}
