import { OrdersService, DispatchService, InventoryService } from '@bharatsales/api-client';
import { replaceTable } from '../db/client';
import { getPending, markFailed, markRetry } from '../db/syncQueue';
import { dispatchSyncAction } from './dispatch';
import { SyncEngine } from './syncEngine';
import { useSessionStore } from '../store/sessionStore';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })), addEventListener: jest.fn() },
}));

jest.mock('@bharatsales/api-client', () => {
  const list = () => jest.fn(async () => []);
  return {
    OutletsService: { getOutlets: list() },
    ProductsService: { getProducts: list() },
    DistributorsService: { getDistributors: list() },
    BeatsService: { getTodayBeat: jest.fn(async () => null) },
    SchemesService: { getSchemes: list() },
    OrdersService: { getOrders: jest.fn(async () => [{ id: 'o1', status: 'Approved' }]) },
    DispatchService: { getDispatches: list() },
    InventoryService: { getInventory: list() },
  };
});

jest.mock('../db/client', () => ({ replaceTable: jest.fn(async () => {}), upsertRow: jest.fn(async () => {}) }));

jest.mock('../db/syncQueue', () => ({
  enqueue: jest.fn(),
  getPending: jest.fn(async () => []),
  getPendingCount: jest.fn(async () => 0),
  getFailedCount: jest.fn(async () => 0),
  getNextScheduledAttempt: jest.fn(async () => null),
  markSyncing: jest.fn(async () => {}),
  markFailed: jest.fn(async () => {}),
  markRetry: jest.fn(async () => {}),
  remove: jest.fn(async () => {}),
  claimLegacyItems: jest.fn(async () => {}),
}));

jest.mock('../lib/queryClient', () => ({ queryClient: { invalidateQueries: jest.fn(async () => {}) } }));
jest.mock('./dispatch', () => ({ dispatchSyncAction: jest.fn(async () => {}) }));

const pendingItem = (action: string, payload: any = {}) => ({ id: 1, action, payload, attempts: 0 });

describe('SyncEngine.triggerSync cache refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ user: { id: 'u1', role: 'Distributor' } });
  });

  it('re-pulls orders from the server after an order action syncs, so the accepted order stops showing as Submitted', async () => {
    (getPending as jest.Mock).mockResolvedValueOnce([pendingItem('APPROVE_ORDER', { orderId: 'o1' })]);

    await SyncEngine.triggerSync();

    expect(dispatchSyncAction).toHaveBeenCalledWith('APPROVE_ORDER', { orderId: 'o1' });
    expect(OrdersService.getOrders).toHaveBeenCalled();
    expect(DispatchService.getDispatches).toHaveBeenCalled();
    expect(InventoryService.getInventory).toHaveBeenCalled();
    expect(replaceTable).toHaveBeenCalledWith('orders', [{ id: 'o1', status: 'Approved' }]);
  });

  it('does not re-pull for location pings', async () => {
    (getPending as jest.Mock).mockResolvedValueOnce([pendingItem('CREATE_LOCATION_PING')]);

    await SyncEngine.triggerSync();

    expect(dispatchSyncAction).toHaveBeenCalled();
    expect(OrdersService.getOrders).not.toHaveBeenCalled();
  });

  it('does not re-pull when the order action failed to sync', async () => {
    (getPending as jest.Mock).mockResolvedValueOnce([pendingItem('APPROVE_ORDER', { orderId: 'o1' })]);
    (dispatchSyncAction as jest.Mock).mockRejectedValueOnce(Object.assign(new Error('Bad Request'), { response: { status: 400 } }));

    await SyncEngine.triggerSync();

    expect(OrdersService.getOrders).not.toHaveBeenCalled();
  });
});

describe('SyncEngine.triggerSync when the session ends mid-sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ user: { id: 'u1', role: 'Sales Representative' } });
  });

  it('puts the item back untouched and stops, instead of failing every queued item with 401', async () => {
    (getPending as jest.Mock).mockResolvedValueOnce([
      { id: 1, action: 'CREATE_ORDER', payload: { id: 'a' }, attempts: 2 },
      { id: 2, action: 'CREATE_PAYMENT', payload: {}, attempts: 0 },
      { id: 3, action: 'CREATE_ORDER', payload: { id: 'b' }, attempts: 0 },
    ]);
    (dispatchSyncAction as jest.Mock).mockImplementationOnce(async () => {
      // api-client's refresh was rejected: it clears the session, then rejects.
      useSessionStore.setState({ user: null });
      throw Object.assign(new Error('Invalid or expired refresh token'), { response: { status: 401 } });
    });

    await SyncEngine.triggerSync();

    expect(dispatchSyncAction).toHaveBeenCalledTimes(1);
    expect(markFailed).not.toHaveBeenCalled();
    expect(markRetry).toHaveBeenCalledWith(1, 2, 0, expect.stringContaining('401'));
  });
});

describe('SyncEngine.refreshFromServer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ user: { id: 'u1', role: 'Distributor' } });
  });

  it('re-downloads on pull-to-refresh even when nothing was queued, and throttles automatic refreshes', async () => {
    await SyncEngine.refreshFromServer({ force: true });
    expect(OrdersService.getOrders).toHaveBeenCalledTimes(1);

    // An automatic (interval / foreground) refresh right after is skipped...
    await SyncEngine.refreshFromServer();
    expect(OrdersService.getOrders).toHaveBeenCalledTimes(1);

    // ...but pull-to-refresh always downloads.
    await SyncEngine.refreshFromServer({ force: true });
    expect(OrdersService.getOrders).toHaveBeenCalledTimes(2);
  });
});
