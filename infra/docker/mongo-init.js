// MongoDB initialization script for BharatSales AI
db = db.getSiblingDB('bharatsales');

// Create collections with validation
db.createCollection('organizations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'status', 'createdAt'],
      properties: {
        name: { bsonType: 'string' },
        status: { enum: ['Trial', 'Active', 'Past Due', 'Suspended', 'Archived'] },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('users');
db.createCollection('roles');
db.createCollection('permissions');
db.createCollection('products');
db.createCollection('outlets');
db.createCollection('orders');
db.createCollection('order_items');
db.createCollection('order_status_history');
db.createCollection('attendance_sessions');
db.createCollection('visits');
db.createCollection('collections');
db.createCollection('targets');
db.createCollection('distributors');
db.createCollection('inventory_batches');
db.createCollection('stock_movements');
db.createCollection('audit_logs');

// Create indexes
db.organizations.createIndex({ 'name': 1 }, { unique: true });
db.users.createIndex({ 'email': 1, 'organizationId': 1 }, { unique: true });
db.users.createIndex({ 'organizationId': 1 });
db.products.createIndex({ 'sku': 1, 'organizationId': 1 }, { unique: true });
db.products.createIndex({ 'organizationId': 1 });
db.outlets.createIndex({ 'code': 1, 'organizationId': 1 }, { unique: true });
db.outlets.createIndex({ 'organizationId': 1, 'territoryId': 1 });
db.orders.createIndex({ 'organizationId': 1, 'createdAt': -1 });
db.orders.createIndex({ 'outletId': 1, 'organizationId': 1 });
db.attendance_sessions.createIndex({ 'userId': 1, 'organizationId': 1, 'date': -1 });
db.visits.createIndex({ 'organizationId': 1, 'date': -1 });
db.audit_logs.createIndex({ 'organizationId': 1, 'timestamp': -1 });

// Seed demo organization
db.organizations.insertOne({
  _id: 'org_001',
  name: 'Demo FMCG Company',
  status: 'Active',
  plan: 'Growth',
  settings: {
    fiscalYearStart: '04-01',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    geofenceRadius: 5,
    gpsAccuracyTolerance: 10,
    currency: 'INR',
    timezone: 'Asia/Kolkata'
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

db.organizations.insertOne({
  _id: 'org_002',
  name: 'Demo Pharma Limited',
  status: 'Trial',
  plan: 'Starter',
  settings: {
    fiscalYearStart: '04-01',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    geofenceRadius: 5,
    gpsAccuracyTolerance: 8,
    currency: 'INR',
    timezone: 'Asia/Kolkata'
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Seed demo users
db.users.insertMany([
  {
    _id: 'usr_admin',
    email: 'admin@bharatsales.ai',
    passwordHash: '$2a$10$demo_hash', // demo123
    name: 'Admin User',
    role: 'Company Admin',
    organizationId: 'org_001',
    isActive: true,
    createdAt: new Date()
  },
  {
    _id: 'usr_manager',
    email: 'manager@bharatsales.ai',
    passwordHash: '$2a$10$demo_hash', // manager123
    name: 'Rahul Kumar',
    role: 'Sales Manager',
    organizationId: 'org_001',
    isActive: true,
    createdAt: new Date()
  },
  {
    _id: 'usr_rep',
    email: 'rep@bharatsales.ai',
    passwordHash: '$2a$10$demo_hash', // rep123
    name: 'Amit Singh',
    role: 'Sales Representative',
    organizationId: 'org_001',
    isActive: true,
    createdAt: new Date()
  }
]);

print('BharatSales AI database initialized successfully');
print('Demo organizations: org_001 (FMCG), org_002 (Pharma)');
print('Demo users: admin@bharatsales.ai, manager@bharatsales.ai, rep@bharatsales.ai');
