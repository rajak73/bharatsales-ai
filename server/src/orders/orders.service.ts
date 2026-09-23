import { BadRequestException, ForbiddenException } from '../core/http-errors';
import { Logger } from '../core/logger';
import { Model, Connection } from 'mongoose';
import { RBAC, Action, Resource, Role } from '@bharatsales/permissions';
import { Order, Outlet, Scheme, Distributor, Product } from '@bharatsales/shared-types';
import { InventoryService } from '../inventory/inventory.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { AttendanceService } from '../attendance/attendance.service';
import { NotificationsService } from '../notifications/notifications.service';
import { asId } from '../core/query-safety';

export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private orderModel: Model<Order>,
    private outletModel: Model<Outlet>,
    private schemeModel: Model<Scheme>,
    private distributorModel: Model<Distributor>,
    private productModel: Model<Product>,
    private inventoryService: InventoryService,
    // (ModuleRef was injected here under Nest but never used — removed.)
    private approvalsService: ApprovalsService,
    private hierarchyService: HierarchyService,
    private attendanceService: AttendanceService,
    private notificationsService: NotificationsService,
    private connection: Connection,
  ) {}

  async findAll(organizationId: string, user?: any, mine?: boolean): Promise<Order[]> {
    const query: any = { organizationId };

    if (user && user.role === 'Distributor') {
      // A Distributor sees only orders routed to them, not territory-based access
      // (distributors aren't assigned territories the same way reps/managers are).
      query.assignedDistributorId = user.distributorId || '__none__';
    } else if (user && user.role === 'Sales Representative') {
      // A Sales Representative sees only their own orders, never another
      // rep's — territory scoping alone isn't enough here since a territory
      // can have more than one rep assigned to it.
      query.createdByUserId = user.sub;
    } else if (user && !['Super Admin', 'Organization Admin'].includes(user.role)) {
      if (!user.territoryIds || user.territoryIds.length === 0) {
        return []; // Non-admin with no territory sees nothing
      }

      const descendantIds = await this.hierarchyService.getDescendantTerritoryIds(organizationId, user.territoryIds);

      // Fetch outlets that belong to these territories
      const accessibleOutlets = await this.outletModel.find({
        organizationId,
        territoryId: { $in: descendantIds }
      }).select('_id').exec();

      const accessibleOutletIds = accessibleOutlets.map(o => o._id.toString());
      query.outletId = { $in: accessibleOutletIds };
    }

    if (mine && user?.sub) {
      query.createdByUserId = user.sub;
    }

    return this.orderModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async create(organizationId: string, userId: string, orderData: Partial<Order>): Promise<Order> {
    delete (orderData as any).organizationId;
    delete (orderData as any)._id;
    delete (orderData as any).createdAt;
    delete (orderData as any).updatedAt;
    if (!orderData.idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required');
    }

    // 1. Idempotency Check (BR-019)
    const idempotencyKey = String(orderData.idempotencyKey);
    const existingOrder = await this.orderModel.findOne({ 
      organizationId, 
      idempotencyKey 
    });

    if (existingOrder) {
      this.logger.log(`Idempotent return for order ${orderData.idempotencyKey}`);
      return existingOrder;
    }

    // BR-002: Check Attendance Session
    const userRole = await this.hierarchyService.getUserRole(userId);
    if (!['Super Admin', 'Organization Admin'].includes(userRole?.name || '')) {
      const activeSession = await this.attendanceService.getCurrentSession(userId);
      if (!activeSession) {
        throw new BadRequestException('Cannot create order: Attendance not started. You must clock in first.');
      }
    }

    const outlet = await this.outletModel.findOne({ _id: asId(orderData.outletId), organizationId });
    if (!outlet) {
      throw new BadRequestException('Outlet not found');
    }

    // BR-003: Check Outlet Assignment
    if (!['Super Admin', 'Organization Admin'].includes(userRole?.name || '')) {
      const userTerritories = await this.hierarchyService.getUserTerritories(userId);
      const descendantIds = await this.hierarchyService.getDescendantTerritoryIds(organizationId, userTerritories);
      if (!outlet.territoryId || !descendantIds.includes(outlet.territoryId)) {
        throw new BadRequestException('Cannot create order: This outlet is not assigned to your territory.');
      }
    }

    // 2. Fetch Product Master Data to validate prices and calculate exact GST
    // Enforce tenant isolation (BRD Phase 8)
    const productIds = (orderData.items || []).map((i: any) => i.productId);
    const products = await this.productModel.find({ _id: { $in: productIds }, organizationId });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const schemeIds = (orderData.items || []).map((i: any) => i.appliedSchemeId).filter(Boolean);
    const schemes = await this.schemeModel.find({ _id: { $in: schemeIds }, organizationId });
    const schemeMap = new Map(schemes.map(s => [s._id.toString(), s]));

    // 3. Determine Inter-state vs Intra-state (BR-004) and Automatic Distributor Routing (BR-007)
    let isInterState = false;
    
    // Auto-route to the mapped distributor if not explicitly provided
    if (!orderData.assignedDistributorId && outlet.commercial?.assignedDistributorId) {
      orderData.assignedDistributorId = outlet.commercial.assignedDistributorId.toString();
    }

    let assignedDistributor = null;
    if (orderData.assignedDistributorId) {
      assignedDistributor = await this.distributorModel.findOne({ _id: String(orderData.assignedDistributorId), organizationId });
      if (assignedDistributor) {
        if (assignedDistributor.status !== 'Active') {
          throw new BadRequestException(`Cannot route order to inactive distributor ${assignedDistributor.name}`);
        }
        if (assignedDistributor.location?.state !== outlet.location?.state) {
          isInterState = true;
        }
      }
    }

    // 4. Validate Items (BR-022 Minimum Price, Scheme Validation & BR-004 GST Calculation)
    let requiresApproval = false;
    let approvalReason = '';

    const items = (orderData.items || []).map((item: any) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      // BR-022: Scheme validation (if applied)
      if (item.appliedSchemeId) {
        const scheme = schemeMap.get(item.appliedSchemeId);
        if (!scheme) {
          throw new BadRequestException(`Scheme ${item.appliedSchemeId} not found`);
        }
        if (!scheme.isActive) {
          throw new BadRequestException(`Scheme ${scheme.name} is not active`);
        }
        const now = new Date();
        if (now < new Date(scheme.validFrom) || now > new Date(scheme.validUntil)) {
          throw new BadRequestException(`Scheme ${scheme.name} is expired or not yet started`);
        }
      }

      // Trigger approval instead of throwing error if price is below minimum (BR-022)
      if (item.unitPrice < product.pricing.basePrice) {
        requiresApproval = true;
        approvalReason = `Unit price of ${product.name} is below minimum base price of ${product.pricing.basePrice}.`;
      }

      // Trigger approval if item quantity is less than Minimum Order Quantity (BR-023)
      if (item.quantity < (product.moq || 1)) {
        requiresApproval = true;
        approvalReason = `Quantity of ${product.name} (${item.quantity}) is below MOQ of ${product.moq || 1}.`;
      }

      const baseSubTotal = item.unitPrice * item.quantity;
      const discount = Number(item.discount) || 0;
      if (discount < 0 || discount > baseSubTotal) {
        throw new BadRequestException(
          `Discount on ${product.name} (${discount}) cannot exceed the line value (${baseSubTotal}).`,
        );
      }
      // A line discount lowers the effective unit price just like a price
      // override does, so it goes through the same BR-022 approval.
      const effectiveUnitPrice = item.quantity > 0 ? (baseSubTotal - discount) / item.quantity : item.unitPrice;
      if (discount > 0 && effectiveUnitPrice < product.pricing.basePrice) {
        requiresApproval = true;
        approvalReason = `Discounted unit price of ${product.name} (${effectiveUnitPrice.toFixed(2)}) is below minimum base price of ${product.pricing.basePrice}.`;
      }
      const subTotal = baseSubTotal - discount;
      
      const gstRate = product.pricing.gstPercentage || 0;
      const gstAmount = parseFloat((subTotal * (gstRate / 100)).toFixed(2));
      
      let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
      
      if (isInterState) {
        igstAmount = gstAmount;
      } else {
        // Fix precision issues so cgst + sgst perfectly equals gstAmount
        cgstAmount = Math.round((gstAmount / 2) * 100) / 100;
        sgstAmount = Math.round((gstAmount - cgstAmount) * 100) / 100;
      }

      return {
        ...item,
        sku: product.sku,
        name: product.name,
        discount: item.discount || 0,
        gstPercentage: gstRate,
        subTotal: parseFloat(subTotal.toFixed(2)),
        cgstAmount,
        sgstAmount,
        igstAmount,
        total: parseFloat((subTotal + cgstAmount + sgstAmount + igstAmount).toFixed(2)),
      };
    });

    const totals = {
      subTotal: parseFloat(items.reduce((sum: number, item: any) => sum + item.subTotal, 0).toFixed(2)),
      discountTotal: parseFloat(items.reduce((sum: number, item: any) => sum + item.discount, 0).toFixed(2)),
      cgstTotal: parseFloat(items.reduce((sum: number, item: any) => sum + item.cgstAmount, 0).toFixed(2)),
      sgstTotal: parseFloat(items.reduce((sum: number, item: any) => sum + item.sgstAmount, 0).toFixed(2)),
      igstTotal: parseFloat(items.reduce((sum: number, item: any) => sum + item.igstAmount, 0).toFixed(2)),
      grandTotal: parseFloat(items.reduce((sum: number, item: any) => sum + item.total, 0).toFixed(2)),
    };

    // 5. Credit Exposure Calculation (BR-006)
    // Fetch all open orders to calculate unbilled exposure
    const openOrders = await this.orderModel.find({
      outletId: outlet._id,
      status: { $in: ['Pending', 'Submitted', 'Approved', 'Dispatched'] }
    });

    const unbilledOrderExposure = openOrders.reduce((sum, ord) => sum + (ord.totals?.grandTotal || (ord as any).total || 0), 0);
    const projectedExposure = outlet.commercial.outstandingBalance + unbilledOrderExposure + totals.grandTotal;

    let projectedDistributorExposure = totals.grandTotal;
    if (assignedDistributor) {
      const openDistributorOrders = await this.orderModel.find({
        assignedDistributorId: assignedDistributor._id,
        status: { $in: ['Pending', 'Submitted', 'Approved', 'Dispatched'] }
      });
      const unbilledDistributorExposure = openDistributorOrders.reduce((sum, ord) => sum + (ord.totals?.grandTotal || (ord as any).total || 0), 0);
      projectedDistributorExposure += ((assignedDistributor as any).commercial?.outstandingBalance || 0) + unbilledDistributorExposure;
    }

    // Clients may only choose between saving a Draft and submitting. Any other
    // client-supplied status (e.g. 'Approved') is ignored — the server decides
    // Pending_Approval / Hold_Credit / Hold_Stock below.
    let initialStatus: Order['status'] = orderData.status === 'Draft' ? 'Draft' : 'Submitted';
    
    // Draft orders skip credit and stock checks completely until submitted
    if (initialStatus === 'Draft') {
      this.logger.log(`Order saved as Draft for outlet ${outlet._id}`);
    } else {
      if (requiresApproval) {
      initialStatus = 'Pending_Approval';
      this.logger.warn(`Order placed on Pending_Approval. Reason: ${approvalReason}`);
    } else if (projectedExposure > outlet.commercial.creditLimit) {
      initialStatus = 'Hold_Credit';
      this.logger.warn(`Order placed on Hold_Credit. Projected Exposure: ₹${projectedExposure}, Limit: ₹${outlet.commercial.creditLimit}`);
    } else if (assignedDistributor && ((assignedDistributor as any).commercial?.creditLimit ?? 0) > 0 && projectedDistributorExposure > (assignedDistributor as any).commercial.creditLimit) {
      initialStatus = 'Hold_Credit';
      this.logger.warn(`Order placed on Hold_Credit for Distributor. Projected Exposure: ₹${projectedDistributorExposure}, Limit: ₹${(assignedDistributor as any).commercial.creditLimit}`);
    } else {
      // BR-016: If exposure is fine, check stock availability.
      let hasInsufficientStock = false;
      for (const item of items) {
        const isStockAvailable = await this.inventoryService.checkStockAvailable(organizationId, item.productId, item.quantity);
        if (!isStockAvailable) {
          hasInsufficientStock = true;
          break;
        }
      }
      if (hasInsufficientStock) {
        initialStatus = 'Hold_Stock';
        this.logger.warn(`Order placed on Hold_Stock due to insufficient inventory for one or more items.`);
      }
    }
    } // Missing brace added

    // Never trust client-supplied workflow/audit fields.
    delete (orderData as any).statusHistory;
    delete (orderData as any).createdByUserId;

    const newOrder = new this.orderModel({
      ...orderData,
      orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
      createdByUserId: userId,
      items,
      totals,
      organizationId,
      status: initialStatus,
    });

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const savedOrder = await newOrder.save({ session });

      if (initialStatus === 'Pending_Approval') {
        await this.approvalsService.createApproval(organizationId, {
          outlet: outlet.name,
          order: savedOrder.orderNumber,
          type: 'Price Override',
          reason: approvalReason,
          amount: totals.grandTotal,
          priority: 'High',
          requestedBy: userId
        });
      }

      await session.commitTransaction();
      return savedOrder;
    } catch (error: any) {
      await session.abortTransaction();
      // Handle race condition on idempotency key
      if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
        this.logger.log(`Idempotent return (race condition) for order ${orderData.idempotencyKey}`);
        return this.orderModel.findOne({ organizationId, idempotencyKey }) as any;
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateStatus(
    organizationId: string, 
    orderId: string, 
    status: Order['status'], 
    actorId: string, 
    reason?: string,
    session?: any
  ): Promise<Order> {
    const order = await this.orderModel.findOne({ _id: asId(orderId), organizationId }).session(session);
    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    // Mirrors the real persisted status enum on the Order schema exactly
    // (server/src/schemas/order.schema.ts) — previously included
    // 'Allocated'/'Damaged_Delivery'/'Returned'/'Closed' transitions that
    // aren't valid enum values, so those states could never actually be
    // reached (Mongoose validation would reject them).
    const validTransitions: Record<string, string[]> = {
      'Draft': ['Submitted', 'Cancelled'],
      'Submitted': ['Pending_Approval', 'Hold_Credit', 'Hold_Stock', 'Approved', 'Rejected', 'Cancelled'],
      'Pending_Approval': ['Submitted', 'Approved', 'Rejected', 'Cancelled'],
      'Hold_Credit': ['Approved', 'Rejected', 'Cancelled'],
      'Hold_Stock': ['Approved', 'Rejected', 'Cancelled'],
      'Approved': ['Dispatched', 'Cancelled'],
      'Dispatched': ['Delivered', 'Partial_Delivery', 'Cancelled'],
      'Delivered': [],
      'Partial_Delivery': [],
      'Rejected': [],
      'Cancelled': []
    };

    if (validTransitions[order.status as string] && !validTransitions[order.status as string].includes(status as string)) {
      throw new BadRequestException(`Invalid order state transition from ${order.status} to ${status}`);
    }

    order.status = status;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status,
      actorId,
      timestamp: new Date().toISOString(),
      reason
    });

    return await order.save({ session }) as any;
  }

  /**
   * PUT /orders/:id/status. A bare status change must never let a user skip
   * the real workflows (stock reservation on approve, stock deduction on
   * dispatch, reservation release on cancel/reject), and only roles holding
   * Orders:Approve may move an order forward. The one thing a user without
   * Orders:Approve may do here is cancel an order they created themselves.
   */
  async changeStatus(
    organizationId: string,
    orderId: string,
    status: Order['status'],
    user: { sub: string; role: string; distributorId?: string },
    reason?: string,
  ): Promise<Order> {
    const order: any = await this.findById(organizationId, orderId);
    const canApprove = RBAC.can(user.role as Role, Action.Approve, Resource.Orders);
    const isCreator = !!order.createdByUserId && order.createdByUserId.toString() === user.sub;

    if (status === 'Cancelled') {
      if (!canApprove && !isCreator) {
        throw new ForbiddenException('Only the order creator or an approver can cancel this order');
      }
    } else if (!canApprove) {
      throw new ForbiddenException(`User with role ${user.role} does not have approve permission on ${Resource.Orders}`);
    }
    if (!(status === 'Cancelled' && isCreator)) {
      this.assertDistributorOwnsOrder(order, user);
    }

    switch (status) {
      case 'Cancelled':
        // Releases any stock reservations held by an Approved order.
        return this.cancelOrder(organizationId, orderId, user.sub, reason);
      case 'Approved':
        // Goes through FEFO reservation, exactly like POST /orders/:id/approve.
        return this.approveOrder(organizationId, orderId, user.sub, undefined, reason, this.reservationScope(user));
      case 'Rejected':
        return this.rejectOrder(organizationId, orderId, user.sub, reason);
      case 'Dispatched':
        // Deducts reserved stock, exactly like POST /orders/:id/dispatch.
        return this.dispatchOrder(organizationId, orderId, user.sub);
      default:
        return this.updateStatus(organizationId, orderId, status, user.sub, reason);
    }
  }

  /**
   * A Distributor only ever sees orders routed to them (see findAll); make
   * sure they also can't approve/dispatch/reject someone else's order by id.
   */
  async assertDistributorCanActOnOrder(
    organizationId: string,
    orderId: string,
    user: { role: string; distributorId?: string },
  ): Promise<void> {
    if (user.role !== 'Distributor') return;
    const order = await this.findById(organizationId, orderId);
    this.assertDistributorOwnsOrder(order, user);
  }

  assertDistributorOwnsOrder(order: any, user: { role: string; distributorId?: string }): void {
    if (user.role === 'Distributor') {
      const assigned = order?.assignedDistributorId?.toString();
      if (!user.distributorId || assigned !== user.distributorId) {
        throw new ForbiddenException('This order is not assigned to you');
      }
    }
  }

  async approveOrder(
    organizationId: string, 
    orderId: string, 
    actorId: string, 
    manualAllocations?: Record<string, { batch: string; quantity: number }[]>,
    reason?: string,
    // When the approver is a Distributor, only their own batches may be
    // reserved (never another distributor's or the company's stock).
    opts: { distributorId?: string } = {},
  ): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();
    let aborted = false;
    try {
      const order = await this.orderModel.findOne({ _id: asId(orderId), organizationId }).session(session);
      if (!order) {
        throw new BadRequestException(`Order ${orderId} not found`);
      }

      if (!['Submitted', 'Hold_Stock', 'Pending_Approval'].includes(order.status as string)) {
        throw new BadRequestException(`Order cannot be approved from status ${order.status}`);
      }
      // Pending_Approval means a manager has to sign off a price/MOQ
      // exception first (Approvals). A Distributor accepting the order must
      // not be able to skip that step.
      if (order.status === 'Pending_Approval' && opts.distributorId) {
        throw new ForbiddenException('This order is waiting for manager approval of its pricing');
      }
      const wasPendingApproval = order.status === 'Pending_Approval';

      if (manualAllocations && !reason) {
        throw new BadRequestException('A reason is mandatory when providing manual batch overrides');
      }

      // Reserve stock for all items (FEFO) and capture batch allocations
      let hasInsufficientStock = false;
      for (const item of order.items || []) {
        try {
          const product = await this.productModel.findOne({ _id: item.productId, organizationId }).session(session);
          const minShelfLife = product?.shelfLifeDays ? Math.floor(product.shelfLifeDays * 0.2) : 0; // Require at least 20% shelf life remaining

          const itemManualAllocations = manualAllocations ? manualAllocations[item.productId] : undefined;
          const allocations = await this.inventoryService.reserveStock(
            organizationId, 
            item.productId, 
            item.quantity, 
            undefined, 
            session,
            itemManualAllocations,
            minShelfLife,
            opts.distributorId,
          );
          item.allocations = allocations;
        } catch (error: any) {
          if (error.message.includes('Insufficient stock')) {
            hasInsufficientStock = true;
            break;
          } else {
            throw error;
          }
        }
      }

      if (hasInsufficientStock) {
        // Roll back every reservation already made for earlier items in this
        // attempt: committing them alongside Hold_Stock leaked reservedStock,
        // because re-approving a Hold_Stock order reserves (and overwrites
        // item.allocations) all over again.
        await session.abortTransaction();
        aborted = true;
        // Record the hold directly: going through updateStatus would attempt
        // a Hold_Stock -> Hold_Stock transition, which isn't a valid transition.
        const held = await this.orderModel.findOneAndUpdate(
          { _id: orderId, organizationId },
          {
            $set: { status: 'Hold_Stock' },
            $push: {
              statusHistory: {
                status: 'Hold_Stock',
                actorId,
                timestamp: new Date().toISOString(),
                reason: 'Insufficient stock during approval attempt',
              },
            },
          } as any,
          { new: true },
        );
        return held as any;
      }

      order.markModified('items');
      await order.save({ session });
      const updated = await this.updateStatus(organizationId, orderId, 'Approved', actorId, reason || 'Approved by web dashboard', session);
      await session.commitTransaction();

      if (wasPendingApproval && order.orderNumber) {
        // Approving the order directly also settles its pending price request.
        this.approvalsService.settlePendingForOrder(organizationId, order.orderNumber, 'Approved')
          .catch(err => this.logger.error('Failed to settle approval request', err));
      }

      this.notificationsService.create(organizationId, order.createdByUserId, {
        type: 'order_approved',
        title: 'Order Approved',
        message: `Your order ${order.orderNumber || orderId} has been approved.`
      }).catch(err => this.logger.error('Failed to create order-approved notification', err));

      return updated;
    } catch (error) {
      if (!aborted) await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async dispatchOrder(organizationId: string, orderId: string, actorId: string): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findOne({ _id: asId(orderId), organizationId }).session(session);
      if (!order) {
        throw new BadRequestException(`Order ${orderId} not found`);
      }

      if (order.status !== 'Approved') {
        throw new BadRequestException(`Order cannot be dispatched from status ${order.status}`);
      }

      // Deduct stock for all items using specific batch allocations
      for (const item of order.items || []) {
        await this.inventoryService.deductStock(organizationId, item.productId, item.quantity, undefined, session, item.allocations);
      }

      const updated = await this.updateStatus(organizationId, orderId, 'Dispatched', actorId, 'Dispatched via operations', session);
      await session.commitTransaction();
      return updated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /** Batch scope for stock reservations made on behalf of `user`. */
  reservationScope(user: { role: string; distributorId?: string }): { distributorId?: string } {
    if (user.role !== 'Distributor') return {};
    if (!user.distributorId) throw new ForbiddenException('Distributor account is not linked to a distributor');
    return { distributorId: user.distributorId };
  }

  /**
   * GET /orders/:id — same visibility rules as findAll: reps see only their
   * own orders, distributors only orders routed to them, other non-admins
   * only orders for outlets in their territories. Anything else is a 404-style
   * "not found" so ids of other users' orders are not confirmed.
   */
  async findByIdForUser(organizationId: string, orderId: string, user: any): Promise<Order> {
    const order: any = await this.findById(organizationId, orderId);
    if (!user || ['Super Admin', 'Organization Admin'].includes(user.role)) return order;

    let visible: boolean;
    if (user.role === 'Distributor') {
      visible = !!user.distributorId && order.assignedDistributorId?.toString() === user.distributorId;
    } else if (user.role === 'Sales Representative') {
      visible = order.createdByUserId?.toString() === user.sub;
    } else {
      if (!user.territoryIds || user.territoryIds.length === 0) {
        visible = false;
      } else {
        const descendantIds = await this.hierarchyService.getDescendantTerritoryIds(organizationId, user.territoryIds);
        const outlet = await this.outletModel
          .findOne({ _id: order.outletId, organizationId, territoryId: { $in: descendantIds } })
          .select('_id')
          .exec();
        visible = !!outlet;
      }
    }
    if (!visible) throw new BadRequestException(`Order ${orderId} not found`);
    return order;
  }

  async findById(organizationId: string, orderId: string): Promise<Order> {
    const order = await this.orderModel.findOne({ _id: orderId, organizationId }).exec();
    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }
    return order as any;
  }

  /**
   * Called when a manager decides a price-override / MOQ approval request
   * (PUT /approvals/:id). Approving sends the order back into the normal
   * queue (Submitted) so the distributor can accept it and reserve stock;
   * rejecting rejects the order. Orders no longer Pending_Approval are left
   * alone.
   */
  async resolveApprovalRequest(
    organizationId: string,
    orderNumber: string,
    decision: 'Approved' | 'Rejected',
    actorId: string,
    reason?: string,
  ): Promise<void> {
    const order: any = await this.orderModel.findOne({ organizationId, orderNumber: String(orderNumber) }).exec();
    if (!order || order.status !== 'Pending_Approval') return;
    const id = order._id.toString();
    if (decision === 'Approved') {
      await this.updateStatus(organizationId, id, 'Submitted', actorId, reason || 'Pricing approved by manager');
    } else {
      await this.rejectOrder(organizationId, id, actorId, reason || 'Pricing request rejected by manager');
    }
  }

  async rejectOrder(organizationId: string, orderId: string, actorId: string, reason?: string): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findOne({ _id: asId(orderId), organizationId }).session(session);
      if (!order) {
        throw new BadRequestException(`Order ${orderId} not found`);
      }

      if (['Dispatched', 'Delivered', 'Cancelled', 'Rejected'].includes(order.status as string)) {
        throw new BadRequestException(`Order cannot be rejected from status ${order.status}`);
      }

      // Release stock if it was approved, using specific batch allocations
      if (order.status === 'Approved') {
        for (const item of order.items || []) {
          await this.inventoryService.releaseReservedStock(organizationId, item.productId, item.quantity, undefined, session, item.allocations);
        }
      }

      const updated = await this.updateStatus(organizationId, orderId, 'Rejected', actorId, reason || 'Rejected by manager', session);
      await session.commitTransaction();

      this.notificationsService.create(organizationId, order.createdByUserId, {
        type: 'order_rejected',
        title: 'Order Rejected',
        message: `Your order ${order.orderNumber || orderId} was rejected.${reason ? ` Reason: ${reason}` : ''}`
      }).catch(err => this.logger.error('Failed to create order-rejected notification', err));

      return updated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async cancelOrder(organizationId: string, orderId: string, actorId: string, reason?: string): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const order = await this.orderModel.findOne({ _id: asId(orderId), organizationId }).session(session);
      if (!order) {
        throw new BadRequestException(`Order ${orderId} not found`);
      }

      if (['Dispatched', 'Delivered', 'Cancelled', 'Rejected'].includes(order.status as string)) {
        throw new BadRequestException(`Order cannot be cancelled from status ${order.status}`);
      }

      // Release stock if it was approved, using specific batch allocations
      if (order.status === 'Approved') {
        for (const item of order.items || []) {
          await this.inventoryService.releaseReservedStock(organizationId, item.productId, item.quantity, undefined, session, item.allocations);
        }
      }

      const updated = await this.updateStatus(organizationId, orderId, 'Cancelled', actorId, reason || 'Cancelled by user', session);
      await session.commitTransaction();
      return updated;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async syncOfflineOrders(organizationId: string, userId: string, ordersData: Partial<Order>[]): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const orderData of ordersData) {
      try {
        await this.create(organizationId, userId, orderData);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ idempotencyKey: orderData.idempotencyKey, error: error.message });
      }
    }

    return results;
  }
}
