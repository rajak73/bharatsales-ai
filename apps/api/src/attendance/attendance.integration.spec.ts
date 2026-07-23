import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

describe('Attendance State Machine (e2e)', () => {
  let app: INestApplication;
  jest.setTimeout(30000);

  let token: string;
  let orgId: string;
  let userId: string;
  let outletId: string;
  let connection: Connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    connection = app.get<Connection>(getConnectionToken());

    await connection.collection('users').deleteMany({ email: 'attendancetest@test.com' });
    await connection.collection('tenants').deleteMany({ name: 'Attendance Test Tenant' });
    await connection.collection('outlets').deleteMany({ name: 'Attendance Test Outlet' });
    await connection.collection('attendancesessions').deleteMany({});
    await connection.collection('visits').deleteMany({});

    const tenant = await connection.collection('tenants').insertOne({ name: 'Attendance Test Tenant', status: 'Active', createdAt: new Date(), updatedAt: new Date() });
    orgId = tenant.insertedId.toString();

    const pwd = await bcrypt.hash('password123', 10);
    const user = await connection.collection('users').insertOne({
      email: 'attendancetest@test.com',
      password: pwd,
      organizationId: orgId,
      role: 'Sales Representative',
      status: 'Active',
      name: 'Attendance User',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    userId = user.insertedId.toString();

    const outlet = await connection.collection('outlets').insertOne({
      name: 'Attendance Test Outlet',
      organizationId: orgId,
      status: 'Active',
      type: 'Retail',
      location: { lat: 10, lng: 20 },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    outletId = outlet.insertedId.toString();

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'attendancetest@test.com', password: 'password123' })
      .expect(200);
    token = login.body.access_token;
  });

  afterAll(async () => {
    await connection.collection('users').deleteMany({ email: 'attendancetest@test.com' });
    await connection.collection('tenants').deleteMany({ name: 'Attendance Test Tenant' });
    await connection.collection('outlets').deleteMany({ name: 'Attendance Test Outlet' });
    await connection.collection('attendancesessions').deleteMany({});
    await connection.collection('visits').deleteMany({});
    await app.close();
  });

  it('Start Day creates a new active session', async () => {
    const res = await request(app.getHttpServer())
      .post('/attendance/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ lat: 10.1, lng: 20.1, accuracy: 5 })
      .expect(201);
    
    expect(res.body.status).toBe('Active');
    expect(res.body.user).toBe(userId);
  });

  it('Start Day is idempotent (returns existing session)', async () => {
    const res = await request(app.getHttpServer())
      .post('/attendance/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ lat: 10.2, lng: 20.2, accuracy: 10 })
      .expect(201);
    
    expect(res.body.status).toBe('Active');
    // Location should still be the original one since it didn't create a new one
    expect(res.body.startLocation.lat).toBe(10.1);
  });

  it('Check-in to a visit', async () => {
    const res = await request(app.getHttpServer())
      .post('/visits/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send({ outletId, lat: 10, lng: 20, accuracy: 5 })
      .expect(201);
    
    expect(res.body.status).toBe('Active');
  });

  it('End Day closes active visits and attendance session', async () => {
    const res = await request(app.getHttpServer())
      .post('/attendance/end')
      .set('Authorization', `Bearer ${token}`)
      .send({ lat: 10.3, lng: 20.3, accuracy: 5 })
      .expect(201);
    
    expect(res.body.status).toBe('Completed');

    // Verify visit is closed
    const activeVisit = await connection.collection('visits').findOne({ user: userId, status: 'Active' });
    expect(activeVisit).toBeNull();

    const completedVisit = await connection.collection('visits').findOne({ user: userId });
    expect(completedVisit?.status).toBe('Completed');
    expect(completedVisit?.checkOutTime).toBeDefined();
  });
});
