import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Logistics Dispatch & Returns Verification (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let token: string;
  let orgId: string;
  let orderId: string;
  let dispatchId: string;
  let outletId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    connection = app.get(getConnectionToken());
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  describe('Dispatch with Short Delivery', () => {
    it('should setup test data and login', async () => {
      // Find the org and super admin
      const admin = await connection.collection('users').findOne({ email: 'admin@bharatfoods.com' });
      expect(admin).toBeDefined();
      orgId = admin!.organizationId;

      // Login to get token
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@bharatfoods.com', password: 'password123' })
        .expect(200);

      token = loginRes.body.access_token;
      expect(token).toBeDefined();

      // Find an outlet
      const outlet = await connection.collection('outlets').findOne({ organizationId: orgId });
      expect(outlet).toBeDefined();
      outletId = outlet!._id.toString();

      // Create an order via DB directly for testing
      const orderRes = await connection.collection('orders').insertOne({
        organizationId: orgId,
        outletId: outletId,
        createdByUserId: new Types.ObjectId(),
        items: [
          {
            productId: new Types.ObjectId(),
            name: 'Test Product',
            sku: 'TEST-SKU',
            quantity: 10,
            unitPrice: 100,
            discount: 0,
            gstPercentage: 18,
            cgstAmount: 90,
            sgstAmount: 90,
            igstAmount: 0,
            subTotal: 1000,
            total: 1180
          }
        ],
        totals: {
          subTotal: 1000,
          discountTotal: 0,
          cgstTotal: 90,
          sgstTotal: 90,
          igstTotal: 0,
          tax: 180,
          total: 1180,
          grandTotal: 1180
        },
        subTotal: 1000,
        taxTotal: 180,
        total: 1180,
        invoiceNumber: `INV-${Date.now()}`,
        orderNumber: `ORD-${Date.now()}`,
        idempotencyKey: `IDEM-${Date.now()}`,
        status: 'Approved', // Ready for dispatch
        paymentStatus: 'Pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      orderId = orderRes.insertedId.toString();
    });

    it('should create a dispatch', async () => {
      const res = await request(app.getHttpServer())
        .post('/dispatch')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId,
          vehicle: 'MH-12-AB-1234',
          driver: 'Raju Driver'
        })
        .expect(201);
      
      expect(res.body).toHaveProperty('_id');
      dispatchId = res.body._id;
    });

    it('should mark dispatch as delivered with short items and create a return', async () => {
      const productId = (await connection.collection('orders').findOne({ _id: new Types.ObjectId(orderId) }))!.items[0].productId;

      const res = await request(app.getHttpServer())
        .patch(`/dispatch/${dispatchId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          deliveredItems: [
            {
              productId,
              orderedQty: 10,
              dispatchedQty: 10,
              deliveredQty: 8, // ordered 10, delivered 8, short 2
              shortQty: 2,
              damagedQty: 0
            }
          ],
          status: 'Partial_Delivery'
        })
        .expect(200);
      
      expect(res.body.status).toBe('Partial_Delivery');

      // Check if Return was created
      const returns = await connection.collection('returns').find({ orderId }).toArray();
      expect(returns.length).toBe(1);
      expect(returns[0].status).toBe('Submitted');
      expect(String(returns[0].items[0].product)).toBe(String(productId));
      expect(returns[0].items[0].qty).toBe(2);
      expect(String(returns[0].outlet)).toBe(String(outletId));
    });
  });
});
