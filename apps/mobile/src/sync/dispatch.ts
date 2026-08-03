import {
  OrdersService, OutletsService, CollectionsService, TrackingService,
  VisitsService, AttendanceService, DispatchService,
} from '@bharatsales/api-client';
import type { SyncAction } from '../db/client';

// Pure action -> backend-call mapping, deliberately free of any SQLite
// access so it can be unit-tested by mocking @bharatsales/api-client alone —
// ported from apps/field-pwa/src/sync/syncEngine.ts's switch statement, plus
// three Distributor actions (approve/reject/confirm-delivery) that field-pwa
// never needed since it only ever served Sales Representatives.
export async function dispatchSyncAction(action: SyncAction, payload: any): Promise<void> {
  switch (action) {
    case 'UPDATE_OUTLET':
      await OutletsService.updateOutlet(payload.id, payload);
      return;
    case 'CREATE_ORDER':
      await OrdersService.createOrder(payload);
      return;
    case 'CREATE_PAYMENT':
      await CollectionsService.createCollection(payload);
      return;
    case 'CREATE_LOCATION_PING':
      await TrackingService.bulkCreatePings([payload]);
      return;
    case 'CREATE_VISIT':
      await VisitsService.checkIn(payload);
      return;
    case 'UPDATE_VISIT':
      await VisitsService.checkOut(payload.id);
      return;
    case 'CLOCK_IN':
      await AttendanceService.startDay(payload);
      return;
    case 'CLOCK_OUT':
      await AttendanceService.endDay(payload);
      return;
    case 'APPROVE_ORDER':
      await OrdersService.approveOrder(payload.orderId);
      return;
    case 'REJECT_ORDER':
      await OrdersService.rejectOrder(payload.orderId, payload.reason);
      return;
    case 'DISPATCH_ORDER':
      await OrdersService.dispatchOrder(payload.orderId);
      return;
    case 'CONFIRM_DELIVERY':
      await DispatchService.confirmDelivery(payload.dispatchId, payload.items);
      return;
    default: {
      // Exhaustiveness check — if a new SyncAction is added without a case
      // here, this line fails to compile.
      const _exhaustive: never = action;
      throw new Error(`Unknown sync action: ${_exhaustive}`);
    }
  }
}
