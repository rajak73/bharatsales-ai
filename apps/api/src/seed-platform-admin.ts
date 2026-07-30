import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

// One-off bootstrap script: creates or upgrades a single real platform-operator
// account. Run manually per environment (local, Render) — never exposed via
// any API route. Safe to re-run: it upserts by email rather than inserting
// duplicates, and never touches any other collection.
async function bootstrap() {
  const email = process.env.PLATFORM_ADMIN_EMAIL;
  const password = process.env.PLATFORM_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('CRITICAL: PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD env vars are required.');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bharatsales';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB:', uri);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  // platformAdmin still requires a tenant document per the User schema, even
  // though platform operators aren't scoped to any one org's data.
  let platformTenant = await db.collection('tenants').findOne({ name: 'BharatSales Platform' });
  if (!platformTenant) {
    const inserted = await db.collection('tenants').insertOne({
      name: 'BharatSales Platform',
      status: 'Active',
      plan: 'Internal',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    platformTenant = { _id: inserted.insertedId };
    console.log('Created internal platform tenant.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await db.collection('users').updateOne(
    { email },
    {
      $set: {
        email,
        name: 'Platform Administrator',
        password: hashedPassword,
        role: 'Super Admin',
        platformAdmin: true,
        status: 'Active',
        organizationId: platformTenant._id.toString(),
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );

  console.log(
    result.upsertedCount > 0
      ? `Created platform admin account: ${email}`
      : `Updated existing platform admin account: ${email}`
  );

  await mongoose.disconnect();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('Failed to seed platform admin:', err);
  process.exit(1);
});
