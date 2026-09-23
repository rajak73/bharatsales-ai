import { Router } from 'express';
import mongoose, { Connection } from 'mongoose';

const PING_TIMEOUT_MS = 1000; // same default as @nestjs/terminus pingCheck

async function checkMongo(conn: Connection): Promise<{ up: boolean; message?: string }> {
  // 1 = connected
  if (conn.readyState !== 1 || !conn.db) {
    return { up: false, message: 'MongoDB is not connected' };
  }
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      conn.db.admin().ping(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timeout of ${PING_TIMEOUT_MS}ms exceeded`)), PING_TIMEOUT_MS);
      }),
    ]);
    return { up: true };
  } catch (err: any) {
    return { up: false, message: err?.message || 'MongoDB ping failed' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Replaces @nestjs/terminus. Mount at /health (public, no auth). Defaults to
 * mongoose's default connection; pass the app's Connection if it uses another.
 * Response shape matches terminus's HealthCheckResult:
 *   200 { status: 'ok',    info: { mongodb: { status: 'up' } }, error: {}, details: { mongodb: { status: 'up' } } }
 *   503 { status: 'error', info: {}, error: { mongodb: { status: 'down', message } }, details: { mongodb: {...} } }
 */
export function createHealthRouter(connection: Connection = mongoose.connection): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const mongo = await checkMongo(connection);
    if (mongo.up) {
      const mongodb = { status: 'up' };
      res.status(200).json({ status: 'ok', info: { mongodb }, error: {}, details: { mongodb } });
      return;
    }
    const mongodb = { status: 'down', ...(mongo.message ? { message: mongo.message } : {}) };
    res.status(503).json({ status: 'error', info: {}, error: { mongodb }, details: { mongodb } });
  });

  return router;
}
