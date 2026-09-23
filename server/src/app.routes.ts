import { Router } from 'express';

// Replaces AppController/AppService (Nest @Controller('api/v1')).
// Mount at '/' — the full paths are GET /api/v1/health/live and /api/v1/health/ready.
// Public: no authentication.
export function createAppRouter(): Router {
  const router = Router();

  router.get('/api/v1/health/live', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  router.get('/api/v1/health/ready', (_req, res) => {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        mongodb: process.env.MONGODB_URI ? 'configured' : 'not_configured',
      },
    });
  });

  return router;
}
