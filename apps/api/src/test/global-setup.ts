import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const { MongoClient } = mongoose.mongo;

/**
 * Jest globalSetup. Starts a single-member in-memory replica set (the API uses
 * multi-document transactions, which need a replica set) unless MONGODB_URI is
 * already set, e.g. by CI pointing at a real MongoDB service.
 * Workers inherit process.env, so they all see MONGODB_URI.
 */
export default async function globalSetup() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret';

  if (process.env.MONGODB_URI) return;

  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    // First launch of a freshly downloaded mongod can be slow (e.g. macOS binary verification).
    instanceOpts: [{ launchTimeout: 60_000 }],
  });
  (globalThis as any).__MONGO_REPLSET__ = replSet;
  process.env.MONGODB_URI = replSet.getUri();

  // Same as CI: the 5ms default transaction lock timeout makes concurrent
  // transactional requests fail spuriously on a busy test machine.
  const client = await MongoClient.connect(replSet.getUri());
  try {
    await client.db('admin').command({ setParameter: 1, maxTransactionLockRequestTimeoutMillis: 5000 });
  } finally {
    await client.close();
  }
}
