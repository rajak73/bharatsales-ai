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

  // Clear existing data (but do not clear collections that we aren't seeding or that shouldn't exist)
  console.log('Clearing existing data...');
  const collections = ['tenants', 'hierarchy_nodes', 'users', 'products', 'price_lists', 'distributors', 'outlets', 'beats', 'inventory_batches', 'settings'];
  for (const collectionName of collections) {
    try {
      await db.collection(collectionName).deleteMany({});
    } catch (e) {
      console.log(`Collection ${collectionName} might not exist yet.`);
    }
  }

  // 1. Tenants (Organizations)
  const tenant1 = await db.collection('tenants').insertOne({
    name: 'Bharat Foods Pvt Ltd',
    status: 'Active',
    plan: 'Enterprise',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  const tenant2 = await db.collection('tenants').insertOne({
    name: 'Raj Pharma Distributors',
    status: 'Active',
    plan: 'Growth',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const org1Id = tenant1.insertedId.toString();
  const org2Id = tenant2.insertedId.toString();

  // 1a. Global Super Admin (Not tied to one org, but we'll put them in a special state or assign org1Id as per standard mongoose requirements if organizationId is required)
  const defaultPassword = await bcrypt.hash('password123', 10);
  await db.collection('users').insertOne({
    organizationId: org1Id, // Technically super admin can switch context or is exempt, but schema requires it
    name: 'Global Super Admin',
    email: 'superadmin@bharatsales.com',
    password: defaultPassword,
    role: 'Super Admin',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 2. Hierarchy for org1 (Bharat Foods Pvt Ltd)
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
  await db.collection('users').insertMany([
    {
      organizationId: org1Id,
      name: 'Bharat Admin',
      email: 'admin@bharatfoods.com',
      password: defaultPassword,
      role: 'Company Admin', // Org Owner
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      organizationId: org1Id,
      name: 'National Head',
      email: 'nsm@bharatfoods.com',
      password: defaultPassword,
      role: 'National Sales Manager',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      organizationId: org1Id,
      name: 'Zonal Head North',
      email: 'zsm@bharatfoods.com',
      password: defaultPassword,
      role: 'Zonal Sales Manager',
      territoryIds: [zoneId],
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      organizationId: org1Id,
      name: 'Regional Head Delhi',
      email: 'rm@bharatfoods.com',
      password: defaultPassword,
      role: 'Regional Sales Manager',
      territoryIds: [regionId],
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      organizationId: org1Id,
      name: 'Area Head South Delhi',
      email: 'asm@bharatfoods.com',
      password: defaultPassword,
      role: 'Area Sales Manager',
      territoryIds: [areaId],
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      organizationId: org1Id,
      name: 'Sales Rep Saket',
      email: 'rep@bharatfoods.com',
      password: defaultPassword,
      role: 'Sales Representative',
      territoryIds: [territoryId],
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      organizationId: org1Id,
      name: 'Finance Controller',
      email: 'finance@bharatfoods.com',
      password: defaultPassword,
      role: 'Finance User',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      organizationId: org1Id,
      name: 'External Auditor',
      email: 'audit@bharatfoods.com',
      password: defaultPassword,
      role: 'Auditor',
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // Users for org2 (Raj Pharma)
  await db.collection('users').insertOne({
    organizationId: org2Id,
    name: 'Raj Admin',
    email: 'admin@rajpharma.com',
    password: defaultPassword,
    role: 'Company Admin', // Org Owner
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 4. Distributors & Outlets for org1
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

  // Distributor users
  await db.collection('users').insertMany([
    {
      organizationId: org1Id,
      name: 'Distributor Owner Saket',
      email: 'owner@saketdist.com',
      password: defaultPassword,
      role: 'Distributor Owner',
      territoryIds: [territoryId],
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      organizationId: org1Id,
      name: 'Distributor Staff Saket',
      email: 'staff@saketdist.com',
      password: defaultPassword,
      role: 'Distributor Staff',
      territoryIds: [territoryId],
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const outletId = (await db.collection('outlets').insertOne({
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
  })).insertedId.toString();

  // 5. Beats
  await db.collection('beats').insertOne({
    organizationId: org1Id,
    name: 'Saket Monday Beat',
    territoryId: territoryId,
    schedule: ['Monday'],
    outlets: [outletId],
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 6. Products, Price Lists, GST, Inventory Batches
  const productId = (await db.collection('products').insertOne({
    organizationId: org1Id,
    name: 'Premium Soap',
    sku: 'SKU-SOAP-01',
    category: 'Personal Care',
    pricing: { mrp: 50, ptr: 40, basePrice: 40, gstPercentage: 18 },
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  })).insertedId.toString();

  await db.collection('inventory_batches').insertOne({
    organizationId: org1Id,
    productId: productId,
    warehouseId: 'WH-01',
    batchNumber: 'BATCH2026A',
    quantity: 1000,
    mfgDate: new Date('2026-01-01'),
    expDate: new Date('2027-01-01'),
    status: 'Available',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 7. Organization Policies
  await db.collection('settings').insertOne({
    organizationId: org1Id,
    companyName: 'Bharat Foods Pvt Ltd',
    industry: 'FMCG',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    fiscalYearStart: '04-01',
    geofenceRadius: '50', // 50 meters
    gpsAccuracy: '20', // Requires 20m accuracy or better
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shiftStart: '09:00',
    shiftEnd: '18:00',
    orderApprovalThreshold: '10000',
    discountAuthority: '10',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('Database seeded successfully.');
  
  console.log('\n--- SEED DATA CREDENTIALS ---');
  console.log('Global Super Admin : superadmin@bharatsales.com');
  console.log('Org 1 Admin        : admin@bharatfoods.com');
  console.log('Sales Rep          : rep@bharatfoods.com');
  console.log('Org 2 Admin        : admin@rajpharma.com');
  console.log('All Passwords      : password123');

  await mongoose.disconnect();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('Failed to seed database:', err);
  process.exit(1);
});
