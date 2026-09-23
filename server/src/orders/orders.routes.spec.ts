import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createOrdersRouter } from './orders.routes';
import { errorHandler } from '../core/error-handler';

describe('Orders router', () => {
  const secret = 'test-secret';
  const ordersService = {
    findByIdForUser: jest.fn().mockResolvedValue({ id: 'ord1' }),
    changeStatus: jest.fn().mockResolvedValue({ id: 'ord1', status: 'Cancelled' }),
    cancelOrder: jest.fn(),
    reservationScope: jest.fn().mockReturnValue({}),
    assertDistributorCanActOnOrder: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue({ id: 'ord1', status: 'Dispatched' }),
    dispatchOrder: jest.fn(),
  };
  const dispatchService = { createDispatch: jest.fn().mockResolvedValue({ id: 'disp1' }) };
  const auditService = { logAction: jest.fn().mockResolvedValue(undefined) };
  const app = express();
  app.use(express.json());
  app.use('/orders', createOrdersRouter({ ordersService: ordersService as any, dispatchService: dispatchService as any, auditService: auditService as any }));
  app.use(errorHandler);
  const token = (role: string) => jwt.sign({ sub: 'u1', orgId: 'org-1', role }, secret);

  beforeAll(() => { process.env.JWT_SECRET = secret; });
  afterEach(() => jest.clearAllMocks());

  it('GET /:id applies the caller\'s visibility scope', async () => {
    await request(app).get('/orders/ord1').set('Authorization', `Bearer ${token('Sales Representative')}`).expect(200);
    expect(ordersService.findByIdForUser).toHaveBeenCalledWith(
      'org-1', 'ord1', expect.objectContaining({ sub: 'u1', role: 'Sales Representative' }),
    );
  });

  it('POST /:id/cancel goes through changeStatus (creator / approver rule), not a bare cancel', async () => {
    await request(app)
      .post('/orders/ord1/cancel')
      .set('Authorization', `Bearer ${token('Sales Representative')}`)
      .send({ reason: 'dup' })
      .expect(201);
    expect(ordersService.changeStatus).toHaveBeenCalledWith(
      'org-1', 'ord1', 'Cancelled', expect.objectContaining({ sub: 'u1' }), 'dup',
    );
    expect(ordersService.cancelOrder).not.toHaveBeenCalled();
  });

  it('POST /:id/dispatch creates the delivery record (as POST /dispatches does) and still answers with the order', async () => {
    // The mobile app's "Mark as Dispatched" uses this route; without a
    // Dispatch record the order never reached Deliveries / Confirm Delivery.
    const res = await request(app)
      .post('/orders/ord1/dispatch')
      .set('Authorization', `Bearer ${token('Distributor')}`)
      .expect(201);
    expect(dispatchService.createDispatch).toHaveBeenCalledWith(
      'org-1', 'ord1', 'u1', { vehicle: '', driver: '' }, expect.objectContaining({ role: 'Distributor' }),
    );
    expect(ordersService.dispatchOrder).not.toHaveBeenCalled();
    expect(res.body).toEqual({ id: 'ord1', status: 'Dispatched' });
  });
});
