import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let connection: Connection;
  let org1Token: string;
  let org2Token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    jwtService = app.get<JwtService>(JwtService);
    connection = app.get<Connection>(getConnectionToken());

    org1Token = jwtService.sign({ sub: 'user1', email: 'u1@test.com', orgId: 'org-test-1', role: 'Admin' });
    org2Token = jwtService.sign({ sub: 'user2', email: 'u2@test.com', orgId: 'org-test-2', role: 'Admin' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Outlets API', () => {
    it('should only return outlets for the authenticated user\'s organization', async () => {
      // Create outlets for both orgs directly in DB to guarantee they exist
      await connection.collection('outlets').insertMany([
        { organizationId: 'org-test-1', code: 'OUT-1', name: 'Org 1 Outlet', ownerName: 'O1', category: 'Retail', tier: 'A', status: 'Active', mobile: '123', location: { address: 'A', state: 'S', pinCode: 'P', latitude: 0, longitude: 0 }, commercial: { creditLimit: 0, paymentTermsDays: 0, outstandingBalance: 0 }, tax: {} },
        { organizationId: 'org-test-2', code: 'OUT-2', name: 'Org 2 Outlet', ownerName: 'O2', category: 'Retail', tier: 'A', status: 'Active', mobile: '456', location: { address: 'A', state: 'S', pinCode: 'P', latitude: 0, longitude: 0 }, commercial: { creditLimit: 0, paymentTermsDays: 0, outstandingBalance: 0 }, tax: {} }
      ]);

      const res1 = await request(app.getHttpServer())
        .get('/outlets')
        .set('Authorization', `Bearer ${org1Token}`)
        .expect(200);

      expect(res1.body.length).toBeGreaterThan(0);
      res1.body.forEach((outlet: any) => {
        expect(outlet.organizationId).toBe('org-test-1');
      });

      const res2 = await request(app.getHttpServer())
        .get('/outlets')
        .set('Authorization', `Bearer ${org2Token}`)
        .expect(200);

      expect(res2.body.length).toBeGreaterThan(0);
      res2.body.forEach((outlet: any) => {
        expect(outlet.organizationId).toBe('org-test-2');
      });

      // Cleanup
      await connection.collection('outlets').deleteMany({ organizationId: { $in: ['org-test-1', 'org-test-2'] } });
    });
  });
});
