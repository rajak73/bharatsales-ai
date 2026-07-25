import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { execSync } from 'child_process';

describe('Exports Integration (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let jwtService: JwtService;
  let tenantId: string;
  let token: string;

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

    // Fetch tenant ID
    const tenants = await connection.collection('tenants').find({}).toArray();
    tenantId = tenants.find(t => t.name === 'Bharat Foods Pvt Ltd')?._id.toString() || '';

    // Fetch Super Admin
    const user = await connection.collection('users').findOne({ organizationId: tenantId, email: 'superadmin@bharatsales.com' });
    if (!user) throw new Error('Seeded user not found');

    // Generate Token
    token = jwtService.sign({ sub: user._id.toString(), email: user.email, orgId: tenantId, role: user.role });
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  describe('Exports Queue processing', () => {
    it('Should enqueue an export job and return queued status', async () => {
      const res = await request(app.getHttpServer())
        .post('/exports/request')
        .set('Authorization', `Bearer ${token}`)
        .send({
          entityType: 'orders',
          filters: {}
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('queued');
      expect(res.body.entityType).toBe('orders');
      
      const jobId = res.body._id;

      // Ensure job is readable
      const getRes = await request(app.getHttpServer())
        .get('/exports')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(getRes.body)).toBe(true);
      expect(getRes.body.some((j: any) => j._id === jobId)).toBe(true);
    });
  });
});
