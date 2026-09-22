import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createReturnsRouter } from './returns.routes';
import { errorHandler } from '../core/error-handler';
import { ForbiddenException } from '../core/http-errors';

describe('Returns router', () => {
  const secret = 'test-secret';
  const returnsService = {
    assertCanActOnReturn: jest.fn().mockResolvedValue(undefined),
    updateStatus: jest.fn().mockResolvedValue({ id: 'r1', status: 'Inspected' }),
    approveReturn: jest.fn().mockResolvedValue({ id: 'r1', status: 'Approved' }),
  };
  const auditService = { logAction: jest.fn().mockResolvedValue(undefined) };
  const app = express();
  app.use(express.json());
  app.use('/returns', createReturnsRouter({ returnsService: returnsService as any, auditService: auditService as any }));
  app.use(errorHandler);
  const token = (role: string, extra: object = {}) => jwt.sign({ sub: 'u1', orgId: 'org-1', role, ...extra }, secret);

  beforeAll(() => { process.env.JWT_SECRET = secret; });
  afterEach(() => jest.clearAllMocks());

  it('PATCH /:id/status exists and passes the restock classification through', async () => {
    await request(app)
      .patch('/returns/r1/status')
      .set('Authorization', `Bearer ${token('Distributor', { distributorId: 'd1' })}`)
      .send({ status: 'Inspected', restockClassification: 'damaged' })
      .expect(200);
    expect(returnsService.assertCanActOnReturn).toHaveBeenCalledWith('org-1', 'r1', expect.objectContaining({ distributorId: 'd1' }));
    expect(returnsService.updateStatus).toHaveBeenCalledWith('org-1', 'r1', 'Inspected', 'u1', undefined, 'damaged');
  });

  it('PATCH /:id/status rejects unknown statuses / classifications', async () => {
    await request(app)
      .patch('/returns/r1/status')
      .set('Authorization', `Bearer ${token('Distributor', { distributorId: 'd1' })}`)
      .send({ status: 'Inspected', restockClassification: 'shiny' })
      .expect(400);
    expect(returnsService.updateStatus).not.toHaveBeenCalled();
  });

  it('approve checks distributor ownership first', async () => {
    returnsService.assertCanActOnReturn.mockRejectedValueOnce(new ForbiddenException('This return is not assigned to you'));
    await request(app)
      .post('/returns/r1/approve')
      .set('Authorization', `Bearer ${token('Distributor', { distributorId: 'd2' })}`)
      .expect(403);
    expect(returnsService.approveReturn).not.toHaveBeenCalled();
  });
});
