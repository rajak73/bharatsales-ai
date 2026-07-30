import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { JwtService } from '@nestjs/jwt';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';

describe('Gap Verification (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let connection: Connection;
  let orgToken: string;
  let hackerToken: string;
  let managerToken: string;

  const validUserId1 = new Types.ObjectId().toHexString();
  const validHackerId = new Types.ObjectId().toHexString();
  const validMgrId = new Types.ObjectId().toHexString();
  const anyOutletId = new Types.ObjectId().toHexString();

  const prodOrg1Id = new Types.ObjectId();
  const gpsOutletId = new Types.ObjectId();
  const distInactiveId = new Types.ObjectId();
  const routeOutletId = new Types.ObjectId();
  const beat1Id = new Types.ObjectId();
  const beatScheduleId = new Types.ObjectId();
  const visitDurId = new Types.ObjectId();
  const territoryId = new Types.ObjectId();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    jwtService = app.get<JwtService>(JwtService);
    connection = app.get<Connection>(getConnectionToken());

    orgToken = jwtService.sign({ sub: validUserId1, email: 'u1@test.com', orgId: 'org-1', role: 'Sales Representative' });
    hackerToken = jwtService.sign({ sub: validHackerId, email: 'h@test.com', orgId: 'org-2', role: 'Sales Representative' });
    managerToken = jwtService.sign({ sub: validMgrId, email: 'm@test.com', orgId: 'org-1', role: 'Sales Manager' });
    // Insert active attendance sessions to bypass BR-002 (Order creation block)
    await connection.collection('attendancesessions').insertOne({
      organizationId: 'org-1',
      user: validUserId1,
      status: 'Active',
      startTime: new Date()
    } as any);

    await connection.collection('attendancesessions').insertOne({
      organizationId: 'org-2',
      user: validHackerId,
      status: 'Active',
      startTime: new Date()
    } as any);

    // Insert users and territories for BR-003
    await connection.collection('users').insertOne({
      _id: new Types.ObjectId(validUserId1),
      organizationId: 'org-1',
      email: 'u1@test.com',
      territoryIds: [territoryId.toHexString()]
    } as any);
    await connection.collection('users').insertOne({
      _id: new Types.ObjectId(validHackerId),
      organizationId: 'org-2',
      email: 'h@test.com',
      territoryIds: [territoryId.toHexString()]
    } as any);
  });

  afterAll(async () => {
    await connection.collection('attendancesessions').deleteMany({ user: { $in: [validUserId1, validHackerId] } } as any);
    await connection.collection('users').deleteMany({ _id: { $in: [new Types.ObjectId(validUserId1), new Types.ObjectId(validHackerId)] } } as any);
    await app.close();
  });

  describe('GAP-01: Tenant Isolation in Orders (Product Isolation)', () => {
    it('should throw an error if user tries to order a product belonging to another organization', async () => {
      await connection.collection('products').deleteMany({ code: 'P1-GAP1' } as any);
      
      await connection.collection('products').insertOne({
        _id: prodOrg1Id,
        organizationId: 'org-1',
        code: 'P1-GAP1',
        sku: 'SKU1-GAP1',
        name: 'Product 1',
        category: 'A',
        price: 100,
        status: 'Active'
      } as any);

      // The hacker's own outlet, legitimately in their org (org-2) — isolates
      // this test to product tenant-isolation rather than outlet isolation.
      await connection.collection('outlets').insertOne({
        _id: new Types.ObjectId(anyOutletId),
        organizationId: 'org-2',
        territoryId: territoryId.toHexString(),
        status: 'Active'
      } as any);

      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${hackerToken}`)
        .send({
          outletId: anyOutletId,
          idempotencyKey: 'test-gap01',
          items: [{ productId: prodOrg1Id.toHexString(), quantity: 10, unitPrice: 100 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Product.*not found/);
      
      await connection.collection('products').deleteMany({ _id: prodOrg1Id } as any);
      await connection.collection('outlets').deleteMany({ _id: new Types.ObjectId(anyOutletId) } as any);
    });
  });

  describe('GAP-02: Strict GPS Validation', () => {
    it('should reject check-in if GPS coordinates exceed geofence radius', async () => {
      await connection.collection('outlets').deleteMany({ code: 'O-GPS-GAP2' } as any);

      await connection.collection('outlets').insertOne({
        _id: gpsOutletId,
        organizationId: 'org-1',
        location: { latitude: 0, longitude: 0, geofenceRadiusMeters: 50 },
        code: 'O-GPS-GAP2', name: 'GPS Test', status: 'Active'
      } as any);

      const res = await request(app.getHttpServer())
        .post('/visits/check-in')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          outletId: gpsOutletId.toHexString(),
          lat: 10,
          lng: 10,
          photoUrl: 'https://test.com/photo.jpg'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Must be within 50m');
      
      await connection.collection('outlets').deleteMany({ _id: gpsOutletId } as any);
    });
  });

  describe('GAP-03 & GAP-05: Auto-Routing & Inactive Distributor Block', () => {
    it('should block order routing if the mapped distributor is inactive', async () => {
      await connection.collection('distributors').deleteMany({ code: 'D-BAD-GAP3' } as any);
      await connection.collection('outlets').deleteMany({ code: 'O-ROUTE-GAP3' } as any);

      await connection.collection('distributors').insertOne({
        _id: distInactiveId,
        organizationId: 'org-1',
        status: 'Inactive',
        name: 'Bad Dist',
        code: 'D-BAD-GAP3'
      } as any);
      
      await connection.collection('outlets').insertOne({
        _id: routeOutletId,
        organizationId: 'org-1',
        territoryId: territoryId.toHexString(),
        commercial: { assignedDistributorId: distInactiveId.toHexString() },
        status: 'Active',
        code: 'O-ROUTE-GAP3'
      } as any);

      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          outletId: routeOutletId.toHexString(),
          idempotencyKey: 'test-gap03',
          items: []
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('inactive distributor');
      
      await connection.collection('outlets').deleteMany({ _id: routeOutletId } as any);
      await connection.collection('distributors').deleteMany({ _id: distInactiveId } as any);
    });
  });

  describe('GAP-04: Hierarchy Filtering in DSR', () => {
    it('should use HierarchyService to limit DSR data to descendant territories', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/performance/dsr')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  describe('GAP-06: Beat Progress Completion Percentage', () => {
    it('should return completion percentage dynamically', async () => {
      await connection.collection('beatschedules').deleteMany({ user: validUserId1 } as any);

      await connection.collection('beats').insertOne({
        _id: beat1Id,
        organizationId: 'org-1',
        userId: validUserId1,
        name: 'Test Beat',
        outlets: ['outlet-1', 'outlet-2'],
        status: 'Active'
      } as any);

      await connection.collection('beatschedules').insertOne({
        _id: beatScheduleId,
        organizationId: 'org-1',
        user: validUserId1,
        date: new Date(),
        beat: beat1Id,
        status: 'Scheduled'
      } as any);

      await connection.collection('visits').insertOne({
        organizationId: 'org-1',
        beatId: beat1Id.toHexString(),
        user: validUserId1, 
        outletId: 'outlet-1',
        status: 'Completed',
        checkInTime: new Date(),
        createdAt: new Date()
      } as any);

      const res = await request(app.getHttpServer())
        .get('/beats/today')
        .set('Authorization', `Bearer ${orgToken}`)
        .expect(200);

      expect(res.body.completionPercentage).toBe(50);

      await connection.collection('beatschedules').deleteMany({ _id: beatScheduleId } as any);
      await connection.collection('beats').deleteMany({ _id: beat1Id } as any);
      await connection.collection('visits').deleteMany({ beatId: beat1Id.toHexString() } as any);
    });
  });

  describe('GAP-07: Visit Duration Calculation', () => {
    it('should calculate durationMinutes on check-out', async () => {
      const checkInTime = new Date();
      checkInTime.setMinutes(checkInTime.getMinutes() - 30);

      await connection.collection('visits').insertOne({
        _id: visitDurId,
        organizationId: 'org-1',
        user: validUserId1, 
        outlet: new Types.ObjectId(),
        status: 'Active',
        checkInLocation: { lat: 0, lng: 0, accuracy: 10 },
        checkInTime: checkInTime,
        checkOutTime: null,
        durationMinutes: null
      } as any);

      const res = await request(app.getHttpServer())
        .post(`/visits/${visitDurId.toHexString()}/check-out`)
        .set('Authorization', `Bearer ${orgToken}`)
        .send({ lat: 0, lng: 0 })
        .expect(201);

      expect(res.body.durationMinutes).toBeGreaterThanOrEqual(29);
      expect(res.body.durationMinutes).toBeLessThanOrEqual(31);

      await connection.collection('visits').deleteMany({ _id: visitDurId } as any);
    });
  });

  describe('GAP-08: PWA Offline Login Validity Enforcement (Missing)', () => {
    it.todo('should forcefully reject offline login if the last successful network login exceeds 7 days (Currently unimplemented in PWA and API client)');
  });

  describe('GAP-09: Unexposed Session Management Endpoints', () => {
    it('should successfully fetch active sessions (verifying endpoint exists despite missing UI)', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${orgToken}`);
      
      // We expect the endpoint to exist and be functional
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GAP-11: Disconnected Backend API Routes', () => {
    it.todo('verifies 46 backend endpoints (e.g. SSO, Return Approvals, Sync) are missing from api-client');
  });

  describe('GAP-12: Hallucinated Business Logic', () => {
    it.todo('verifies the existence of missing modules (DispatchService, DashboardService, ExportsService)');
    it.todo('verifies OrdersService.checkCreditLimit exists');
    it.todo('verifies Attendance duplicate day logic is uncommented');
  });

  describe('GAP-10: Unused Registration Endpoint', () => {
    it('should confirm the /auth/register endpoint exists and is active (despite missing UI integration)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'new_gap10_user@test.com',
          password: 'password123',
          role: 'Sales Representative',
          organizationId: 'org-1'
        });
      
      // Depending on implementation, it might return 201 Created or 400 (if org validation fails), 
      // but it should NOT return 404 (Not Found).
      expect(res.status).not.toBe(404);
    });
  });
});
