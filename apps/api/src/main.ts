import 'dotenv/config';
import mongoose from 'mongoose';
import { loadEnv } from './env';
import { buildContainer } from './container';
import { createApp } from './app';
import { startScheduler } from './scheduler';

async function bootstrap() {
  let env;
  try {
    env = loadEnv();
  } catch (err: any) {
    console.error(`CRITICAL: ${err.message}\nRefusing to start.`);
    process.exit(1);
  }

  const uri = env.MONGODB_URI || 'mongodb://localhost:27017/bharatsales';
  await mongoose.connect(uri);

  const container = buildContainer(mongoose.connection);
  // No service currently needs async initialisation (no former OnModuleInit hooks).

  const app = createApp(container);
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`BharatSales AI API running on port ${env.PORT}`);
  });

  const stopScheduler = startScheduler(container);

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    stopScheduler();
    server.close(() => {
      mongoose.disconnect().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start API', err);
  process.exit(1);
});
