import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../core/auth.middleware';
import { emailField, optEmailField, passwordField, optPasswordField } from '../core/validation';
import { route, validateBody } from '../core/http';
import {
  loginLimiter, otpLimiter, forgotPasswordLimiter, resetPasswordLimiter,
  registerLimiter, refreshLimiter, credentialIpLimiter,
} from '../core/rate-limit';
import type { AuthService } from './auth.service';

// Every /auth body is validated so that only plain strings reach the Mongo
// queries (blocks NoSQL operator injection such as {"email": {"$ne": null}}).
// Optional-string fields whose absence the old controller answered with a
// 200 { statusCode: 400, message } body keep that exact behaviour below.
const optStr = z.string().optional();

const registerSchema = z.object({
  companyName: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().optional().default(''),
  email: emailField,
  password: passwordField,
});

// Login deliberately does not apply the password policy (existing
// passwords may predate it); it only normalises the email.
const loginSchema = z.object({
  email: emailField,
  password: optStr,
  otp: optStr,
  deviceInfo: optStr,
});

const emailSchema = z.object({ email: optEmailField });
const otpVerifySchema = z.object({ email: optEmailField, otp: optStr });
const tokenPasswordSchema = z.object({ token: optStr, newPassword: optPasswordField });
const tokenSchema = z.object({ token: optStr });
const refreshSchema = z.object({ refreshToken: optStr });
const pushTokenSchema = z.object({ pushToken: optStr });

const OK = { status: 200 };

export function createAuthRouter(deps: { authService: AuthService }): Router {
  const { authService } = deps;
  const router = Router();

  // Public self-serve signup — the tenant it creates starts in 'Pending
  // Approval' (see AuthService.register) and cannot log in until a Super
  // Admin approves it from the Organizations page.
  router.post('/register', registerLimiter, validateBody(registerSchema),
    route((req) => authService.register(req.body), OK));

  router.post('/login', credentialIpLimiter, loginLimiter, validateBody(loginSchema),
    route((req) => authService.login(req.body, req.ip), OK));

  router.post('/otp/request', credentialIpLimiter, otpLimiter, validateBody(emailSchema),
    route((req) => {
      if (!req.body.email) {
        return { statusCode: 400, message: 'Email is required' };
      }
      return authService.requestOtp(req.body.email);
    }, OK));

  router.post('/otp/verify', credentialIpLimiter, otpLimiter, validateBody(otpVerifySchema),
    route((req) => {
      if (!req.body.email || !req.body.otp) {
        return { statusCode: 400, message: 'Email and OTP are required' };
      }
      return authService.verifyOtp(req.body.email, req.body.otp);
    }, OK));

  router.post('/forgot-password', credentialIpLimiter, forgotPasswordLimiter, validateBody(emailSchema),
    route((req) => {
      if (!req.body.email) {
        return { statusCode: 400, message: 'Email is required' };
      }
      return authService.forgotPassword(req.body.email);
    }, OK));

  router.post('/reset-password', resetPasswordLimiter, validateBody(tokenPasswordSchema),
    route((req) => {
      if (!req.body.token || !req.body.newPassword) {
        return { statusCode: 400, message: 'Token and newPassword are required' };
      }
      return authService.resetPassword(req.body.token, req.body.newPassword);
    }, OK));

  router.post('/verify-email', validateBody(tokenSchema),
    route((req) => {
      if (!req.body.token) {
        return { statusCode: 400, message: 'Token is required' };
      }
      return authService.verifyEmail(req.body.token);
    }, OK));

  router.post('/refresh', refreshLimiter, validateBody(refreshSchema),
    route((req) => {
      if (!req.body.refreshToken) {
        return { statusCode: 400, message: 'Refresh token is required' };
      }
      return authService.refresh(req.body.refreshToken);
    }, OK));

  router.post('/accept-invitation', validateBody(tokenPasswordSchema),
    route((req) => {
      if (!req.body.token || !req.body.newPassword) {
        return { statusCode: 400, message: 'Token and newPassword are required' };
      }
      return authService.acceptInvitation(req.body.token, req.body.newPassword);
    }, OK));

  router.post('/logout', validateBody(refreshSchema),
    route((req) => {
      if (!req.body.refreshToken) {
        return { statusCode: 400, message: 'Refresh token is required' };
      }
      return authService.logout(req.body.refreshToken);
    }, OK));

  // The SSO providers are mocks that accept any token and return a fixed
  // identity. They are only mounted when explicitly enabled for local
  // development (MOCK_SSO_ENABLED=true) and never in production; otherwise
  // these paths are plain 404s.
  const mockSsoEnabled = () =>
    process.env.MOCK_SSO_ENABLED === 'true' && process.env.NODE_ENV !== 'production';
  router.use('/sso', (_req, _res, next) => (mockSsoEnabled() ? next() : next('router')));

  router.get('/sso/google', route(() => ({ url: authService.googleSSO.getAuthUrl() })));

  // No @HttpCode on the SSO callbacks in the Nest controller → POST default 201.
  router.post('/sso/google/callback', validateBody(tokenSchema),
    route(async (req) => {
      if (!req.body.token) return { statusCode: 400, message: 'Token required' };
      const userInfo = await authService.googleSSO.verifyToken(req.body.token);
      // Real implementation would login/register using userInfo.email
      return { success: true, message: 'Google SSO successful', user: userInfo };
    }));

  router.get('/sso/microsoft', route(() => ({ url: authService.microsoftSSO.getAuthUrl() })));

  router.post('/sso/microsoft/callback', validateBody(tokenSchema),
    route(async (req) => {
      if (!req.body.token) return { statusCode: 400, message: 'Token required' };
      const userInfo = await authService.microsoftSSO.verifyToken(req.body.token);
      // Real implementation would login/register using userInfo.email
      return { success: true, message: 'Microsoft SSO successful', user: userInfo };
    }));

  router.get('/sessions', authenticate,
    route((req) => authService.getActiveSessions(req.user.sub)));

  router.delete('/sessions/:id', authenticate,
    route((req) => authService.revokeSession(req.params.id, req.user.sub), OK));

  // Self-service — any authenticated user registers their own device's Expo
  // push token (authentication only, no Users resource permission needed).
  router.post('/push-token', authenticate, validateBody(pushTokenSchema),
    route((req) => authService.registerPushToken(req.user.sub, req.body.pushToken ?? ''), OK));

  return router;
}
