import express from 'express';
import request from 'supertest';
import { createHealthRouter } from './health.routes';

function appWith(connection: any) {
  const app = express();
  app.use('/health', createHealthRouter(connection));
  return app;
}

describe('GET /health', () => {

  it('returns 503 with the terminus error shape when MongoDB is not connected', async () => {
    const res = await request(appWith({ readyState: 0, db: undefined })).get('/health').expect(503);
    expect(res.body.status).toBe('error');
    expect(res.body.info).toEqual({});
    expect(res.body.error.mongodb.status).toBe('down');
    expect(res.body.details.mongodb.status).toBe('down');
  });

  it('returns 200 with the terminus ok shape when MongoDB answers a ping', async () => {
    const ping = jest.fn().mockResolvedValue({ ok: 1 });
    const res = await request(appWith({ readyState: 1, db: { admin: () => ({ ping }) } })).get('/health').expect(200);
    expect(res.body).toEqual({
      status: 'ok',
      info: { mongodb: { status: 'up' } },
      error: {},
      details: { mongodb: { status: 'up' } },
    });
  });

  it('returns 503 when connected but the ping fails', async () => {
    const ping = jest.fn().mockRejectedValue(new Error('boom'));
    const res = await request(appWith({ readyState: 1, db: { admin: () => ({ ping }) } })).get('/health').expect(503);
    expect(res.body.error).toEqual({ mongodb: { status: 'down', message: 'boom' } });
  });
});
