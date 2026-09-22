/**
 * Queue ownership tests. Runs the real migration + queue SQL against an
 * in-memory SQLite (Node's built-in node:sqlite) standing in for expo-sqlite.
 */
let DatabaseSync: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch {
  DatabaseSync = null;
}

let mockDb: any;

function mockAdapter(d: any) {
  const self: any = {
    execAsync: async (sql: string) => { d.exec(sql); },
    runAsync: async (sql: string, params: any[] = []) => d.prepare(sql).run(...params),
    getAllAsync: async (sql: string, params: any[] = []) => d.prepare(sql).all(...params),
    getFirstAsync: async (sql: string, params: any[] = []) => d.prepare(sql).get(...params) ?? null,
    withExclusiveTransactionAsync: async (fn: (txn: any) => Promise<void>) => fn(self),
  };
  return self;
}

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => mockAdapter(mockDb)),
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })), addEventListener: jest.fn() },
}));
jest.mock('@bharatsales/api-client', () => ({}));
jest.mock('../lib/queryClient', () => ({ queryClient: { invalidateQueries: jest.fn(async () => {}) } }));
jest.mock('../sync/dispatch', () => ({ dispatchSyncAction: jest.fn(async () => {}) }));

const d = DatabaseSync ? describe : describe.skip;

d('sync queue ownership', () => {
  let q: typeof import('./syncQueue');
  let engine: typeof import('../sync/syncEngine');
  let session: typeof import('../store/sessionStore');
  let dispatch: jest.Mock;

  const load = () => {
    jest.isolateModules(() => {
      q = require('./syncQueue');
      engine = require('../sync/syncEngine');
      session = require('../store/sessionStore');
      dispatch = require('../sync/dispatch').dispatchSyncAction;
    });
  };

  const login = (id: string) => session.useSessionStore.getState().setUser({ id, role: 'Sales Representative' });

  beforeEach(() => {
    mockDb = new DatabaseSync(':memory:');
    load();
    dispatch.mockClear();
  });

  it('stamps enqueued items with the logged-in user', async () => {
    login('userA');
    await engine.enqueueAndSync('CREATE_ORDER', { id: 'o1' });
    const row = mockDb.prepare('SELECT userId FROM syncQueue').get();
    expect(row.userId).toBe('userA');
  });

  it('only sends the current user\'s items; another user\'s stay queued and show as foreign', async () => {
    await q.enqueue('CREATE_ORDER', { id: 'mine' }, 'userB');
    await q.enqueue('CREATE_PAYMENT', { id: 'theirs' }, 'userA');
    login('userB');

    await engine.SyncEngine.triggerSync();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith('CREATE_ORDER', { id: 'mine' });

    const left = mockDb.prepare('SELECT action, status, userId FROM syncQueue').all();
    expect(left).toEqual([{ action: 'CREATE_PAYMENT', status: 'PENDING', userId: 'userA' }]);

    expect(await q.getPendingCount('userB')).toBe(0);
    expect(await q.getFailedCount('userB')).toBe(1);
    const failed = await q.getFailed('userB');
    expect(failed).toHaveLength(1);
    expect(failed[0]).toMatchObject({ action: 'CREATE_PAYMENT', foreign: true, userId: 'userA' });

    // Foreign items can be discarded but never retried by this user.
    await q.retryFailed(failed[0].id, 'userB');
    expect(mockDb.prepare('SELECT status FROM syncQueue').get().status).toBe('PENDING');
    await q.discardFailed(failed[0].id, 'userB');
    expect(mockDb.prepare('SELECT COUNT(*) c FROM syncQueue').get().c).toBe(0);
  });

  it('the owner sends their items on their next login', async () => {
    await q.enqueue('CREATE_ORDER', { id: 'a1' }, 'userA');
    login('userB');
    await engine.SyncEngine.triggerSync();
    expect(dispatch).not.toHaveBeenCalled();

    login('userA');
    await engine.SyncEngine.triggerSync();
    expect(dispatch).toHaveBeenCalledWith('CREATE_ORDER', { id: 'a1' });
    expect(mockDb.prepare('SELECT COUNT(*) c FROM syncQueue').get().c).toBe(0);
  });

  it('legacy rows without a userId are claimed by the first user who syncs, then never by anyone else', async () => {
    // Pre-ownership install: the old 8-column table with a queued row.
    mockDb.exec(`CREATE TABLE syncQueue (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', createdAt INTEGER NOT NULL, error TEXT,
      attempts INTEGER NOT NULL DEFAULT 0, nextAttemptAt INTEGER NOT NULL DEFAULT 0);`);
    mockDb.prepare(`INSERT INTO syncQueue (action, payload, status, createdAt, nextAttemptAt) VALUES ('CREATE_ORDER', '{"id":"old1"}', 'FAILED', 1, 0)`).run();
    mockDb.prepare(`INSERT INTO syncQueue (action, payload, status, createdAt, nextAttemptAt) VALUES ('CREATE_ORDER', '{"id":"old2"}', 'PENDING', 2, 0)`).run();

    // Before anyone claims them, legacy rows count as the current user's.
    expect(await q.getPendingCount('userA')).toBe(1);
    expect(await q.getUnsyncedCount('userA')).toBe(2);

    login('userA');
    await engine.SyncEngine.triggerSync();
    expect(dispatch).toHaveBeenCalledWith('CREATE_ORDER', { id: 'old2' });

    const rows = mockDb.prepare('SELECT userId, status FROM syncQueue').all();
    expect(rows).toEqual([{ userId: 'userA', status: 'FAILED' }]);

    // userB sees userA's claimed FAILED row as foreign and cannot resend it.
    const failedForB = await q.getFailed('userB');
    expect(failedForB.map((f) => f.foreign)).toEqual([true]);
    expect(await q.getUnsyncedCount('userB')).toBe(0);
  });

  it('logout discard only clears the current user\'s items', async () => {
    await q.enqueue('CREATE_ORDER', { id: 'a' }, 'userA');
    await q.enqueue('CREATE_ORDER', { id: 'b' }, 'userB');
    await q.clearSyncQueue('userB');
    const rows = mockDb.prepare('SELECT userId FROM syncQueue').all();
    expect(rows).toEqual([{ userId: 'userA' }]);
  });

  it('optimistic unsynced orders only include the current user\'s', async () => {
    await q.enqueue('CREATE_ORDER', { id: 'a' }, 'userA');
    await q.enqueue('CREATE_ORDER', { id: 'b' }, 'userB');
    const orders = await q.getUnsyncedOrders('userB');
    expect(orders.map((o) => o.payload.id)).toEqual(['b']);
  });
});
