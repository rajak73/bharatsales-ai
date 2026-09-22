import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createTrackingRouter } from './tracking.routes';
import { errorHandler } from '../core/error-handler';

describe('Tracking router', () => {
  const secret = 'test-secret';
  const trackingService = {
    bulkCreatePings: jest.fn().mockResolvedValue({ success: true, count: 1 }),
    getLatestPings: jest.fn().mockResolvedValue([]),
  };
  const auditService = { logAction: jest.fn().mockResolvedValue(undefined) };
  const hierarchyService = { getTeamUserIds: jest.fn().mockResolvedValue(['rep-1', 'rep-2']) };

  const app = express();
  app.use(express.json());
  app.use('/tracking', createTrackingRouter({ trackingService: trackingService as any, auditService: auditService as any, hierarchyService }));
  app.use(errorHandler);

  const token = (role: string) => jwt.sign({ sub: 'u1', orgId: 'org-1', role }, secret);

  beforeAll(() => { process.env.JWT_SECRET = secret; });
  afterEach(() => jest.clearAllMocks());

  it('forbids a Sales Representative from reading colleagues\' locations', async () => {
    await request(app).get('/tracking').set('Authorization', `Bearer ${token('Sales Representative')}`).expect(403);
    expect(trackingService.getLatestPings).not.toHaveBeenCalled();
  });

  it('lets a Sales Manager (LiveMap:Read) read latest pings, limited to their team', async () => {
    await request(app).get('/tracking').set('Authorization', `Bearer ${token('Sales Manager')}`).expect(200);
    expect(hierarchyService.getTeamUserIds).toHaveBeenCalledWith('org-1', 'u1');
    expect(trackingService.getLatestPings).toHaveBeenCalledWith('org-1', ['rep-1', 'rep-2']);
  });

  it('lets an Organization Admin read every rep\'s latest ping', async () => {
    await request(app).get('/tracking').set('Authorization', `Bearer ${token('Organization Admin')}`).expect(200);
    expect(trackingService.getLatestPings).toHaveBeenCalledWith('org-1', undefined);
  });

  it('still lets a Sales Representative post their own pings (offline queue payload)', async () => {
    await request(app)
      .post('/tracking/bulk')
      .set('Authorization', `Bearer ${token('Sales Representative')}`)
      .send({ pings: [{ lat: 12.9, lng: 77.6, accuracy: 10, deviceTimestamp: new Date().toISOString(), attendanceSession: 's1' }] })
      .expect(201);
    expect(trackingService.bulkCreatePings).toHaveBeenCalledWith('u1', 'org-1', [
      expect.objectContaining({ lat: 12.9, lng: 77.6, accuracy: 10 }),
    ]);
  });
});
