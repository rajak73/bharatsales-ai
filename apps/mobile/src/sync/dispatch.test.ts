import { dispatchSyncAction } from './dispatch';
import {
  OrdersService, OutletsService, CollectionsService, TrackingService,
  VisitsService, AttendanceService, DispatchService,
} from '@bharatsales/api-client';

jest.mock('@bharatsales/api-client', () => ({
  OrdersService: { createOrder: jest.fn(), approveOrder: jest.fn(), rejectOrder: jest.fn(), dispatchOrder: jest.fn() },
  OutletsService: { updateOutlet: jest.fn() },
  CollectionsService: { createCollection: jest.fn() },
  TrackingService: { bulkCreatePings: jest.fn() },
  VisitsService: { checkIn: jest.fn(), checkOut: jest.fn() },
  AttendanceService: { startDay: jest.fn(), endDay: jest.fn() },
  DispatchService: { confirmDelivery: jest.fn() },
}));

describe('dispatchSyncAction', () => {
  afterEach(() => jest.clearAllMocks());

  it('CREATE_ORDER calls OrdersService.createOrder with the payload', async () => {
    const payload = { outletId: 'o1', items: [] };
    await dispatchSyncAction('CREATE_ORDER', payload);
    expect(OrdersService.createOrder).toHaveBeenCalledWith(payload);
  });

  it('UPDATE_OUTLET calls OutletsService.updateOutlet with id + payload', async () => {
    const payload = { id: 'out1', name: 'New Name' };
    await dispatchSyncAction('UPDATE_OUTLET', payload);
    expect(OutletsService.updateOutlet).toHaveBeenCalledWith('out1', payload);
  });

  it('CREATE_PAYMENT calls CollectionsService.createCollection', async () => {
    const payload = { outletId: 'o1', amount: 500 };
    await dispatchSyncAction('CREATE_PAYMENT', payload);
    expect(CollectionsService.createCollection).toHaveBeenCalledWith(payload);
  });

  it('CREATE_LOCATION_PING wraps the single payload in an array for bulkCreatePings', async () => {
    const payload = { lat: 1, lng: 2 };
    await dispatchSyncAction('CREATE_LOCATION_PING', payload);
    expect(TrackingService.bulkCreatePings).toHaveBeenCalledWith([payload]);
  });

  it('CREATE_VISIT calls VisitsService.checkIn', async () => {
    const payload = { outletId: 'o1', lat: 1, lng: 2, accuracy: 5 };
    await dispatchSyncAction('CREATE_VISIT', payload);
    expect(VisitsService.checkIn).toHaveBeenCalledWith(payload);
  });

  it('UPDATE_VISIT calls VisitsService.checkOut with just the id', async () => {
    await dispatchSyncAction('UPDATE_VISIT', { id: 'v1' });
    expect(VisitsService.checkOut).toHaveBeenCalledWith('v1');
  });

  it('CLOCK_IN calls AttendanceService.startDay', async () => {
    const payload = { lat: 1, lng: 2, accuracy: 5, deviceTimestamp: 'now' };
    await dispatchSyncAction('CLOCK_IN', payload);
    expect(AttendanceService.startDay).toHaveBeenCalledWith(payload);
  });

  it('CLOCK_OUT calls AttendanceService.endDay', async () => {
    const payload = { lat: 1, lng: 2, accuracy: 5 };
    await dispatchSyncAction('CLOCK_OUT', payload);
    expect(AttendanceService.endDay).toHaveBeenCalledWith(payload);
  });

  it('APPROVE_ORDER calls OrdersService.approveOrder with orderId', async () => {
    await dispatchSyncAction('APPROVE_ORDER', { orderId: 'ord1' });
    expect(OrdersService.approveOrder).toHaveBeenCalledWith('ord1');
  });

  it('REJECT_ORDER calls OrdersService.rejectOrder with orderId and reason', async () => {
    await dispatchSyncAction('REJECT_ORDER', { orderId: 'ord1', reason: 'Out of stock' });
    expect(OrdersService.rejectOrder).toHaveBeenCalledWith('ord1', 'Out of stock');
  });

  it('DISPATCH_ORDER calls OrdersService.dispatchOrder with orderId', async () => {
    await dispatchSyncAction('DISPATCH_ORDER', { orderId: 'ord1' });
    expect(OrdersService.dispatchOrder).toHaveBeenCalledWith('ord1');
  });

  it('CONFIRM_DELIVERY calls DispatchService.confirmDelivery with dispatchId and items', async () => {
    const items = [{ productId: 'p1', deliveredQty: 10 }];
    await dispatchSyncAction('CONFIRM_DELIVERY', { dispatchId: 'd1', items });
    expect(DispatchService.confirmDelivery).toHaveBeenCalledWith('d1', items);
  });

  it('throws on an unknown action instead of silently doing nothing', async () => {
    await expect(dispatchSyncAction('NOT_A_REAL_ACTION' as any, {})).rejects.toThrow('Unknown sync action');
  });
});
