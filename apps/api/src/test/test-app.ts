import mongoose, { Connection } from 'mongoose';
import jwt from 'jsonwebtoken';
import type { Express } from 'express';
import { buildContainer, Container } from '../container';
import { createApp } from '../app';
import { seedDatabase } from '../seed';

export interface TestApp {
  app: Express;
  container: Container;
  connection: Connection;
  /** Same signature as Nest's JwtService.sign, signing with JWT_SECRET (15m). */
  jwtService: { sign(payload: object): string };
  /** Kept so supertest calls read like before: request(app.getHttpServer()). */
  getHttpServer(): Express;
  close(): Promise<void>;
}

/**
 * Boots the real Express app (all routers, middleware, error handler) on its
 * own Mongoose connection. Each Jest worker gets its own database so parallel
 * workers never wipe each other's data.
 */
export async function bootTestApp(): Promise<TestApp> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set (jest globalSetup should have started a memory server)');

  const dbName = `bharatsales_test_${process.env.JEST_WORKER_ID || '1'}`;
  const connection = await mongoose.createConnection(uri, { dbName }).asPromise();
  const container = buildContainer(connection);
  // Build indexes up front (unique indexes are part of the behaviour under test).
  await Promise.all(Object.values(container.models).map((m) => m.init()));
  const app = createApp(container);

  return {
    app,
    container,
    connection,
    jwtService: {
      sign: (payload: object) => jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '15m' }),
    },
    getHttpServer: () => app,
    close: () => connection.close(),
  };
}

/** Resets the database to the baseline seed (replaces `execSync('npx ts-node src/seed.ts')`). */
export async function seedTestDatabase(connection: Connection) {
  if (!connection.db) throw new Error('Connection not open');
  return seedDatabase(connection.db, { quiet: true });
}
