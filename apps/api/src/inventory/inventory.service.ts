import { BadRequestException, ConflictException, ForbiddenException } from '../core/http-errors';
import { Logger } from '../core/logger';
import { Model } from 'mongoose';
import { Inventory } from '../schemas/inventory.schema';
import { Inventory as SharedInventory } from '@bharatsales/shared-types';

const ADDITION_TYPES = ['Correction (Positive)', 'Transfer In', 'Purchase'];
const SUBTRACTION_TYPES = ['Damage', 'Expiry', 'Correction (Negative)', 'Transfer Out'];
export const ADJUSTMENT_TYPES = [...ADDITION_TYPES, ...SUBTRACTION_TYPES] as const;

export interface StockAdjustment {
  productId: string;
  batch: string;
  type: string;
  quantity: number;
  reason?: string;
  warehouseId?: string;
  distributorId?: string;
  status?: string;
  blocked?: boolean;
  expiry?: string;
}

/**
 * FEFO ordering: earliest expiry first, batches with no expiry LAST (MongoDB
 * sorts null/missing before any value ascending, which used to make
 * undated batches get consumed first), then createdAt, then _id.
 */
export function compareFefo(a: any, b: any): number {
  const ea = a?.expiry ? new Date(a.expiry).getTime() : NaN;
  const eb = b?.expiry ? new Date(b.expiry).getTime() : NaN;
  const aHas = !Number.isNaN(ea);
  const bHas = !Number.isNaN(eb);
  if (aHas !== bHas) return aHas ? -1 : 1;
  if (aHas && bHas && ea !== eb) return ea - eb;
  const ca = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
  const cb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
  if (ca !== cb) return ca - cb;
  return String(a?._id ?? '').localeCompare(String(b?._id ?? ''));
}

