import express from 'express';
import request from 'supertest';
import { audit, isRedactedKey } from './audit.middleware';

describe('audit middleware', () => {
  it('redacts secret-looking keys by pattern, keeps ordinary fields', () => {
    for (const k of ['password', 'newPassword', 'adminPassword', 'Password', 'otp', 'otpCode', 'token',
      'refreshToken', 'inviteToken', 'secret', 'clientSecret', 'apiKey', 'api_key', 'pin', 'userPin', 'mpin']) {
      expect([k, isRedactedKey(k)]).toEqual([k, true]);
    }
    for (const k of ['pinCode', 'idempotencyKey', 'footprint', 'notes', 'name', 'email', 'reason', 'outletId']) {
      expect([k, isRedactedKey(k)]).toEqual([k, false]);
    }
  });

  const build = () => {
    const auditService = { logAction: jest.fn().mockResolvedValue(undefined) };
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => { (req as any).user = { sub: 'u1', orgId: 'o1', role: 'Organization Admin' }; next(); });
    app.use(audit(auditService, 'Thing'));
    app.post('/json', (_req, res) => { res.status(201).json({ id: 'j1' }); });
    app.delete('/empty/:id', (_req, res) => { res.status(200).end(); });
    app.put('/text/:id', (_req, res) => { res.status(200).send('ok'); });
    app.post('/fail', (_req, res) => { res.status(400).json({ message: 'bad' }); });
    return { app, auditService };
  };

  it('audits JSON, empty and string responses; skips failures', async () => {
    const { app, auditService } = build();
    await request(app).post('/json').send({ password: 'x', name: 'n' }).expect(201);
    await request(app).delete('/empty/e1').expect(200);
    await request(app).put('/text/t1').send({}).expect(200);
    await request(app).post('/fail').send({}).expect(400);
    await new Promise((r) => setImmediate(r));

    expect(auditService.logAction).toHaveBeenCalledTimes(3);
    const calls = auditService.logAction.mock.calls.map((c) => c[0]);
    expect(calls[0]).toMatchObject({ action: 'POST', entityId: 'j1', details: { body: { password: '[REDACTED]', name: 'n' } } });
    expect(calls[1]).toMatchObject({ action: 'DELETE', entityId: 'e1' });
    expect(calls[2]).toMatchObject({ action: 'PUT', entityId: 't1' });
  });
});
