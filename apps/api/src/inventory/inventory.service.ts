import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory } from '../schemas/inventory.schema';
import { Inventory as SharedInventory } from '@bharatsales/shared-types';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<Inventory>,
    @InjectModel('Product') private productModel: Model<any>,
  ) {}

  async getInventory(organizationId: string): Promise<Inventory[]> {
    this.logger.log(`Fetching inventory for org ${organizationId}`);
    return this.inventoryModel.find({ organizationId }).exec();
  }

  async create(organizationId: string, data: Omit<SharedInventory, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>): Promise<Inventory> {
    const newInventory = new this.inventoryModel({
      ...data,
      organizationId,
    });
    return newInventory.save();
  }

  async checkStockAvailable(organizationId: string, productId: string, quantity: number): Promise<boolean> {
    const inventoryItems = await this.inventoryModel.find({ organizationId, productId }).exec();
    const totalStock = inventoryItems.reduce((sum, item) => sum + (item.stock || 0), 0);
    return totalStock >= quantity;
  }

  async reserveStock(organizationId: string, productId: string, quantity: number, warehouseId?: string): Promise<void> {
    this.logger.log(`Reserving ${quantity} of product ${productId} for org ${organizationId}`);
    
    // Find the oldest batch with sufficient stock (FIFO-like), or simply just take from available.
    // For simplicity, we find any inventory entry with available stock >= quantity
    const query: any = { organizationId, productId, stock: { $gte: quantity } };
    if (warehouseId) query.warehouseId = warehouseId;
    
    const inventory = await this.inventoryModel.findOne(query).sort({ expiry: 1 }).exec();
    
    if (!inventory) {
      throw new Error(`Insufficient stock for product ${productId}`);
    }

    // Move stock to reservedStock
    inventory.stock -= quantity;
    inventory.reservedStock = (inventory.reservedStock || 0) + quantity;
    await inventory.save();
  }

  async deductStock(organizationId: string, productId: string, quantity: number, warehouseId?: string): Promise<void> {
    this.logger.log(`Deducting ${quantity} of product ${productId} for org ${organizationId}`);
    
    const query: any = { organizationId, productId, reservedStock: { $gte: quantity } };
    if (warehouseId) query.warehouseId = warehouseId;

    const inventory = await this.inventoryModel.findOne(query).sort({ expiry: 1 }).exec();
    
    if (!inventory) {
      throw new Error(`Insufficient reserved stock for product ${productId} to deduct`);
    }

    // Permanently remove from reservedStock
    inventory.reservedStock -= quantity;
    await inventory.save();
  }

  async releaseReservedStock(organizationId: string, productId: string, quantity: number, warehouseId?: string): Promise<void> {
    this.logger.log(`Releasing ${quantity} of reserved product ${productId} for org ${organizationId}`);
    
    const query: any = { organizationId, productId, reservedStock: { $gte: quantity } };
    if (warehouseId) query.warehouseId = warehouseId;

    const inventory = await this.inventoryModel.findOne(query).sort({ expiry: 1 }).exec();
    
    if (!inventory) {
      throw new Error(`Insufficient reserved stock for product ${productId} to release`);
    }

    // Move from reservedStock back to stock
    inventory.reservedStock -= quantity;
    inventory.stock += quantity;
    await inventory.save();
  }

  async adjustStock(organizationId: string, adjustment: { productId: string, batch: string, type: string, quantity: number, reason?: string, warehouseId?: string }): Promise<Inventory> {
    const query: any = { organizationId, productId: adjustment.productId, batch: adjustment.batch };
    if (adjustment.warehouseId) query.warehouseId = adjustment.warehouseId;

    let inventory = await this.inventoryModel.findOne(query).exec();
    
    const isAddition = ['Correction (Positive)', 'Transfer In', 'Purchase'].includes(adjustment.type);
    const isSubtraction = ['Damage', 'Expiry', 'Correction (Negative)', 'Transfer Out'].includes(adjustment.type);
    
    const adjustmentQty = isAddition ? adjustment.quantity : (isSubtraction ? -adjustment.quantity : adjustment.quantity);

    if (inventory) {
      inventory.stock += adjustmentQty;
      if (inventory.stock < 0) {
         throw new Error(`Adjustment would result in negative stock. Current stock: ${inventory.stock - adjustmentQty}`);
      }
      return inventory.save();
    } else {
      if (adjustmentQty < 0) throw new Error('Cannot reduce stock below 0 for a non-existent batch.');
      
      const product = await this.productModel.findById(adjustment.productId).exec();
      if (!product) {
        throw new Error(`Product ${adjustment.productId} not found`);
      }

      const newInventory = new this.inventoryModel({
        organizationId,
        productId: adjustment.productId,
        productName: product.name,
        sku: product.sku,
        batch: adjustment.batch,
        stock: adjustmentQty,
        warehouseId: adjustment.warehouseId,
      });
      return newInventory.save();
    }
  }
}