export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private inventoryModel: Model<Inventory>,
    private productModel: Model<any>,
  ) {}

  async getInventory(organizationId: string, user?: any): Promise<Inventory[]> {
    this.logger.log(`Fetching inventory for org ${organizationId}`);
    const query: any = { organizationId };
    if (user && user.role === 'Distributor') {
      // A Distributor only sees their own stock, not the whole org's inventory.
      query.distributorId = user.distributorId || '__none__';
    }
    return this.inventoryModel.find(query).exec();
  }

  async getBatches(organizationId: string, productId: string, user?: any): Promise<Inventory[]> {
    // Same distributor scoping as getInventory.
    const scope: any = {};
    if (user && user.role === 'Distributor') {
      scope.distributorId = user.distributorId || '__none__';
    }
    const batches = await this.inventoryModel.find({ 
      organizationId, 
      productId,
      ...scope,
      stock: { $gt: 0 },
      blocked: { $ne: true },
      $or: [
        { status: { $exists: false } },
        { status: 'Active' }
      ]
    }).sort({ expiry: 1, createdAt: 1 }).exec();
    return [...batches].sort(compareFefo);
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
    minShelfLifeDays: number = 0,
    // Restrict reservations (FEFO and manual) to this distributor's batches.
    distributorId?: string,
  ): Promise<{ inventoryId: string; batch: string; quantity: number }[]> {
    this.logger.log(`Reserving ${quantity} of product ${productId} for org ${organizationId}`);
    
    const minExpiryDate = new Date();
    minExpiryDate.setDate(minExpiryDate.getDate() + minShelfLifeDays);

    // Same eligibility rules as the FEFO path: not blocked, Active (or no
    // status), and not expired / within the minimum shelf life.
    const eligibilityFilter = (): any => ({
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
      ],
    });

    // If manual allocations are provided, validate each one against the same filters as FEFO
    if (manualAllocations && manualAllocations.length > 0) {
      for (const manual of manualAllocations) {
        if (!manual || typeof manual.batch !== 'string' || !manual.batch
          || typeof manual.quantity !== 'number' || !Number.isInteger(manual.quantity) || manual.quantity <= 0) {
          throw new BadRequestException('Manual allocations must each specify a batch and a positive integer quantity');
        }
      }
      let allocatedTotal = 0;
      const finalAllocations: { inventoryId: string; batch: string; quantity: number }[] = [];
      for (const manual of manualAllocations) {
        const query: any = { organizationId, productId, batch: manual.batch, ...eligibilityFilter() };
        if (warehouseId) query.warehouseId = warehouseId;
        if (distributorId) query.distributorId = distributorId;
        const inventory = await this.inventoryModel.findOne(query).session(session).exec();
        
        if (!inventory || inventory.stock < manual.quantity) {
           throw new ConflictException(`Insufficient stock for manual batch override: ${manual.batch}`);
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
        throw new BadRequestException(`Manual allocations total ${allocatedTotal} does not match required quantity ${quantity}`);
      }
      return finalAllocations;
    }

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
    if (distributorId) query.distributorId = distributorId;
    
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

    // FEFO: Sort by expiry ascending (undated batches last), then createdAt for tie-breaker
    const fetched = await this.inventoryModel.find(query)
      .sort({ expiry: 1, createdAt: 1, _id: 1 })
      .session(session)
      .exec();
    const inventoryItems = [...fetched].sort(compareFefo);
    
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
      throw new ConflictException(`Insufficient stock for product ${productId}. Required: ${quantity}, Missing: ${remaining}`);
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
      throw new ConflictException(`Insufficient reserved stock for product ${productId} to deduct`);
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
      throw new ConflictException(`Insufficient reserved stock for product ${productId} to release`);
    }
  }

  /**
   * POST /inventory/adjust — the user-facing entry point. Applies the
   * request-level rules on top of adjustStock:
   *  - a Distributor can only ever adjust their own stock (distributorId comes
   *    from their JWT, never from the body);
   *  - Purchase / Transfer In that creates a new batch must carry an expiry,
   *    otherwise the batch would be undated and FEFO could never age it out.
   *    (Adding to an existing batch keeps that batch's expiry; the web UI only
   *    adjusts existing batches and doesn't send one. Internal callers such as
   *    returns restocking go through adjustStock directly and are exempt.)
   */
  async adjustStockForUser(
    organizationId: string,
    adjustment: StockAdjustment,
    user: { role: string; distributorId?: string },
  ): Promise<Inventory> {
    const data: StockAdjustment = { ...adjustment };
    if (user.role === 'Distributor') {
      if (!user.distributorId) {
        throw new ForbiddenException('Your account is not linked to a distributor');
      }
      if (data.distributorId && data.distributorId !== user.distributorId) {
        throw new ForbiddenException('You can only adjust your own distributor stock');
      }
      data.distributorId = user.distributorId;
    }
    return this.adjustStock(organizationId, data, undefined, { requireExpiryForNewBatch: true });
  }

  async adjustStock(
    organizationId: string,
    adjustment: StockAdjustment,
    session?: any,
    opts: { requireExpiryForNewBatch?: boolean } = {},
  ): Promise<Inventory> {
    if (typeof adjustment.quantity !== 'number' || !Number.isFinite(adjustment.quantity)) {
      throw new BadRequestException('quantity must be a number');
    }
    if (adjustment.type === 'Purchase' && adjustment.quantity < 0) {
      throw new BadRequestException('Purchase quantity cannot be negative');
    }
    if (adjustment.expiry !== undefined && Number.isNaN(new Date(adjustment.expiry).getTime())) {
      throw new BadRequestException('expiry must be a valid date');
    }

    const query: any = { organizationId, productId: adjustment.productId, batch: adjustment.batch };
    if (adjustment.warehouseId) query.warehouseId = adjustment.warehouseId;
    if (adjustment.distributorId) query.distributorId = adjustment.distributorId;

    let inventory = await this.inventoryModel.findOne(query).session(session).exec();
    
    const isAddition = ADDITION_TYPES.includes(adjustment.type);
    const isSubtraction = SUBTRACTION_TYPES.includes(adjustment.type);
    
    const adjustmentQty = isAddition ? adjustment.quantity : (isSubtraction ? -adjustment.quantity : adjustment.quantity);
    const needsExpiry = ['Purchase', 'Transfer In'].includes(adjustment.type) && adjustmentQty > 0;

    if (inventory) {
      inventory.stock += adjustmentQty;
      if (inventory.stock < 0) {
         throw new BadRequestException(`Adjustment would result in negative stock. Current stock: ${inventory.stock - adjustmentQty}`);
      }
      if (!inventory.expiry && adjustment.expiry) inventory.expiry = new Date(adjustment.expiry).toISOString();
      if (adjustment.status) inventory.status = adjustment.status;
      if (adjustment.blocked !== undefined) inventory.blocked = adjustment.blocked;
      return inventory.save({ session });
    } else {
      if (adjustmentQty < 0) throw new BadRequestException('Cannot reduce stock below 0 for a non-existent batch.');
      if (needsExpiry && !adjustment.expiry && opts.requireExpiryForNewBatch) {
        throw new BadRequestException(`expiry is required when adding a new batch via ${adjustment.type}`);
      }
      
      const product = await this.productModel.findOne({ _id: adjustment.productId, organizationId }).exec();
      if (!product) {
        throw new BadRequestException(`Product ${adjustment.productId} not found`);
      }

      const newInventory = new this.inventoryModel({
        organizationId,
        productId: adjustment.productId,
        productName: product.name,
        sku: product.sku,
        batch: adjustment.batch,
        stock: adjustmentQty,
        expiry: adjustment.expiry ? new Date(adjustment.expiry).toISOString() : undefined,
        warehouseId: adjustment.warehouseId,
        distributorId: adjustment.distributorId,
        status: adjustment.status || 'Active',
        blocked: adjustment.blocked !== undefined ? adjustment.blocked : false
      });
      return newInventory.save({ session });
    }
  }
}
