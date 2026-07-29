import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppModule } from '../app.module';
import { execSync } from 'child_process';
import request from 'supertest';

describe('Finance Collections Verification (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  jest.setTimeout(30000);

  let token: string;
  let tenantId: string;
  let outletId: string;
  let userId: string;

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
    userId = loginRes.body.user.id;

    const outletRes = await request(app.getHttpServer())
      .get('/outlets')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    outletId = Array.isArray(outletRes.body) ? outletRes.body[0]._id : outletRes.body.data[0]._id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Collections and Reversals', () => {
    it('should automatically settle Cash payments and decrease outstanding balance', async () => {
      // Set an initial outstanding balance of 1000
      await connection.collection('outlets').updateOne(
        { _id: new (require('mongoose').Types.ObjectId)(outletId) },
        { $set: { 'commercial.outstandingBalance': 1000 } }
      );

      // Create a Cash collection for 300
      const createRes = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${token}`)
        .send({
          outletId,
          receiptNumber: `RCPT-${Date.now()}`,
          amount: 300,
          paymentMode: 'Cash'
        })
        .expect(201);

      expect(createRes.body.status).toBe('Cleared');

      // Verify the outlet's balance is now 700
      const outlet = await connection.collection('outlets').findOne({ _id: new (require('mongoose').Types.ObjectId)(outletId) });
      expect(outlet!.commercial.outstandingBalance).toBe(700);
    });

    it('should mark Cheque as Pending and update balance on Cleared, revert on Bounced', async () => {
      // Set initial balance of 500
      await connection.collection('outlets').updateOne(
        { _id: new (require('mongoose').Types.ObjectId)(outletId) },
        { $set: { 'commercial.outstandingBalance': 500 } }
      );

      // Create a Cheque collection for 200
      const createRes = await request(app.getHttpServer())
        .post('/collections')
        .set('Authorization', `Bearer ${token}`)
        .send({
          outletId,
          receiptNumber: `RCPT-${Date.now()}-2`,
          amount: 200,
          paymentMode: 'Cheque'
        })
        .expect(201);

      const collectionId = createRes.body._id;
      expect(createRes.body.status).toBe('Pending');

      // Balance should still be 500
      let outlet = await connection.collection('outlets').findOne({ _id: new (require('mongoose').Types.ObjectId)(outletId) });
      expect(outlet!.commercial.outstandingBalance).toBe(500);

      // Status -> Cleared
      await request(app.getHttpServer())
        .patch(`/collections/${collectionId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Cleared' })
        .expect(200);

      // Balance should now be 300
      outlet = await connection.collection('outlets').findOne({ _id: new (require('mongoose').Types.ObjectId)(outletId) });
      expect(outlet!.commercial.outstandingBalance).toBe(300);

      // Status -> Bounced
      await request(app.getHttpServer())
        .patch(`/collections/${collectionId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Bounced' })
        .expect(200);

      // Balance should be reverted back to 500
      outlet = await connection.collection('outlets').findOne({ _id: new (require('mongoose').Types.ObjectId)(outletId) });
      expect(outlet!.commercial.outstandingBalance).toBe(500);
    });
  });
});
