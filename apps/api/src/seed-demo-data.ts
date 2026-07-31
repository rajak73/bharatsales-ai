import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import {
  Tenant, TenantSchema,
  User, UserSchema,
  Product, ProductSchema,
  Outlet, OutletSchema,
  Distributor, DistributorSchema,
  Order, OrderSchema,
  Target, TargetSchema,
  PaymentCollection, CollectionSchema,
  Inventory, InventorySchema,
  Beat, BeatSchema, BeatSchedule, BeatScheduleSchema,
  Visit, VisitSchema,
  AttendanceSession, AttendanceSessionSchema,
  HierarchyNode, HierarchyNodeSchema,
} from './schemas';

// Additive-only demo data seeder for ONE existing organization.
//
// Unlike seed.ts (which wipes every collection before reseeding — safe only
// for local dev), this script never deletes anything. It resolves an
// already-existing organization (by its admin's email) and adds realistic
// BRD-covering records to it: products, outlets, distributors, hierarchy,
// beats/schedules, orders, inventory, visits, attendance, targets, and
// collections. Every insert is guarded by an existence check so the script
// is safe to re-run without creating duplicate spam.
//
// Usage:
//   MONGODB_URI="<connection-string>" ADMIN_EMAIL="admin@bharatfoods.com" \
//     ts-node --transpile-only src/seed-demo-data.ts

