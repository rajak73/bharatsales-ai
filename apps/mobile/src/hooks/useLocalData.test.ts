import { applyQueuedOrderActions, applyQueuedDeliveries } from './useLocalData';

// jest.mock calls are hoisted above the import by babel-jest.
jest.mock('../db/client', () => ({ getAll: jest.fn(async () => []) }));
jest.mock('../db/syncQueue', () => ({ getUnsyncedOrders: jest.fn(async () => []), getQueuedOrderActions: jest.fn(async () => []) }));

describe('queued distributor decisions on cached data', () => {
  const orders = [
    { id: 'o1', status: 'Submitted' },
    { id: 'o2', status: 'Approved' },
    { id: 'o3', status: 'Submitted' },
  ];

  it('shows the expected status and marks the order so its buttons are hidden', () => {
    const out = applyQueuedOrderActions(orders, [
      { action: 'APPROVE_ORDER', payload: { orderId: 'o1' } },
      { action: 'DISPATCH_ORDER', payload: { orderId: 'o2' } },
    ]) as any[];
    expect(out[0]).toMatchObject({ id: 'o1', status: 'Approved', pendingAction: 'APPROVE_ORDER' });
    expect(out[1]).toMatchObject({ id: 'o2', status: 'Dispatched', pendingAction: 'DISPATCH_ORDER' });
    expect(out[2]).toEqual({ id: 'o3', status: 'Submitted' });
  });

  it('uses the latest queued decision for an order', () => {
    const out = applyQueuedOrderActions(orders, [
      { action: 'APPROVE_ORDER', payload: { orderId: 'o1' } },
      { action: 'REJECT_ORDER', payload: { orderId: 'o1' } },
    ]) as any[];
    expect(out[0].status).toBe('Rejected');
  });

  it('ignores delivery confirmations for orders, and hides a confirmed delivery from the active list', () => {
    const actions = [{ action: 'CONFIRM_DELIVERY', payload: { dispatchId: 'd1' } }];
    expect(applyQueuedOrderActions(orders, actions)).toEqual(orders);
    const out = applyQueuedDeliveries([{ id: 'd1', status: 'In Transit' }, { id: 'd2', status: 'In Transit' }], actions) as any[];
    expect(out[0]).toMatchObject({ status: 'Delivered', pendingAction: 'CONFIRM_DELIVERY' });
    expect(out[1].status).toBe('In Transit');
  });
});
