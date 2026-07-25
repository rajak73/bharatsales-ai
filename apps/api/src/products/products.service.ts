import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../schemas/product.schema';
import { Product as SharedProduct, Outlet } from '@bharatsales/shared-types';
import { Outlet as OutletSchema } from '../schemas/outlet.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(OutletSchema.name) private outletModel: Model<Outlet>
  ) {}

  async findAllByOrgId(organizationId: string): Promise<Product[]> {
    return this.productModel.find({ organizationId }).exec();
  }

  async getCatalog(organizationId: string): Promise<Product[]> {
    return this.productModel.find({ organizationId, status: 'Active' }).select('-taxHistory -createdAt -updatedAt').exec();
  }

  async getProductForOutlet(organizationId: string, id: string, outletId: string): Promise<any> {
    const product = await this.productModel.findOne({ _id: id, organizationId }).exec();
    if (!product) throw new NotFoundException('Product not found');

    const outlet = await this.outletModel.findOne({ _id: outletId, organizationId }).exec();
    if (!outlet) throw new NotFoundException('Outlet not found');

    const result = product.toObject();
    const tierPricing = result.pricing.tierPricing;
    if (outlet.tier && tierPricing) {
      let overridePrice: number | undefined;
      // Handle both Map and plain object
      if (tierPricing instanceof Map) {
        overridePrice = (tierPricing as any).get(outlet.tier);
      } else {
        overridePrice = tierPricing[outlet.tier];
      }
      
      if (overridePrice !== undefined) {
        result.pricing.basePrice = overridePrice;
      }
    }
    
    return result;
  }

  async create(organizationId: string, productData: Omit<SharedProduct, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    delete (productData as any).organizationId;
    delete (productData as any)._id;
    delete (productData as any).createdAt;
    delete (productData as any).updatedAt;
    if (productData.pricing?.ptr > productData.pricing?.mrp) {
      throw new Error('PTR (Price to Retailer) cannot be greater than MRP');
    }
    const newProduct = new this.productModel({
      ...productData,
      organizationId,
      status: productData.status || 'Active', // Default status if not provided
    });
    return newProduct.save();
  }

  async update(organizationId: string, id: string, updateData: Partial<SharedProduct>): Promise<Product> {
    delete (updateData as any).organizationId;
    delete (updateData as any)._id;
    delete (updateData as any).createdAt;
    delete (updateData as any).updatedAt;
    if (updateData.pricing && updateData.pricing.ptr > updateData.pricing.mrp) {
      throw new Error('PTR (Price to Retailer) cannot be greater than MRP');
    }

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
