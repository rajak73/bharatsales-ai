import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createOutletsRouter } from './outlets.routes';
import { errorHandler } from '../core/error-handler';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('outlets router', () => {
  const outletsService = {
    update: jest.fn(async (_org: string, id: string, data: any) => ({ id, ...data })),
    create: jest.fn(async (_org: string, _user: string, data: any) => ({ id: 'o1', ...data })),
  };
  const auditService = { logAction: jest.fn().mockResolvedValue(undefined) };
  const app = express();
  app.use(express.json());
  app.use('/outlets', createOutletsRouter({ outletsService: outletsService as any, auditService: auditService as any }));
  app.use(errorHandler);
  const token = jwt.sign({ sub: 'u1', orgId: 'org1', role: 'Organization Admin' }, process.env.JWT_SECRET as string);

  afterEach(() => jest.clearAllMocks());

  it('PATCH flattens nested commercial into dot keys and drops outstandingBalance/privileged fields', async () => {
    await request(app)
      .patch('/outlets/o1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 'o1',
        organizationId: 'org2',
        commercial: { creditLimit: 100, paymentTermsDays: 7, outstandingBalance: 0, assignedDistributorId: 'd1' },
      })
      .expect(200);
    expect(outletsService.update).toHaveBeenCalledWith('org1', 'o1', {
      'commercial.creditLimit': 100,
      'commercial.paymentTermsDays': 7,
      'commercial.assignedDistributorId': 'd1',
    }, expect.objectContaining({ role: 'Organization Admin' }));
  });

  it('GET /export answers 400 (use POST) instead of a 500', async () => {
    const res = await request(app).get('/outlets/export').set('Authorization', `Bearer ${token}`).expect(400);
    expect(res.body).toEqual({ statusCode: 400, message: 'Please use POST /export for auditing purposes', error: 'Bad Request' });
  });

  it('PATCH rejects operator objects in string fields', async () => {
    await request(app)
      .patch('/outlets/o1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: { $gt: '' } })
      .expect(400);
    expect(outletsService.update).not.toHaveBeenCalled();
  });

  it('POST creates with the org from the token and audits it', async () => {
    const res = await request(app)
      .post('/outlets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Shop', code: 'S1', ownerName: 'A', category: 'Grocery', tier: 'B', status: 'Active', mobile: '999',
        location: { address: 'x', state: 'KA', pinCode: '560001', latitude: 0, longitude: 0, geofenceRadiusMeters: 100 },
        commercial: { creditLimit: 0, paymentTermsDays: 0, outstandingBalance: 500 },
        tax: {},
        organizationId: 'org2',
      })
      .expect(201);
    expect(res.body.id).toBe('o1');
    const body = outletsService.create.mock.calls[0][2];
    expect(body.organizationId).toBeUndefined();
    expect(body.commercial.outstandingBalance).toBeUndefined();
    expect(auditService.logAction).toHaveBeenCalledWith(expect.objectContaining({ entityName: 'Outlet', action: 'POST' }));
  });
});
