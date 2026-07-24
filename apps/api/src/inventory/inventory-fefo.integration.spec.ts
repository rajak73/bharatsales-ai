import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppModule } from '../app.module';
import { execSync } from 'child_process';
import request from 'supertest';
import mongoose from 'mongoose';

describe('Inventory FEFO Verification (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  jest.setTimeout(30000);

  let token: string;
  let tenantId: string;
  let productId: string;
  let outletId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    connection = app.get<Connection>(getConnectionToken());
    
    execSync('npx ts-node src/seed.ts', { stdio: 'ignore' });

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
});
