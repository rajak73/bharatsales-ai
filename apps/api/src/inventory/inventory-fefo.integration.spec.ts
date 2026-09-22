import { Connection } from 'mongoose';
import request from 'supertest';
import mongoose from 'mongoose';
import { bootTestApp, TestApp, seedTestDatabase } from '../test/test-app';

describe('Inventory FEFO Verification (e2e)', () => {
  let app: TestApp;
  let connection: Connection;
  // Transaction-heavy (every approve runs a Mongo transaction per line); under
  // turbo --concurrency the 30s default was too tight on a busy machine.
  jest.setTimeout(90000);

  let token: string;
  let tenantId: string;
  let productId: string;
  let outletId: string;

  beforeAll(async () => {
    app = await bootTestApp();
    connection = app.connection;
    
    await seedTestDatabase(connection);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@bharatfoods.com', password: 'password123' })
      .expect(200);
    token = loginRes.body.access_token;
    tenantId = loginRes.body.user.organizationId;

    // We need a product and an outlet
    const productRes = await request(app.getHttpServer())
      .get('/products')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    productId = Array.isArray(productRes.body) ? productRes.body[0]._id : productRes.body.data[0]._id;

    const outletRes = await request(app.getHttpServer())
      .get('/outlets')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    outletId = Array.isArray(outletRes.body) ? outletRes.body[0]._id : outletRes.body.data[0]._id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('First-Expire-First-Out (FEFO) Enforcement', () => {
    it('should allocate the batch with the earliest expiry date first', async () => {
      // Clear existing inventory for the product
      await connection.collection('inventory').deleteMany({ organizationId: tenantId, productId });

      // Create 3 batches
      const today = new Date();
      const in10Days = new Date(today); in10Days.setDate(today.getDate() + 10);
      const in20Days = new Date(today); in20Days.setDate(today.getDate() + 20);
      const in30Days = new Date(today); in30Days.setDate(today.getDate() + 30);

      await connection.collection('inventory').insertMany([
        {
          organizationId: tenantId,
          productId,
          sku: 'SKU-PROD-01',
          productName: 'Premium Product 1',
          batch: 'BATCH-30-DAYS',
          stock: 100,
          expiry: in30Days.toISOString(),
          status: 'Active'
        },
        {
          organizationId: tenantId,
          productId,
          sku: 'SKU-PROD-01',
          productName: 'Premium Product 1',
          batch: 'BATCH-10-DAYS',
          stock: 50,
          expiry: in10Days.toISOString(),
          status: 'Active'
        },
        {
          organizationId: tenantId,
          productId,
          sku: 'SKU-PROD-01',
          productName: 'Premium Product 1',
          batch: 'BATCH-20-DAYS',
          stock: 100,
          expiry: in20Days.toISOString(),
          status: 'Active'
        }
      ]);

      // Place an order for 70 units
      const orderRes = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          outletId,
          idempotencyKey: 'test-fefo-key-1',
          items: [{ productId, quantity: 70, unitPrice: 100 }]
        })
      if (orderRes.status !== 201) {
        console.error('Order creation failed:', orderRes.body);
      }
      
      expect(orderRes.status).toBe(201);

      const orderId = orderRes.body._id;

      // Approve order (this triggers FEFO reserveStock)
      const approveRes = await request(app.getHttpServer())
        .post(`/orders/${orderId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Test approval' })
        .expect(201);

      const approvedOrder = approveRes.body;
      const itemAllocations = approvedOrder.items[0].allocations;

      // Assert allocations
      console.log('Approved Order Status:', approvedOrder.status);
      console.log('Approved Order Items:', JSON.stringify(approvedOrder.items, null, 2));
      expect(approvedOrder.status).toBe('Approved');
      expect(itemAllocations).toBeDefined();
      expect(itemAllocations.length).toBeGreaterThan(0);

      // Verify that 50 came from BATCH-10-DAYS (earliest expiry)
      const firstBatchAllocation = itemAllocations.find((a: any) => a.batch === 'BATCH-10-DAYS');
      expect(firstBatchAllocation).toBeDefined();
      expect(firstBatchAllocation.quantity).toBe(50);

      // Verify that the remaining 20 came from BATCH-20-DAYS (second earliest)
      const secondBatchAllocation = itemAllocations.find((a: any) => a.batch === 'BATCH-20-DAYS');
      expect(secondBatchAllocation).toBeDefined();
      expect(secondBatchAllocation.quantity).toBe(20);

      // Verify that NO stock came from BATCH-30-DAYS
      const thirdBatchAllocation = itemAllocations.find((a: any) => a.batch === 'BATCH-30-DAYS');
      expect(thirdBatchAllocation).toBeUndefined();

      // Verify stock in DB is decremented properly and reservedStock is incremented
      const inv10 = await connection.collection('inventory').findOne({ _id: new mongoose.Types.ObjectId(firstBatchAllocation.inventoryId) });
      expect(inv10!.stock).toBe(0);
      expect(inv10!.reservedStock).toBe(50);

      const inv20 = await connection.collection('inventory').findOne({ _id: new mongoose.Types.ObjectId(secondBatchAllocation.inventoryId) });
      expect(inv20!.stock).toBe(80);
      expect(inv20!.reservedStock).toBe(20);
      
      const inv30 = await connection.collection('inventory').findOne({ batch: 'BATCH-30-DAYS', organizationId: tenantId, productId });
      expect(inv30!.stock).toBe(100);
      expect(inv30!.reservedStock).toBeFalsy();
    });
  });

  describe('Hold_Stock never leaks reservations', () => {
    it('rolls back the reservations of earlier lines when a later line is short, and reserves once on re-approval', async () => {
      const products = await connection.collection('products').find({ organizationId: tenantId }).limit(2).toArray();
      expect(products.length).toBe(2);
      const [p1, p2] = products.map((p) => p._id.toString());
      const [price1, price2] = products.map((p) => p.pricing?.basePrice ?? 0);
      // Keep credit out of the way: this test is about stock.
      await connection.collection('outlets').updateOne(
        { _id: new mongoose.Types.ObjectId(outletId) },
        { $set: { 'commercial.creditLimit': 1e12, 'commercial.outstandingBalance': 0 } },
      );
      await connection.collection('inventory').deleteMany({ organizationId: tenantId, productId: { $in: [p1, p2] } });
      const expiry = new Date(Date.now() + 365 * 86400000).toISOString();
      await connection.collection('inventory').insertMany([
        { organizationId: tenantId, productId: p1, sku: 'HS-1', productName: 'HS 1', batch: 'HS-B1', stock: 100, reservedStock: 0, expiry, status: 'Active' },
        { organizationId: tenantId, productId: p2, sku: 'HS-2', productName: 'HS 2', batch: 'HS-B2', stock: 3, reservedStock: 0, expiry, status: 'Active' },
      ]);

      const orderRes = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          outletId,
          idempotencyKey: 'test-hold-stock-leak',
          items: [
            { productId: p1, quantity: 10, unitPrice: price1 },
            { productId: p2, quantity: 10, unitPrice: price2 },
          ],
        })
        .expect(201);
      const orderId = orderRes.body._id;
      expect(orderRes.body.status).toBe('Hold_Stock');

      const held = await request(app.getHttpServer())
        .post(`/orders/${orderId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(201);
      expect(held.body.status).toBe('Hold_Stock');

      const b1 = await connection.collection('inventory').findOne({ organizationId: tenantId, batch: 'HS-B1' });
      expect(b1!.stock).toBe(100);
      expect(b1!.reservedStock || 0).toBe(0);

      // Stock arrives; approving the held order reserves each line exactly once.
      await connection.collection('inventory').updateOne({ organizationId: tenantId, batch: 'HS-B2' }, { $set: { stock: 50 } });
      const approved = await request(app.getHttpServer())
        .post(`/orders/${orderId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(201);
      expect(approved.body.status).toBe('Approved');
      const after1 = await connection.collection('inventory').findOne({ organizationId: tenantId, batch: 'HS-B1' });
      const after2 = await connection.collection('inventory').findOne({ organizationId: tenantId, batch: 'HS-B2' });
      expect([after1!.stock, after1!.reservedStock]).toEqual([90, 10]);
      expect([after2!.stock, after2!.reservedStock]).toEqual([40, 10]);

      // Cancelling releases exactly what was reserved.
      await request(app.getHttpServer())
        .post(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'test' })
        .expect(201);
      const rel1 = await connection.collection('inventory').findOne({ organizationId: tenantId, batch: 'HS-B1' });
      expect([rel1!.stock, rel1!.reservedStock]).toEqual([100, 0]);
    });

    it('GET /orders/:id applies the same role scoping as GET /orders', async () => {
      const order = await connection.collection('orders').findOne({ organizationId: tenantId, idempotencyKey: 'test-hold-stock-leak' });
      const id = order!._id.toString();
      const as = (payload: object) => `Bearer ${app.jwtService.sign({ orgId: tenantId, ...payload })}`;

      await request(app.getHttpServer()).get(`/orders/${id}`).set('Authorization', as({ sub: 'someone-else', role: 'Sales Representative' })).expect(400);
      await request(app.getHttpServer()).get(`/orders/${id}`).set('Authorization', as({ sub: 'd-user', role: 'Distributor', distributorId: 'not-this-one' })).expect(400);
      await request(app.getHttpServer()).get(`/orders/${id}`).set('Authorization', as({ sub: 'mgr', role: 'Sales Manager', territoryIds: [] })).expect(400);
      await request(app.getHttpServer()).get(`/orders/${id}`).set('Authorization', as({ sub: order!.createdByUserId, role: 'Sales Representative' })).expect(200);
    });
  });
});
