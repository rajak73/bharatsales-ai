import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import mongoose from 'mongoose';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bharatsales');
  });

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
  });

  describe('Login & Session Edge Cases', () => {
    // 1. correct email/password
    it('/api/v1/auth/login (POST) - correct email and password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'superadmin@bharatsales.com', password: 'password123' })
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
        });
    });

    // 2. invalid password
    it('/api/v1/auth/login (POST) - invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'superadmin@bharatsales.com', password: 'wrongpassword' })
        .expect(401);
    });

    // 3. inactive user
    it('/api/v1/auth/login (POST) - inactive user', async () => {
      // Setup: Make user inactive in DB
      await mongoose.connection.collection('users').updateOne(
        { email: 'superadmin@bharatsales.com' },
        { $set: { status: 'Inactive' } }
      );
      
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'superadmin@bharatsales.com', password: 'password123' })
        .expect(401);

      // Revert
      await mongoose.connection.collection('users').updateOne(
        { email: 'superadmin@bharatsales.com' },
        { $set: { status: 'Active' } }
      );
    });

    // 4. suspended organization
    it('/api/v1/auth/login (POST) - suspended organization', async () => {
      const user = await mongoose.connection.collection('users').findOne({ email: 'superadmin@bharatsales.com' });
      await mongoose.connection.collection('tenants').updateOne(
        { _id: new mongoose.Types.ObjectId(user!.organizationId) },
        { $set: { status: 'Suspended' } }
      );

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'superadmin@bharatsales.com', password: 'password123' })
        .expect(401);

      // Revert
      await mongoose.connection.collection('tenants').updateOne(
        { _id: new mongoose.Types.ObjectId(user!.organizationId) },
        { $set: { status: 'Active' } }
      );
    });

    // 5. OTP when enabled
    it('/api/v1/auth/otp/request & /verify (POST) - OTP flow', async () => {
      const reqRes = await request(app.getHttpServer())
        .post('/api/v1/auth/otp/request')
        .send({ email: 'superadmin@bharatsales.com' })
        .expect(200);
      
      expect(reqRes.body.success).toBe(true);

      // Find token in DB
      const user = await mongoose.connection.collection('users').findOne({ email: 'superadmin@bharatsales.com' });
      const otpDoc = await mongoose.connection.collection('tokens').findOne({ userId: user!._id.toString(), type: 'OTP' });
      
      const verifyRes = await request(app.getHttpServer())
        .post('/api/v1/auth/otp/verify')
        .send({ email: 'superadmin@bharatsales.com', otp: otpDoc!.token })
        .expect(200);

      expect(verifyRes.body.success).toBe(true);
    });

    // 6. forgot/reset password
    it('/api/v1/auth/forgot-password & reset (POST)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'superadmin@bharatsales.com' })
        .expect(200);

      const user = await mongoose.connection.collection('users').findOne({ email: 'superadmin@bharatsales.com' });
      const tokenDoc = await mongoose.connection.collection('tokens').findOne({ userId: user!._id.toString(), type: 'PASSWORD_RESET' });
      
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: tokenDoc!.token, newPassword: 'newpassword123' })
        .expect(200);

      // Test new password
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'superadmin@bharatsales.com', password: 'newpassword123' })
        .expect(200);

      // Reset back for subsequent tests
      await mongoose.connection.collection('users').updateOne(
        { email: 'superadmin@bharatsales.com' },
        { $set: { password: user!.password } }
      );
    });

    // 7. expired invitation
    it('/api/v1/auth/accept-invitation (POST) - expired invitation', async () => {
      // Create expired token
      const user = await mongoose.connection.collection('users').findOne({ email: 'superadmin@bharatsales.com' });
      await mongoose.connection.collection('tokens').insertOne({
        userId: user!._id.toString(),
        token: 'expiredtoken123',
        type: 'INVITATION',
        used: false,
        expiresAt: new Date(Date.now() - 10000) // Expired
      });

      await request(app.getHttpServer())
        .post('/api/v1/auth/accept-invitation')
        .send({ token: 'expiredtoken123', newPassword: 'password123' })
        .expect(400); // Bad Request (invalid or expired)
    });

    // 8. refresh-token rotation
    it('/api/v1/auth/refresh (POST) - refresh token rotation', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'superadmin@bharatsales.com', password: 'password123' })
        .expect(200);

      const refreshToken = loginRes.body.refresh_token;

      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshRes.body.access_token).toBeDefined();
      expect(refreshRes.body.refresh_token).toBeDefined();
      expect(refreshRes.body.refresh_token).not.toEqual(refreshToken);
    });

    // 9. logout
    it('/api/v1/auth/logout (POST) - logout', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'superadmin@bharatsales.com', password: 'password123' })
        .expect(200);

      const refreshToken = loginRes.body.refresh_token;

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(200);

      // Attempt refresh
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    // 10. remote logout
    it('DELETE /api/v1/auth/sessions/:id - remote logout', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'superadmin@bharatsales.com', password: 'password123' })
        .expect(200);

      const token = loginRes.body.access_token;
      
      const sessionsRes = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Get the session created most recently
      const sessions = sessionsRes.body.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const sessionId = sessions[0]._id;

      await request(app.getHttpServer())
        .delete(`/api/v1/auth/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Expect session to be revoked
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: loginRes.body.refresh_token })
        .expect(401);
    });

    // 11. unauthorized route
    it('GET /api/v1/auth/sessions - unauthorized route (missing token)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .expect(401);
    });

    // 12. multiple devices
    it('Multiple devices login', async () => {
      const login1 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'superadmin@bharatsales.com', password: 'password123', deviceInfo: 'iOS' })
        .expect(200);

      const login2 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'superadmin@bharatsales.com', password: 'password123', deviceInfo: 'Android' })
        .expect(200);

      const sessionsRes = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${login2.body.access_token}`)
        .expect(200);

      expect(sessionsRes.body.length).toBeGreaterThanOrEqual(2);
    });
  });
});
