import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bharatsales';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB:', uri);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  // Clear existing data
  console.log('Clearing existing data...');
  const collections = ['tenants', 'hierarchy_nodes', 'users', 'products', 'price_lists', 'distributors', 'outlets'];
  for (const collectionName of collections) {
    try {
      await db.collection(collectionName).deleteMany({});
    } catch (e) {
      console.log(`Collection ${collectionName} might not exist yet.`);
    }
  }

  // 1. Tenants
  const tenant1 = await db.collection('tenants').insertOne({
    name: 'FMCG Corp',
    status: 'Active',
    plan: 'Enterprise',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  const tenant2 = await db.collection('tenants').insertOne({
    name: 'Pharma Inc',
    status: 'Active',
    plan: 'Growth',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const org1Id = tenant1.insertedId.toString();
  const org2Id = tenant2.insertedId.toString();

  // 2. Hierarchy for org1
  const zoneId = (await db.collection('hierarchy_nodes').insertOne({
    organizationId: org1Id, name: 'North Zone', level: 'Zone', status: 'Active', createdAt: new Date(), updatedAt: new Date()
  })).insertedId.toString();

  const regionId = (await db.collection('hierarchy_nodes').insertOne({
    organizationId: org1Id, name: 'Delhi NCR', level: 'Region', parentId: zoneId, status: 'Active', createdAt: new Date(), updatedAt: new Date()
  })).insertedId.toString();

  const areaId = (await db.collection('hierarchy_nodes').insertOne({
    organizationId: org1Id, name: 'South Delhi', level: 'Area', parentId: regionId, status: 'Active', createdAt: new Date(), updatedAt: new Date()
  })).insertedId.toString();

  const territoryId = (await db.collection('hierarchy_nodes').insertOne({
    organizationId: org1Id, name: 'Saket', level: 'Territory', parentId: areaId, status: 'Active', createdAt: new Date(), updatedAt: new Date()
  })).insertedId.toString();

  // 3. Users for org1
  const defaultPassword = await bcrypt.hash('password123', 10);
  
  await db.collection('users').insertMany([
    {
      organizationId: org1Id,
      name: 'Super Admin',
      email: 'admin@fmcgcorp.com',
      password: defaultPassword,
      role: 'Super Admin',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      organizationId: org1Id,
      name: 'Regional Manager',
      email: 'rm@fmcgcorp.com',
      password: defaultPassword,
      role: 'Regional Sales Manager',
      territoryIds: [regionId],
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      organizationId: org1Id,
      name: 'Sales Rep Saket',
      email: 'rep@fmcgcorp.com',
      password: defaultPassword,
      role: 'Sales Representative',
      territoryIds: [territoryId],
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // Hierarchy for org2
  await db.collection('users').insertOne({
    organizationId: org2Id,
    name: 'Pharma Admin',
    email: 'admin@pharmainc.com',
    password: defaultPassword,
    role: 'Company Admin',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 4. Products for org1
  await db.collection('products').insertMany([
    {
      organizationId: org1Id,
      name: 'Premium Soap',
      sku: 'SKU-SOAP-01',
      category: 'Personal Care',
      pricing: { mrp: 50, ptr: 40, basePrice: 40, gstPercentage: 18 },
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      organizationId: org1Id,
      name: 'Shampoo 200ml',
      sku: 'SKU-SHMP-01',
      category: 'Personal Care',
      pricing: { mrp: 120, ptr: 100, basePrice: 100, gstPercentage: 18 },
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // 5. Distributors and Outlets
  const distributorId = (await db.collection('distributors').insertOne({
    organizationId: org1Id,
    name: 'Saket Distributors',
    code: 'DIST-001',
    territoryId: territoryId,
    status: 'Active',
    contactPerson: 'Raj Kumar',
    mobile: '9876543210',
    createdAt: new Date(),
    updatedAt: new Date()
  })).insertedId.toString();

  await db.collection('outlets').insertOne({
    organizationId: org1Id,
    name: 'Aggarwal Stores',
    type: 'Retail',
    status: 'Active',
    commercial: {
      assignedDistributorId: distributorId,
      creditLimit: 50000
    },
    location: {
      address: 'Select City Walk, Saket',
      city: 'New Delhi',
      state: 'Delhi',
      coordinates: { lat: 28.5284, lng: 77.2183 }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('Database seeded successfully.');
  
  console.log('\n--- SEED DATA ---');
  console.log('Tenant 1 ID:', org1Id);
  console.log('Tenant 2 ID:', org2Id);
  console.log('Super Admin Email: admin@fmcgcorp.com');
  console.log('Super Admin Password: password123');

  await mongoose.disconnect();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('Failed to seed database:', err);
  process.exit(1);
});
