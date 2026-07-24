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
    delete (data as any).organizationId;
    delete (data as any)._id;
    delete (data as any).createdAt;
    delete (data as any).updatedAt;
    const newInventory = new this.inventoryModel({
      ...data,
      organizationId,
    });
    return newInventory.save();
  }

  async checkStockAvailable(organizationId: string, productId: string, quantity: number, minShelfLifeDays: number = 0): Promise<boolean> {
    const minExpiryDate = new Date();
    minExpiryDate.setDate(minExpiryDate.getDate() + minShelfLifeDays);

    const query: any = {
      organizationId,
      productId,
      stock: { $gt: 0 },
      blocked: { $ne: true },
      $or: [
        { status: { $exists: false } },
        { status: 'Active' }
      ],
      $and: [
        {
          $or: [
            { expiry: { $exists: false } },
            { expiry: null },
            { expiry: { $gt: minExpiryDate.toISOString() } }
          ]
        }
      ]
    };

    const inventoryItems = await this.inventoryModel.find(query).exec();
    const totalStock = inventoryItems.reduce((sum, item) => sum + (item.stock || 0), 0);
    return totalStock >= quantity;
  }

  async reserveStock(
    organizationId: string, 
    productId: string, 
    quantity: number, 
    warehouseId?: string, 
    session?: any,
    manualAllocations?: { batch: string; quantity: number }[],
    minShelfLifeDays: number = 0
  ): Promise<{ inventoryId: string; batch: string; quantity: number }[]> {
    this.logger.log(`Reserving ${quantity} of product ${productId} for org ${organizationId}`);
    
    // If manual allocations are provided, use them directly (assumes validation/permission was done beforehand)
    if (manualAllocations && manualAllocations.length > 0) {
      let allocatedTotal = 0;
      const finalAllocations: { inventoryId: string; batch: string; quantity: number }[] = [];
      for (const manual of manualAllocations) {
        const query: any = { organizationId, productId, batch: manual.batch };
        if (warehouseId) query.warehouseId = warehouseId;
        const inventory = await this.inventoryModel.findOne(query).session(session).exec();
        
        if (!inventory || inventory.stock < manual.quantity) {
           throw new Error(`Insufficient stock for manual batch override: ${manual.batch}`);
        }
        
        inventory.stock -= manual.quantity;
        inventory.reservedStock = (inventory.reservedStock || 0) + manual.quantity;
        await inventory.save({ session });
        
        allocatedTotal += manual.quantity;
        finalAllocations.push({
          inventoryId: (inventory as any)._id.toString(),
          batch: inventory.batch,
          quantity: manual.quantity
        });
      }
      if (allocatedTotal !== quantity) {
        throw new Error(`Manual allocations total ${allocatedTotal} does not match required quantity ${quantity}`);
      }
      return finalAllocations;
    }

    const minExpiryDate = new Date();
    minExpiryDate.setDate(minExpiryDate.getDate() + minShelfLifeDays);

    const query: any = { 
      organizationId, 
      productId, 
      stock: { $gt: 0 },
      blocked: { $ne: true },
      $or: [
        { status: { $exists: false } },
        { status: 'Active' }
      ],
    };
    if (warehouseId) query.warehouseId = warehouseId;
    
    // Check non-expired batch (if expiry exists, it must be > now + shelfLife)
    query.$and = [
      {
        $or: [
          { expiry: { $exists: false } },
          { expiry: null },
          { expiry: { $gt: minExpiryDate.toISOString() } }
        ]
      }
    ];

    // FEFO: Sort by expiry ascending, then createdAt for tie-breaker
    const inventoryItems = await this.inventoryModel.find(query)
      .sort({ expiry: 1, createdAt: 1, _id: 1 })
      .session(session)
      .exec();
    
    let remaining = quantity;
    const allocations: { inventoryId: string; batch: string; quantity: number }[] = [];
    
    for (const inventory of inventoryItems) {
      if (remaining <= 0) break;
      
      const take = Math.min(inventory.stock, remaining);
      inventory.stock -= take;
      inventory.reservedStock = (inventory.reservedStock || 0) + take;
      await inventory.save({ session });
      
      remaining -= take;
      allocations.push({
        inventoryId: (inventory as any)._id.toString(),
        batch: inventory.batch,
        quantity: take
      });
    }

    if (remaining > 0) {
      throw new Error(`Insufficient stock for product ${productId}. Required: ${quantity}, Missing: ${remaining}`);
    }
    
    return allocations;
  }

  async deductStock(
    organizationId: string, 
    productId: string, 
    quantity: number, 
    warehouseId?: string, 
    session?: any,
    allocations?: { inventoryId: string; batch: string; quantity: number }[]
  ): Promise<void> {
    this.logger.log(`Deducting ${quantity} of product ${productId} for org ${organizationId}`);
    
    if (allocations && allocations.length > 0) {
      for (const alloc of allocations) {
        const inventory = await this.inventoryModel.findOne({ _id: alloc.inventoryId, organizationId }).session(session).exec();
        if (inventory) {
          inventory.reservedStock -= alloc.quantity;
          if (inventory.reservedStock < 0) inventory.reservedStock = 0;
          await inventory.save({ session });
        }
      }
      return;
    }

    const query: any = { organizationId, productId, reservedStock: { $gt: 0 } };
    if (warehouseId) query.warehouseId = warehouseId;

    const inventoryItems = await this.inventoryModel.find(query).sort({ expiry: 1 }).session(session).exec();
    
    let remaining = quantity;
    for (const inventory of inventoryItems) {
      if (remaining <= 0) break;
      const take = Math.min(inventory.reservedStock, remaining);
      inventory.reservedStock -= take;
      await inventory.save({ session });
      remaining -= take;
    }

    if (remaining > 0) {
      throw new Error(`Insufficient reserved stock for product ${productId} to deduct`);
    }
  }

  async releaseReservedStock(
    organizationId: string, 
    productId: string, 
    quantity: number, 
    warehouseId?: string, 
    session?: any,
    allocations?: { inventoryId: string; batch: string; quantity: number }[]
  ): Promise<void> {
    this.logger.log(`Releasing ${quantity} of reserved product ${productId} for org ${organizationId}`);
    
    if (allocations && allocations.length > 0) {
      for (const alloc of allocations) {
        const inventory = await this.inventoryModel.findOne({ _id: alloc.inventoryId, organizationId }).session(session).exec();
        if (inventory) {
          inventory.reservedStock -= alloc.quantity;
          inventory.stock += alloc.quantity;
          if (inventory.reservedStock < 0) inventory.reservedStock = 0;
          await inventory.save({ session });
        }
      }
      return;
    }

    const query: any = { organizationId, productId, reservedStock: { $gt: 0 } };
    if (warehouseId) query.warehouseId = warehouseId;

    const inventoryItems = await this.inventoryModel.find(query).sort({ expiry: -1 }).session(session).exec();
    
    let remaining = quantity;
    for (const inventory of inventoryItems) {
      if (remaining <= 0) break;
      const take = Math.min(inventory.reservedStock, remaining);
      inventory.reservedStock -= take;
      inventory.stock += take;
      await inventory.save({ session });
      remaining -= take;
    }

    if (remaining > 0) {
      throw new Error(`Insufficient reserved stock for product ${productId} to release`);
    }
  }

  async adjustStock(organizationId: string, adjustment: { productId: string, batch: string, type: string, quantity: number, reason?: string, warehouseId?: string, status?: string, blocked?: boolean }, session?: any): Promise<Inventory> {
    const query: any = { organizationId, productId: adjustment.productId, batch: adjustment.batch };
    if (adjustment.warehouseId) query.warehouseId = adjustment.warehouseId;

    let inventory = await this.inventoryModel.findOne(query).session(session).exec();
    
    const isAddition = ['Correction (Positive)', 'Transfer In', 'Purchase'].includes(adjustment.type);
    const isSubtraction = ['Damage', 'Expiry', 'Correction (Negative)', 'Transfer Out'].includes(adjustment.type);
    
    const adjustmentQty = isAddition ? adjustment.quantity : (isSubtraction ? -adjustment.quantity : adjustment.quantity);

    if (inventory) {
      inventory.stock += adjustmentQty;
      if (inventory.stock < 0) {
         throw new Error(`Adjustment would result in negative stock. Current stock: ${inventory.stock - adjustmentQty}`);
      }
      if (adjustment.status) inventory.status = adjustment.status;
      if (adjustment.blocked !== undefined) inventory.blocked = adjustment.blocked;
      return inventory.save({ session });
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
        status: adjustment.status || 'Active',
        blocked: adjustment.blocked !== undefined ? adjustment.blocked : false
      });
      return newInventory.save({ session });
    }
  }
}
