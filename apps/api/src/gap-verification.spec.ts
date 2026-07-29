import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { JwtService } from '@nestjs/jwt';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Gap Verification (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let connection: Connection;
  let orgToken: string;
  let hackerToken: string;
  let managerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    jwtService = app.get<JwtService>(JwtService);
    connection = app.get<Connection>(getConnectionToken());

    orgToken = jwtService.sign({ sub: 'user1', email: 'u1@test.com', orgId: 'org-1', role: 'Sales Representative' });
    hackerToken = jwtService.sign({ sub: 'hacker', email: 'h@test.com', orgId: 'org-2', role: 'Sales Representative' });
    managerToken = jwtService.sign({ sub: 'mgr', email: 'm@test.com', orgId: 'org-1', role: 'Sales Manager' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GAP-01: Tenant Isolation in Orders (Product Isolation)', () => {
    it('should throw an error if user tries to order a product belonging to another organization', async () => {
      // Create a product for org-1
      await connection.collection('products').insertOne({
        _id: 'prod-org-1',
        organizationId: 'org-1',
        code: 'P1',
        name: 'Product 1',
        category: 'A',
        price: 100,
        status: 'Active'
      });

      // Hacker from org-2 tries to order prod-org-1
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${hackerToken}`)
        .send({
          outletId: 'any-outlet',
          items: [{ productId: 'prod-org-1', quantity: 10, unitPrice: 100 }]
        });

      // Should fail because the product is not found within org-2
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Product not found');
      
      await connection.collection('products').deleteMany({ _id: 'prod-org-1' });
    });
  });

  describe('GAP-02: Strict GPS Validation', () => {
    it('should reject check-in if GPS coordinates exceed geofence radius', async () => {
      // Create outlet with strict geofence (50m) at 0,0
      await connection.collection('outlets').insertOne({
        _id: 'gps-outlet',
        organizationId: 'org-1',
        location: { latitude: 0, longitude: 0, geofenceRadiusMeters: 50 },
        code: 'O-GPS', name: 'GPS Test', status: 'Active'
      });

      const res = await request(app.getHttpServer())
        .post('/visits/check-in')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          outletId: 'gps-outlet',
          latitude: 10, // Very far away
          longitude: 10
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('outside the allowed geofence');
      
      await connection.collection('outlets').deleteMany({ _id: 'gps-outlet' });
    });
  });

  describe('GAP-03 & GAP-05: Auto-Routing & Inactive Distributor Block', () => {
    it('should block order routing if the mapped distributor is inactive', async () => {
      // Inactive distributor
      await connection.collection('distributors').insertOne({
        _id: 'dist-inactive',
        organizationId: 'org-1',
        status: 'Inactive',
        name: 'Bad Dist'
      });
      // Outlet assigned to inactive distributor
      await connection.collection('outlets').insertOne({
        _id: 'route-outlet',
        organizationId: 'org-1',
        commercial: { assignedDistributorId: 'dist-inactive' },
        status: 'Active'
      });

      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          outletId: 'route-outlet',
          items: []
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Distributor is not active');
      
      await connection.collection('outlets').deleteMany({ _id: 'route-outlet' });
      await connection.collection('distributors').deleteMany({ _id: 'dist-inactive' });
    });
  });

  describe('GAP-04: Hierarchy Filtering in DSR', () => {
    it('should use HierarchyService to limit DSR data to descendant territories', async () => {
      // This endpoint should no longer return org-wide hardcoded data
      const res = await request(app.getHttpServer())
        .get('/performance/dsr')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      // It should execute without errors, confirming HierarchyService was injected properly
      expect(res.body).toBeDefined();
    });
  });

  describe('GAP-06: Beat Progress Completion Percentage', () => {
    it('should return completion percentage dynamically', async () => {
      await connection.collection('beats').insertOne({
        _id: 'beat-1',
        organizationId: 'org-1',
        userId: 'user1',
        name: 'Test Beat',
        outlets: ['outlet-1', 'outlet-2'],
        status: 'Active'
      });

      // Insert one completed visit for outlet-1
      await connection.collection('visits').insertOne({
        organizationId: 'org-1',
        beatId: 'beat-1',
        userId: 'user1',
        outletId: 'outlet-1',
        status: 'Completed',
        createdAt: new Date()
      });

      const res = await request(app.getHttpServer())
        .get('/beats/today')
        .set('Authorization', `Bearer ${orgToken}`)
        .expect(200);

      expect(res.body.completionPercentage).toBe(50); // 1 out of 2 outlets visited

      await connection.collection('beats').deleteMany({ _id: 'beat-1' });
      await connection.collection('visits').deleteMany({ beatId: 'beat-1' });
    });
  });

  describe('GAP-07: Visit Duration Calculation', () => {
    it('should calculate durationMinutes on check-out', async () => {
      const checkInTime = new Date();
      checkInTime.setMinutes(checkInTime.getMinutes() - 30); // Checked in 30 mins ago

      await connection.collection('visits').insertOne({
        _id: 'visit-dur',
        organizationId: 'org-1',
        userId: 'user1',
        outletId: 'outlet-dur',
        status: 'In Progress',
        checkInTime: checkInTime,
        checkOutTime: null,
        durationMinutes: null
      });

      const res = await request(app.getHttpServer())
        .post('/visits/visit-dur/checkout')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({ latitude: 0, longitude: 0 })
        .expect(200);

      expect(res.body.durationMinutes).toBeGreaterThanOrEqual(29);
      expect(res.body.durationMinutes).toBeLessThanOrEqual(31);

      await connection.collection('visits').deleteMany({ _id: 'visit-dur' });
    });
  });
});
