import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  console.log('Seeding database...');
  
  const userModel = app.get<Model<any>>(getModelToken('User'));
  const orgModel = app.get<Model<any>>(getModelToken('Tenant'));
  const productModel = app.get<Model<any>>(getModelToken('Product'));
  const outletModel = app.get<Model<any>>(getModelToken('Outlet'));
  const invoiceModel = app.get<Model<any>>(getModelToken('Invoice'));
  const hierarchyNodeModel = app.get<Model<any>>(getModelToken('HierarchyNode'));

  // Clear existing
  await userModel.deleteMany({});
  await orgModel.deleteMany({});
  await productModel.deleteMany({});
  await outletModel.deleteMany({});
  await invoiceModel.deleteMany({});
  await hierarchyNodeModel.deleteMany({});

  // 1. Create Organization (Tenant)
  const org = await orgModel.create({
    name: 'BharatSales AI Corp',
    status: 'Active',
    plan: 'Enterprise',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
  });

  // 1.5 Create Hierarchy Nodes
  const zone = await hierarchyNodeModel.create({
    organizationId: org._id.toString(),
    name: 'North Zone',
    level: 'Zone',
    status: 'Active',
  });

  const region = await hierarchyNodeModel.create({
    organizationId: org._id.toString(),
    name: 'Delhi NCR',
    level: 'Region',
    parentId: zone._id,
    status: 'Active',
  });

  const area = await hierarchyNodeModel.create({
    organizationId: org._id.toString(),
    name: 'South Delhi',
    level: 'Area',
    parentId: region._id,
    status: 'Active',
  });

  const territory = await hierarchyNodeModel.create({
    organizationId: org._id.toString(),
    name: 'Saket Territory',
    level: 'Territory',
    parentId: area._id,
    status: 'Active',
  });

  // 2. Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await userModel.create([
    {
      organizationId: org._id.toString(),
      name: 'Super Admin',
      email: 'admin@bharatsales.in',
      mobile: '9876543210',
      password: hashedPassword,
      role: 'Super Admin',
      status: 'Active',
    },
    {
      organizationId: org._id.toString(),
      name: 'Ravi Kumar',
      email: 'ravi@bharatsales.in',
      mobile: '9876543211',
      password: hashedPassword,
      role: 'Sales Representative',
      territoryIds: [territory._id.toString()],
      status: 'Active',
    }
  ]);

  // 3. Create Products
  await productModel.create([
    {
      organizationId: org._id.toString(),
      name: 'Premium Tea 500g',
      sku: 'TEA-500',
      category: 'Beverages',
      brand: 'BharatBrew',
      status: 'Active',
      pricing: {
        mrp: 250,
        basePrice: 180,
        gstPercentage: 5,
      },
      stock: {
        available: 1000,
        uom: 'Pouch',
      }
    },
    {
      organizationId: org._id.toString(),
      name: 'Coffee Powder 250g',
      sku: 'COF-250',
      category: 'Beverages',
      brand: 'BharatBrew',
      status: 'Active',
      pricing: {
        mrp: 300,
        basePrice: 220,
        gstPercentage: 5,
      },
      stock: {
        available: 500,
        uom: 'Jar',
      }
    }
  ]);

  // 4. Create Mock Outlet
  const mockOutlet = await outletModel.create({
    organizationId: org._id.toString(),
    name: 'Sharma Kirana Store',
    code: 'OUT-SHARMA-001',
    type: 'Retail',
    routeId: 'ROUTE-01',
    commercial: {
      outstandingBalance: 15000,
      creditLimit: 50000
    },
    status: 'Active'
  });

  // 5. Create Mock Invoice
  await invoiceModel.create({
    organizationId: org._id.toString(),
    invoiceNumber: 'INV-SHARMA-001',
    outletId: mockOutlet._id.toString(),
    outlet: mockOutlet._id,
    orderId: 'ORDER-DUMMY',
    totalAmount: 15000,
    paidAmount: 0,
    status: 'Unpaid',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  console.log('Database seeded successfully!');
  await app.close();
}
bootstrap();
