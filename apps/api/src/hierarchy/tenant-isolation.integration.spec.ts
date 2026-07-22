import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

describe('Tenant Isolation & Hierarchy Security (e2e)', () => {
  let app: INestApplication;
  jest.setTimeout(30000);

  let tokenA: string;
  let tokenB: string;
  let orgA_Id: string;
  let orgB_Id: string;
  let outletA_Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bharatsales');

    // Clean up
    await mongoose.connection.collection('users').deleteMany({ email: { $in: ['tenanta@test.com', 'tenantb@test.com'] } });
    await mongoose.connection.collection('tenants').deleteMany({ name: /Tenant [AB]/ });
    await mongoose.connection.collection('outlets').deleteMany({ name: 'Outlet A' });

    // Create Tenant A & B
    const tenantA = await mongoose.connection.collection('tenants').insertOne({ name: 'Tenant A', status: 'Active', createdAt: new Date(), updatedAt: new Date() });
    const tenantB = await mongoose.connection.collection('tenants').insertOne({ name: 'Tenant B', status: 'Active', createdAt: new Date(), updatedAt: new Date() });
    
    orgA_Id = tenantA.insertedId.toString();
    orgB_Id = tenantB.insertedId.toString();

    // Create Users
    const pwd = await bcrypt.hash('password123', 10);
    const userA = await mongoose.connection.collection('users').insertOne({
      email: 'tenanta@test.com',
      password: pwd,
      organizationId: orgA_Id,
      role: 'Company Admin',
      status: 'Active',
      name: 'User A',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const userB = await mongoose.connection.collection('users').insertOne({
      email: 'tenantb@test.com',
      password: pwd,
      organizationId: orgB_Id,
      role: 'Company Admin',
      status: 'Active',
      name: 'User B',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create Outlet A in Tenant A
    const outletA = await mongoose.connection.collection('outlets').insertOne({
      name: 'Outlet A',
      organizationId: orgA_Id,
      status: 'Active',
      type: 'Retail',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    outletA_Id = outletA.insertedId.toString();

    // Login A
    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'tenanta@test.com', password: 'password123' })
      .expect(200);
    tokenA = loginA.body.access_token;

    // Login B
    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'tenantb@test.com', password: 'password123' })
      .expect(200);
    tokenB = loginB.body.access_token;
  });

  afterAll(async () => {
    await mongoose.connection.collection('users').deleteMany({ email: { $in: ['tenanta@test.com', 'tenantb@test.com'] } });
    await mongoose.connection.collection('tenants').deleteMany({ name: /Tenant [AB]/ });
    await mongoose.connection.collection('outlets').deleteMany({ name: 'Outlet A' });
    await app.close();
    await mongoose.disconnect();
  });

  describe('Cross-Tenant Data Access (Negative Tests)', () => {
    it('User A can see Outlet A', async () => {
      const res = await request(app.getHttpServer())
        .get('/outlets')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      
      expect(res.body.some((o: any) => o._id === outletA_Id)).toBe(true);
    });

    it('User B CANNOT see Outlet A in list', async () => {
      const res = await request(app.getHttpServer())
        .get('/outlets')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      
      expect(res.body.some((o: any) => o._id === outletA_Id)).toBe(false);
    });

    it('User B CANNOT fetch Outlet A 360 directly', async () => {
      await request(app.getHttpServer())
        .get(`/outlets/${outletA_Id}/360`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('User B CANNOT update Outlet A', async () => {
      await request(app.getHttpServer())
        .patch(`/outlets/${outletA_Id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hacked Outlet' })
        .expect(404);
    });

    it('User B CANNOT delete Outlet A', async () => {
      await request(app.getHttpServer())
        .delete(`/outlets/${outletA_Id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });
  });
});
