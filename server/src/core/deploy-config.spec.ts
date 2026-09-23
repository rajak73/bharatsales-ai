import express from 'express';
import request from 'supertest';
import cors from 'cors';
import { DEFAULT_PROD_ORIGIN } from '../app';
import { loadEnv } from '../env';

describe('deploy config', () => {
  describe('DEFAULT_PROD_ORIGIN (used when CORS_ORIGINS is unset in production)', () => {
    it.each([
      'https://bharatsales-ai-web.vercel.app',
      'https://bharatsales-ai-web-git-migrate-express-react-rajak73.vercel.app',
      'https://bharatsales-ai-web-a1b2c3d4-rajak73s-projects.vercel.app',
    ])('allows the project web dashboard origin %s', (origin) => {
      expect(DEFAULT_PROD_ORIGIN.test(origin)).toBe(true);
    });

    it.each([
      'https://evil.example.com',
      'http://bharatsales-ai-web.vercel.app',
      'https://bharatsales-ai-web.vercel.app.evil.com',
      'https://evilbharatsales-ai-web.vercel.app',
      'https://other-project.vercel.app',
    ])('rejects %s', (origin) => {
      expect(DEFAULT_PROD_ORIGIN.test(origin)).toBe(false);
    });

    it('is enforced by the cors middleware', async () => {
      const app = express();
      app.use(cors({ credentials: true, origin: (o, cb) => cb(null, !o || DEFAULT_PROD_ORIGIN.test(o)) }));
      app.get('/x', (_req, res) => res.json({ ok: true }));

      const ok = await request(app).get('/x').set('Origin', 'https://bharatsales-ai-web.vercel.app');
      expect(ok.headers['access-control-allow-origin']).toBe('https://bharatsales-ai-web.vercel.app');

      const bad = await request(app).get('/x').set('Origin', 'https://evil.example.com');
      expect(bad.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('loadEnv', () => {
    it('refuses a JWT_SECRET shorter than 32 characters in production', () => {
      expect(() => loadEnv({ NODE_ENV: 'production', JWT_SECRET: 'short', MONGODB_URI: 'mongodb://x/y' } as any)).toThrow(/JWT_SECRET/);
    });

    it('still requires MONGODB_URI in production', () => {
      expect(() => loadEnv({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40) } as any)).toThrow(/MONGODB_URI/);
    });
  });
});
