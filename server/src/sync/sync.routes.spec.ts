import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createSyncRouter } from './sync.routes';
import { errorHandler } from '../core/error-handler';

// Replaces the old SyncController "should be defined" spec: exercises the
// Express router end-to-end with a mocked SyncService.
describe('Sync router', () => {
  const secret = 'test-secret';
  const syncService = {
    pull: jest.fn().mockResolvedValue({ outlets: [] }),
    push: jest.fn().mockResolvedValue({ success: true, conflicts: [] }),
  };
  const auditService = { logAction: jest.fn().mockResolvedValue(undefined) };

  const app = express();
  app.use(express.json());
  app.use('/sync', createSyncRouter({ syncService: syncService as any, auditService: auditService as any }));
  app.use(errorHandler);

  const repToken = () =>
    jwt.sign({ sub: 'rep-1', orgId: 'org-1', role: 'Sales Representative', territoryIds: ['t1'] }, secret);

  beforeAll(() => { process.env.JWT_SECRET = secret; });
  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(createSyncRouter({ syncService: syncService as any, auditService: auditService as any })).toBeDefined();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app).get('/sync/pull').expect(401);
  });

  it('passes the caller to pull so the service can scope per role', async () => {
    await request(app)
      .get('/sync/pull?lastSyncTimestamp=2026-01-01T00:00:00Z')
      .set('Authorization', `Bearer ${repToken()}`)
      .expect(200);
    expect(syncService.pull).toHaveBeenCalledWith(
      'org-1', 'rep-1', '2026-01-01T00:00:00Z',
      expect.objectContaining({ role: 'Sales Representative', territoryIds: ['t1'] }),
    );
  });

  it('strips privileged fields from pushed collections and visits', async () => {
    await request(app)
      .post('/sync/push')
      .set('Authorization', `Bearer ${repToken()}`)
      .send({
        collections: [{
          idempotencyKey: 'k1', outletId: 'o1', amount: 100, paymentMode: 'Cash',
          receiptNumber: 'R1', collectionDate: '2026-01-01',
          status: 'Cleared', organizationId: 'other-org', collectedByUserId: 'someone-else',
        }],
        visits: [{
          idempotencyKey: 'v1', outlet: 'o1', checkInTime: '2026-01-01T09:00:00Z',
          checkInLocation: { lat: 1, lng: 2, accuracy: 5 }, status: 'Active',
          isWithinGeofence: true, user: 'someone-else',
        }],
      })
      .expect(201);
    const payload = syncService.push.mock.calls[0][2];
    expect(payload.collections[0]).not.toHaveProperty('status');
    expect(payload.collections[0]).not.toHaveProperty('organizationId');
    expect(payload.collections[0]).not.toHaveProperty('collectedByUserId');
    expect(payload.visits[0]).not.toHaveProperty('isWithinGeofence');
    expect(payload.visits[0]).not.toHaveProperty('user');
  });
});
