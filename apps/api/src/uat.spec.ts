import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { execSync } from 'child_process';

describe('UAT-01 & UAT-11 Validation (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let jwtService: JwtService;

  let tenant1Id: string;
  let tenant2Id: string;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connection = app.get<Connection>(getConnectionToken());
    jwtService = app.get<JwtService>(JwtService);

    // Completely reset database to seed state
    execSync('npx ts-node src/seed.ts', { stdio: 'ignore' });

    // Fetch tenant IDs
    const tenants = await connection.collection('tenants').find({}).toArray();
    tenant1Id = tenants.find(t => t.name === 'Bharat Foods Pvt Ltd')?._id.toString() || '';
    tenant2Id = tenants.find(t => t.name === 'Raj Pharma Distributors')?._id.toString() || '';

    // Fetch Super Admins
    const user1 = await connection.collection('users').findOne({ organizationId: tenant1Id, email: 'superadmin@bharatsales.com' });
    const user2 = await connection.collection('users').findOne({ organizationId: tenant2Id, email: 'admin@rajpharma.com' });

    if (!user1 || !user2) throw new Error('Seeded users not found');

    // Generate Tokens
    token1 = jwtService.sign({ sub: user1._id.toString(), email: user1.email, orgId: tenant1Id, role: user1.role });
    token2 = jwtService.sign({ sub: user2._id.toString(), email: user2.email, orgId: tenant2Id, role: user2.role });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('UAT-11: Tenant Isolation', () => {
    it('Tenant 1 should see its outlets', async () => {
      const res = await request(app.getHttpServer())
        .get('/outlets')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].organizationId).toBe(tenant1Id);
    });

    it('Tenant 2 should see 0 outlets (since we only seeded for Tenant 1)', async () => {
      const res = await request(app.getHttpServer())
        .get('/outlets')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('Tenant 1 should see its hierarchy', async () => {
      const res = await request(app.getHttpServer())
        .get('/hierarchy')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.find((n: any) => n.name === 'North Zone')).toBeDefined();
    });
  });

  describe('Phase 2: Field Execution (Attendance & Visits)', () => {
    let outletId: string;
    let visitId: string;

    it('Sales Rep should be able to start their day', async () => {
      const res = await request(app.getHttpServer())
        .post('/attendance/start')
        .set('Authorization', `Bearer ${token1}`)
        .send({ lat: 28.5, lng: 77.2, accuracy: 10, deviceTimestamp: new Date().toISOString(), photoUrl: 'https://example.com/photo.jpg' })
        .expect(201);
      
      expect(res.body.status).toBe('Active');
    });

    it('Sales Rep should see their active attendance session', async () => {
      const res = await request(app.getHttpServer())
        .get('/attendance/me')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body.status).toBe('Active');
    });

    it('Sales Rep should be able to check into an outlet', async () => {
      // First get an outlet ID
      const outletsRes = await request(app.getHttpServer())
        .get('/outlets')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
      
      outletId = outletsRes.body[0]._id;

      const res = await request(app.getHttpServer())
        .post('/visits/check-in')
        .set('Authorization', `Bearer ${token1}`)
        .send({ outletId, lat: 28.5284, lng: 77.2183, accuracy: 5, photoUrl: 'https://example.com/photo.jpg' })
        .expect(201);

      expect(res.body.status).toBe('Active');
      expect(res.body.outlet.toString()).toBe(outletId);
      visitId = res.body._id;
    });

    it('Sales Rep should be able to check out of an outlet', async () => {
      const res = await request(app.getHttpServer())
        .post(`/visits/${visitId}/check-out`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(201);

      expect(res.body.status).toBe('Completed');
    });

    it('Sales Rep should be able to end their day', async () => {
      const res = await request(app.getHttpServer())
        .post('/attendance/end')
        .set('Authorization', `Bearer ${token1}`)
        .send({ lat: 28.5, lng: 77.2, accuracy: 10 })
        .expect(201);

      expect(res.body.status).toBe('Completed');
    });
  });

  describe('Phase 3: Order Lifecycle (Orders, Inventory & Dispatch)', () => {
    let outletId: string;
    let productId: string;
    let orderId: string;
    let unitPrice: number;

    it('Should fetch products and outlets', async () => {
      const outletsRes = await request(app.getHttpServer())
        .get('/outlets')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
      
      outletId = outletsRes.body[0]._id;

      const productsRes = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(productsRes.body.length).toBeGreaterThan(0);
      productId = productsRes.body[0]._id;
      unitPrice = productsRes.body[0].pricing.ptr || 40;

      // Add stock for the product so order approval succeeds
      await request(app.getHttpServer())
        .post('/inventory/adjust')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          productId,
          batch: 'TEST-BATCH-01',
          type: 'Purchase',
          quantity: 100
        })
        .expect(201);
    });

    it('Sales Rep should be able to submit an order', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          idempotencyKey: `test-order-${Date.now()}`,
          outletId,
          items: [
            {
              productId,
              quantity: 10,
              unitPrice
            }
          ]
        });
      
      if (res.status !== 201) console.error('Create Order Error:', res.body);
      expect(res.status).toBe(201);
      
      expect(res.body.status).toBe('Submitted');
      expect(res.body.totals.grandTotal).toBeGreaterThan(0);
      orderId = res.body._id;
    });

    it('Manager should be able to approve the order', async () => {
      const res = await request(app.getHttpServer())
        .post(`/orders/${orderId}/approve`)
        .set('Authorization', `Bearer ${token1}`);

      if (res.status !== 201) console.error('Approve Order Error:', res.body);
      expect(res.status).toBe(201);

      expect(res.body.status).toBe('Approved');
    });

    it('Operations should be able to dispatch the order', async () => {
      const res = await request(app.getHttpServer())
        .post(`/orders/${orderId}/dispatch`)
        .set('Authorization', `Bearer ${token1}`);

      if (res.status !== 201) console.error('Dispatch Order Error:', res.body);
      expect(res.status).toBe(201);

      expect(res.body.status).toBe('Dispatched');
    });


  });

  describe('Phase 4: Finance & Performance', () => {
    let outletId: string;
    let expenseId: string;

    beforeAll(async () => {
      const outletsRes = await request(app.getHttpServer())
        .get('/outlets')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
      
      outletId = outletsRes.body[0]._id;
    });

    it('Should fetch Gamification Targets with Run Rate', async () => {
      // First let's create a target for the current month
      const start = new Date();
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);

      await request(app.getHttpServer())
        .post('/targets')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          entityType: 'User',
          entityId: 'test-user-id',
          metric: 'Revenue',
          targetValue: 100000,
          period: 'Monthly',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          status: 'On Track'
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/targets')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      
      const target = res.body[0];
      // It should calculate dynamic meta fields (gamification engine)
      expect(target.meta).toBeDefined();
      expect(target.meta.dailyRunRate).toBeDefined();
      expect(target.actualValue).toBeDefined();
      expect(target.status).toBeDefined(); // Should be calculated as On Track/At Risk etc.
    });

    it('Should log a Payment Collection from an outlet', async () => {
      const res = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          receiptNumber: `REC-${Date.now()}`,
          outletId,
          amount: 5000,
          paymentMode: 'UPI',
          referenceNumber: `UPI-${Date.now()}`
        })
        .expect(201);

      expect(res.body.status).toBe('Pending');
      expect(res.body.amount).toBe(5000);
    });

    it('Should fetch all reports', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].organizationId).toBe(tenant1Id); // Tenant isolation check
    });


  });

  describe('Phase 5: AI & Enterprise Capabilities', () => {
    let outletId: string;

    beforeAll(async () => {
      const outletsRes = await request(app.getHttpServer())
        .get('/outlets')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
      
      outletId = outletsRes.body[0]._id;
    }, 30000);



    it('Should fetch Analytics Dashboard safely', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body.kpis).toBeDefined();
      expect(res.body.recentOrders).toBeDefined();
    });

    it('Should fetch Custom Approvals workflows', async () => {
      const res = await request(app.getHttpServer())
        .get('/approvals')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0].organizationId).toBe(tenant1Id);
      }
    });

  });
});