async function bootstrap() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bharatsales';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bharatfoods.com';

  await mongoose.connect(uri);
  console.log('Connected to MongoDB:', uri);

  const TenantModel = mongoose.model(Tenant.name, TenantSchema);
  const UserModel = mongoose.model(User.name, UserSchema);
  const ProductModel = mongoose.model(Product.name, ProductSchema);
  const OutletModel = mongoose.model(Outlet.name, OutletSchema);
  const DistributorModel = mongoose.model(Distributor.name, DistributorSchema);
  const OrderModel = mongoose.model(Order.name, OrderSchema);
  const TargetModel = mongoose.model(Target.name, TargetSchema);
  const CollectionModel = mongoose.model('Collection', CollectionSchema);
  const InventoryModel = mongoose.model(Inventory.name, InventorySchema);
  const BeatModel = mongoose.model(Beat.name, BeatSchema);
  const BeatScheduleModel = mongoose.model(BeatSchedule.name, BeatScheduleSchema);
  const VisitModel = mongoose.model(Visit.name, VisitSchema);
  const AttendanceModel = mongoose.model(AttendanceSession.name, AttendanceSessionSchema);
  const HierarchyNodeModel = mongoose.model(HierarchyNode.name, HierarchyNodeSchema);

  // 1. Resolve the existing organization — never create one.
  const adminUser = await UserModel.findOne({ email: adminEmail });
  if (!adminUser) {
    console.error(`No user found with email ${adminEmail}. Refusing to guess an organization — pass ADMIN_EMAIL to target the right one.`);
    process.exit(1);
  }
  const organizationId = adminUser.organizationId;
  const tenant = await TenantModel.findById(organizationId);
  if (!tenant) {
    console.error(`User ${adminEmail} references organizationId ${organizationId}, but no Tenant document exists for it.`);
    process.exit(1);
  }
  console.log(`Targeting organization: ${tenant.name} (${organizationId})`);

  // 2. Hierarchy — create a Zone→Region→Area→Territory chain only if the org has none.
  let territory = await HierarchyNodeModel.findOne({ organizationId, level: 'Territory' });
  if (!territory) {
    const zone = await HierarchyNodeModel.create({ organizationId, name: 'North Zone', level: 'Zone', status: 'Active' });
    const region = await HierarchyNodeModel.create({ organizationId, name: 'Delhi NCR', level: 'Region', parentId: zone._id.toString(), status: 'Active' });
    const area = await HierarchyNodeModel.create({ organizationId, name: 'South Delhi', level: 'Area', parentId: region._id.toString(), status: 'Active' });
    territory = await HierarchyNodeModel.create({ organizationId, name: 'Saket', level: 'Territory', parentId: area._id.toString(), status: 'Active' });
    console.log('Created hierarchy: North Zone > Delhi NCR > South Delhi > Saket');
  }
  const territoryId = territory._id.toString();

  // 3. Distributor
  let distributor = await DistributorModel.findOne({ organizationId, code: 'DIST-DEMO-01' });
  if (!distributor) {
    distributor = await DistributorModel.create({
      organizationId, name: 'Saket Distributors', code: 'DIST-DEMO-01', ownerName: 'Raj Kumar', mobile: '9876543210', status: 'Active',
      location: { address: 'Saket Industrial Area', city: 'New Delhi', state: 'Delhi', pinCode: '110017', latitude: 28.5245, longitude: 77.2066 },
      tax: { gstin: '07AAACD1234E1Z5', pan: 'AAACD1234E' },
      commercial: { creditLimit: 500000, outstandingBalance: 0 },
    });
    console.log('Created distributor: Saket Distributors');
  }
  const distributorId = distributor._id.toString();

  // 4. Outlets
  const outletSeeds = [
    { code: 'OUT-DEMO-01', name: 'Aggarwal Stores', tier: 'A', lat: 28.5284, lng: 77.2183 },
    { code: 'OUT-DEMO-02', name: 'Sharma General Store', tier: 'B', lat: 28.5301, lng: 77.2145 },
    { code: 'OUT-DEMO-03', name: 'City Mart', tier: 'A', lat: 28.5260, lng: 77.2110 },
    { code: 'OUT-DEMO-04', name: 'Delhi Retail Corner', tier: 'C', lat: 28.5320, lng: 77.2200 },
    { code: 'OUT-DEMO-05', name: 'Saket Supermart', tier: 'B', lat: 28.5250, lng: 77.2090 },
  ];
  const outlets = [];
  for (const o of outletSeeds) {
    let outlet = await OutletModel.findOne({ organizationId, code: o.code });
    if (!outlet) {
      outlet = await OutletModel.create({
        organizationId, code: o.code, name: o.name, ownerName: `${o.name} Owner`, category: 'Retail', tier: o.tier, status: 'Active', mobile: '9811100000',
        location: { address: `${o.name}, Saket`, state: 'Delhi', pinCode: '110017', latitude: o.lat, longitude: o.lng, geofenceRadiusMeters: 100 },
        commercial: { creditLimit: 100000, paymentTermsDays: 30, outstandingBalance: 15000, assignedDistributorId: distributorId },
        tax: { gstin: '07AAACO5678F1Z3', pan: 'AAACO5678F' },
        territoryId,
      });
      console.log(`Created outlet: ${o.name}`);
    }
    outlets.push(outlet);
  }

  // 5. Products
  const products = [];
  for (let i = 1; i <= 10; i++) {
    const sku = `SKU-DEMO-${String(i).padStart(2, '0')}`;
    let product = await ProductModel.findOne({ organizationId, sku });
    if (!product) {
      product = await ProductModel.create({
        organizationId, sku, name: `Demo Product ${i}`, brand: 'BharatBrand', category: i % 2 === 0 ? 'Food' : 'Personal Care',
        hsn: `HSN${1000 + i}`, moq: 5, status: 'Active',
        pricing: { mrp: 60 + i * 10, basePrice: 40 + i * 8, pts: 44 + i * 8, ptr: 48 + i * 8, gstPercentage: i % 3 === 0 ? 12 : 18 },
        stock: { available: 1000, uom: 'Pieces' },
      });
      console.log(`Created product: ${product.name}`);
    }
    products.push(product);

    // Two inventory batches per product for FEFO coverage.
    const batchNear = `BATCH-DEMO-${i}-NEAR`;
    if (!(await InventoryModel.findOne({ organizationId, productId: product._id.toString(), batch: batchNear }))) {
      await InventoryModel.create({
        organizationId, productId: product._id.toString(), productName: product.name, sku, warehouseId: 'WH-01', batch: batchNear,
        stock: 500, reservedStock: 0, expiry: '2026-12-01', status: 'Active',
      });
    }
    const batchFar = `BATCH-DEMO-${i}-FAR`;
    if (!(await InventoryModel.findOne({ organizationId, productId: product._id.toString(), batch: batchFar }))) {
      await InventoryModel.create({
        organizationId, productId: product._id.toString(), productName: product.name, sku, warehouseId: 'WH-01', batch: batchFar,
        stock: 800, reservedStock: 0, expiry: '2027-06-01', status: 'Active',
      });
    }
  }

  // 6. Users — one more Sales Manager, two Sales Representatives, one Distributor user.
  const defaultPassword = await bcrypt.hash('password123', 10);
  const userSeeds = [
    { email: 'manager@bharatfoods.com', name: 'Demo Sales Manager', role: 'Sales Manager', territoryIds: [territoryId] },
    { email: 'rep1@bharatfoods.com', name: 'Demo Rep One', role: 'Sales Representative', territoryIds: [territoryId] },
    { email: 'rep2@bharatfoods.com', name: 'Demo Rep Two', role: 'Sales Representative', territoryIds: [territoryId] },
    { email: 'distributor@bharatfoods.com', name: 'Demo Distributor User', role: 'Distributor', distributorId },
  ];
  const usersByEmail: Record<string, any> = {};
  for (const u of userSeeds) {
    let user = await UserModel.findOne({ email: u.email });
    if (!user) {
      user = await UserModel.create({ organizationId, email: u.email, name: u.name, password: defaultPassword, role: u.role, status: 'Active', territoryIds: (u as any).territoryIds, distributorId: (u as any).distributorId });
      console.log(`Created user: ${u.name} (${u.role})`);
    }
    usersByEmail[u.email] = user;
  }
  const rep1 = usersByEmail['rep1@bharatfoods.com'];
  const rep2 = usersByEmail['rep2@bharatfoods.com'];
  const reps = [rep1, rep2];

  // 7. Beat + BeatSchedule (today) for both reps.
  let beat = await BeatModel.findOne({ organizationId, name: 'Saket Daily Beat' });
  if (!beat) {
    beat = await BeatModel.create({
      organizationId, name: 'Saket Daily Beat', description: 'Demo beat covering Saket outlets', status: 'Active', version: 1,
      outlets: outlets.map(o => o._id),
      sequence: outlets.map((o, idx) => ({ outletId: o._id, sequenceOrder: idx + 1 })),
    });
    console.log('Created beat: Saket Daily Beat');
  }
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  for (const rep of reps) {
    const existingSchedule = await BeatScheduleModel.findOne({ organizationId, user: rep._id, beat: beat._id, date: { $gte: todayStart } });
    if (!existingSchedule) {
      await BeatScheduleModel.create({ organizationId, user: rep._id, beat: beat._id, date: new Date() });
    }
  }

  // 8. Attendance — one Active session per rep for today.
  for (const rep of reps) {
    const existing = await AttendanceModel.findOne({ organizationId, user: rep._id, startTime: { $gte: todayStart } });
    if (!existing) {
      await AttendanceModel.create({
        organizationId, user: rep._id, startTime: new Date(new Date().setHours(9, 15, 0, 0)),
        startLocation: { lat: outlets[0].location.latitude, lng: outlets[0].location.longitude, accuracy: 10 },
        status: 'Active',
      });
    }
  }

  // 9. Visits — a couple of completed visits per rep today.
  for (let r = 0; r < reps.length; r++) {
    const rep = reps[r];
    const visitOutlets = outlets.slice(r * 2, r * 2 + 2);
    for (const outlet of visitOutlets) {
      const existing = await VisitModel.findOne({ organizationId, user: rep._id, outlet: outlet._id, checkInTime: { $gte: todayStart } });
      if (!existing) {
        const checkIn = new Date(new Date().setHours(10 + r, 0, 0, 0));
        const checkOut = new Date(checkIn.getTime() + 25 * 60 * 1000);
        await VisitModel.create({
          organizationId, user: rep._id, outlet: outlet._id, checkInTime: checkIn, checkOutTime: checkOut, durationMinutes: 25,
          checkInLocation: { lat: outlet.location.latitude, lng: outlet.location.longitude, accuracy: 8 },
          checkOutLocation: { lat: outlet.location.latitude, lng: outlet.location.longitude, accuracy: 8 },
          distanceFromOutlet: 12, isWithinGeofence: true, status: 'Completed',
        });
      }
    }
  }

  // 10. Orders — one each in Draft, Submitted, Approved, Dispatched, Delivered.
  const statuses: Array<Order['status']> = ['Draft', 'Submitted', 'Approved', 'Dispatched', 'Delivered'];
  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    const rep = reps[i % reps.length];
    const outlet = outlets[i % outlets.length];
    const product = products[i % products.length];
    const idempotencyKey = `demo-order-${i}-${randomUUID()}`;
    const existing = await OrderModel.findOne({ organizationId, idempotencyKey: { $regex: `^demo-order-${i}-` } });
    if (existing) continue;

    const quantity = 20 + i * 5;
    const unitPrice = product.pricing.ptr;
    const subTotal = quantity * unitPrice;
    const gstPercentage = product.pricing.gstPercentage;
    const igstAmount = Math.round(subTotal * gstPercentage / 100);
    const total = subTotal + igstAmount;

    await OrderModel.create({
      organizationId, idempotencyKey, orderNumber: `DEMO-ORD-${1000 + i}`, outletId: outlet._id.toString(), createdByUserId: rep._id.toString(),
      assignedDistributorId: distributorId, status,
      items: [{
        productId: product._id.toString(), sku: product.sku, name: product.name, quantity, unitPrice, discount: 0,
        gstPercentage, cgstAmount: 0, sgstAmount: 0, igstAmount, subTotal, total,
      }],
      totals: { subTotal, discountTotal: 0, cgstTotal: 0, sgstTotal: 0, igstTotal: igstAmount, grandTotal: total },
      createdAt: new Date(Date.now() - (statuses.length - i) * 86400000),
    });
    console.log(`Created ${status} order for ${outlet.name}`);
  }

  // 11. Targets — one Monthly target per rep.
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  for (const rep of reps) {
    const existing = await TargetModel.findOne({ organizationId, entityType: 'User', entityId: rep._id.toString(), period: 'Monthly' });
    if (!existing) {
      await TargetModel.create({
        organizationId, entityType: 'User', entityId: rep._id.toString(), period: 'Monthly',
        startDate: monthStart.toISOString(), endDate: monthEnd.toISOString(),
        targetValue: 500000, actualValue: 150000, status: 'On Track',
      });
    }
  }

  // 12. Collections — a couple of payment collections against outlets.
  for (let i = 0; i < 2; i++) {
    const receiptNumber = `DEMO-RCPT-${1000 + i}`;
    const existing = await CollectionModel.findOne({ organizationId, receiptNumber });
    if (!existing) {
      await CollectionModel.create({
        organizationId, receiptNumber, outletId: outlets[i].id, collectedByUserId: reps[i % reps.length]._id.toString(),
        amount: 12000 + i * 3000, paymentMode: i % 2 === 0 ? 'Cash' : 'UPI', status: 'Cleared',
        collectionDate: new Date().toISOString().split('T')[0],
      });
    }
  }

  console.log('\n--- Demo data seeding complete ---');
  console.log(`Organization: ${tenant.name}`);
  console.log(`Outlets: ${outlets.length}, Products: ${products.length}, Distributor: ${distributor.name}`);
  console.log(`Users added/verified: ${userSeeds.map(u => u.email).join(', ')}`);
  console.log('All new user passwords: password123');

  await mongoose.disconnect();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('Failed to seed demo data:', err);
  process.exit(1);
});
