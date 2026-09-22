import type { MongoMemoryReplSet } from 'mongodb-memory-server';

export default async function globalTeardown() {
  const replSet: MongoMemoryReplSet | undefined = (globalThis as any).__MONGO_REPLSET__;
  if (replSet) await replSet.stop();
}
