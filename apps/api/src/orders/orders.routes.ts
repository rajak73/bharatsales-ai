import { Router } from 'express';
import { z } from 'zod';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { audit } from '../core/audit.middleware';
import { route, validateBody } from '../core/http';
import type { OrdersService } from './orders.service';
import type { AuditService } from '../audit/audit.service';

const ORDER_STATUSES = [
  'Draft', 'Submitted', 'Hold_Credit', 'Hold_Stock', 'Pending_Approval', 'Approved',
  'Dispatched', 'Partial_Delivery', 'Delivered', 'Cancelled', 'Rejected',
] as const;

// Line items: only what a client legitimately sends. Server-computed fields
// (sku/name/GST/totals) are recomputed by OrdersService.create, and
// `allocations` is stripped so a client can never inject batch reservations
// that approve/cancel/cleanup would later release against real stock.
const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional(),
  appliedSchemeId: z.string().optional().nullable(),
  isFreeItem: z.boolean().optional(),
});

// Mirrors what web / field-pwa / mobile send (see apps/mobile/app/(rep)/cart.tsx).
// Unknown keys (organizationId, createdByUserId, statusHistory, totals, id,
// createdAt, ...) are stripped. `status` is accepted but only 'Draft' is
// honoured by the service.
const createOrderSchema = z.object({
  idempotencyKey: z.string().min(1).optional(),
  orderNumber: z.string().optional(),
  outletId: z.string().optional(),
  assignedDistributorId: z.string().optional().nullable(),
  status: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  reason: z.string().optional(),
});

const approveSchema = z.object({
  manualAllocations: z
    .record(z.array(z.object({ batch: z.string().min(1), quantity: z.number() })))
    .optional(),
  reason: z.string().optional(),
});

const reasonSchema = z.object({
  reason: z.string().optional(),
});

export function createOrdersRouter(deps: { ordersService: OrdersService; auditService: AuditService }): Router {
  const { ordersService, auditService } = deps;
  const router = Router();
  router.use(authenticate, audit(auditService, 'Orders'));

  router.get('/', requirePermission(Resource.Orders, Action.Read),
    route((req) => ordersService.findAll(req.user.orgId, req.user, req.query.mine === 'true')));

  router.get('/:id', requirePermission(Resource.Orders, Action.Read),
    route((req) => ordersService.findByIdForUser(req.user.orgId, req.params.id, req.user)));

  router.post('/', requirePermission(Resource.Orders, Action.Create), validateBody(createOrderSchema),
    route((req) => ordersService.create(req.user.orgId, req.user.sub, req.body)));

  // Orders:Update gets a user this far; changeStatus then requires
  // Orders:Approve for everything except the creator cancelling their own
  // order, and routes Approved/Dispatched/Rejected/Cancelled through the real
  // approve/dispatch/reject/cancel flows.
  router.put('/:id/status', requirePermission(Resource.Orders, Action.Update), validateBody(updateStatusSchema),
    route((req) => ordersService.changeStatus(req.user.orgId, req.params.id, req.body.status, req.user, req.body.reason)));

  router.post('/:id/approve', requirePermission(Resource.Orders, Action.Approve), validateBody(approveSchema),
    route(async (req) => {
      await ordersService.assertDistributorCanActOnOrder(req.user.orgId, req.params.id, req.user);
      return ordersService.approveOrder(
        req.user.orgId, req.params.id, req.user.sub, req.body.manualAllocations, req.body.reason,
        ordersService.reservationScope(req.user),
      );
    }));

  router.post('/:id/dispatch', requirePermission(Resource.Orders, Action.Approve),
    route(async (req) => {
      await ordersService.assertDistributorCanActOnOrder(req.user.orgId, req.params.id, req.user);
      return ordersService.dispatchOrder(req.user.orgId, req.params.id, req.user.sub);
    }));

  router.post('/:id/reject', requirePermission(Resource.Orders, Action.Approve), validateBody(reasonSchema),
    route(async (req) => {
      await ordersService.assertDistributorCanActOnOrder(req.user.orgId, req.params.id, req.user);
      return ordersService.rejectOrder(req.user.orgId, req.params.id, req.user.sub, req.body.reason);
    }));

  // Same rule as PUT /:id/status → Cancelled: only the order's creator, or a
  // holder of Orders:Approve who may act on the order (a Distributor only on
  // orders routed to them), can cancel and release its stock reservations.
  router.post('/:id/cancel', requirePermission(Resource.Orders, Action.Create), validateBody(reasonSchema),
    route((req) => ordersService.changeStatus(req.user.orgId, req.params.id, 'Cancelled', req.user, req.body.reason)));

  return router;
}
