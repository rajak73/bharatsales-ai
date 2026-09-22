import request from 'supertest';
import { Connection, Types } from 'mongoose';
import { bootTestApp, TestApp, seedTestDatabase } from './test/test-app';

/**
 * Regression tests for the bugs found while verifying the v1.0.6 APK build
 * against the API (mobile dispatch, refresh-token grace, login enumeration,
 * rep DSR, distributor returns, price approvals, report exports, platform
 * audit).
 */
describe('Release regressions (e2e)', () => {
  jest.setTimeout(120000);

  let app: TestApp;
  let connection: Connection;
  let orgId: string;
  let adminId: string;
  let repId: string;
  let distributorUserId: string;
  let distributorId: string;
  let outletId: string;
  let productId: string;
  let adminToken: string;
  let repToken: string;
  let distributorToken: string;
  let managerToken: string;
  let seq = 0;

  const server = () => app.getHttpServer();

  async function insertOrder(status: string, extra: Record<string, any> = {}): Promise<{ id: string; orderNumber: string }> {
    seq++;
    const orderNumber = `REG-${Date.now()}-${seq}`;
    const res = await connection.collection('orders').insertOne({
      organizationId: orgId,
      idempotencyKey: `reg-${orderNumber}`,
      orderNumber,
      outletId,
      createdByUserId: repId,
      assignedDistributorId: distributorId,
      status,
      items: [{
        productId, sku: 'REG', name: 'Reg product', quantity: 5, unitPrice: 10, discount: 0,
        gstPercentage: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, subTotal: 50, total: 50,
      }],
      totals: { subTotal: 50, discountTotal: 0, cgstTotal: 0, sgstTotal: 0, igstTotal: 0, grandTotal: 50 },
      statusHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...extra,
    });
    return { id: res.insertedId.toString(), orderNumber };
  }

  beforeAll(async () => {
    app = await bootTestApp();
    connection = app.connection;
    await seedTestDatabase(connection);

    const users = connection.collection('users');
    const admin = await users.findOne({ email: 'admin@bharatfoods.com' });
    const rep = await users.findOne({ email: 'rep@bharatfoods.com' });
    const distUser = await users.findOne({ email: 'owner@saketdist.com' });
    orgId = String(admin!.organizationId);
    adminId = admin!._id.toString();
    repId = rep!._id.toString();
    distributorUserId = distUser!._id.toString();

    const distributor = await connection.collection('distributors').findOne({ organizationId: orgId });
    distributorId = distributor!._id.toString();
    await users.updateOne({ _id: distUser!._id }, { $set: { distributorId } });

    const outlet = await connection.collection('outlets').findOne({ organizationId: orgId });
    outletId = outlet!._id.toString();
    const product = await connection.collection('products').findOne({ organizationId: orgId });
    productId = product!._id.toString();

    // The distributor's own stock, so accepting reserves from it.
    await connection.collection('inventory').insertOne({
      organizationId: orgId, productId, productName: 'Reg product', sku: 'REG', batch: 'REG-DIST-1',
      distributorId, stock: 1000, reservedStock: 0, status: 'Active',
      expiry: new Date(Date.now() + 365 * 86400000).toISOString(),
    });

    adminToken = app.jwtService.sign({ sub: adminId, orgId, role: 'Organization Admin' });
    repToken = app.jwtService.sign({ sub: repId, orgId, role: 'Sales Representative', territoryIds: rep!.territoryIds || [] });
    distributorToken = app.jwtService.sign({ sub: distributorUserId, orgId, role: 'Distributor', distributorId, territoryIds: [] });
    const manager = await users.findOne({ email: 'asm@bharatfoods.com' });
    managerToken = app.jwtService.sign({ sub: manager!._id.toString(), orgId, role: 'Sales Manager', territoryIds: manager!.territoryIds || [] });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('mobile "Mark as Dispatched" (POST /orders/:id/dispatch)', () => {
    it('creates a delivery the distributor can then confirm', async () => {
      const { id } = await insertOrder('Submitted');
      await request(server()).post(`/orders/${id}/approve`).set('Authorization', `Bearer ${distributorToken}`).send({}).expect(201);

      const res = await request(server()).post(`/orders/${id}/dispatch`).set('Authorization', `Bearer ${distributorToken}`).expect(201);
      expect(res.body.status).toBe('Dispatched'); // response shape unchanged (the order)

      const list = await request(server()).get('/dispatches').set('Authorization', `Bearer ${distributorToken}`).expect(200);
      const dispatch = list.body.find((d: any) => d.orderId === id);
      expect(dispatch).toBeDefined();
      expect(dispatch.status).toBe('In Transit');

      // A replay of the same dispatch (sync queue after a lost response) is not a permanent 400.
      await request(server()).post(`/orders/${id}/dispatch`).set('Authorization', `Bearer ${distributorToken}`).expect(201);
      expect(await connection.collection('dispatches').countDocuments({ orderId: id })).toBe(1);

      await request(server())
        .post(`/dispatches/${dispatch._id || dispatch.id}/deliver`)
        .set('Authorization', `Bearer ${distributorToken}`)
        .send({ items: [] })
        .expect(201);
      const order = await connection.collection('orders').findOne({ _id: new Types.ObjectId(id) });
      expect(order!.status).toBe('Delivered');
    });

    it('creates the missing delivery for an order dispatched by the old route', async () => {
      const { id } = await insertOrder('Dispatched');
      await request(server()).post('/dispatches').set('Authorization', `Bearer ${distributorToken}`).send({ orderId: id }).expect(201);
      expect(await connection.collection('dispatches').countDocuments({ orderId: id })).toBe(1);
    });
  });

  describe('refresh token rotation', () => {
    async function login() {
      const res = await request(server()).post('/auth/login').send({ email: 'rep@bharatfoods.com', password: 'password123' }).expect(200);
      return res.body.refresh_token as string;
    }

    it('accepts the just-rotated token again (lost response) without revoking the session', async () => {
      const a = await login();
      const first = await request(server()).post('/auth/refresh').send({ refreshToken: a }).expect(200);
      // The phone never received `first`, so it retries with `a`.
      const retry = await request(server()).post('/auth/refresh').send({ refreshToken: a }).expect(200);
      expect(retry.body.refresh_token).not.toEqual(first.body.refresh_token);
      // The session is still alive: the newest token keeps working...
      const next = await request(server()).post('/auth/refresh').send({ refreshToken: retry.body.refresh_token }).expect(200);
      expect(next.body.access_token).toBeDefined();
      // ...and the token from the lost response was retired.
      await request(server()).post('/auth/refresh').send({ refreshToken: first.body.refresh_token }).expect(401);
    });

    it('still treats an older rotated token as reuse and revokes the session', async () => {
      const a = await login();
      const b = (await request(server()).post('/auth/refresh').send({ refreshToken: a }).expect(200)).body.refresh_token;
      const c = (await request(server()).post('/auth/refresh').send({ refreshToken: b }).expect(200)).body.refresh_token;
      await request(server()).post('/auth/refresh').send({ refreshToken: a }).expect(401);
      await request(server()).post('/auth/refresh').send({ refreshToken: c }).expect(401);
    });

    it('does not accept the previous token after the grace window', async () => {
      const a = await login();
      await request(server()).post('/auth/refresh').send({ refreshToken: a }).expect(200);
      await connection.collection('sessions').updateMany({ userId: repId }, { $set: { rotatedAt: new Date(Date.now() - 10 * 60 * 1000) } });
      await request(server()).post('/auth/refresh').send({ refreshToken: a }).expect(401);
    });
  });

  describe('login does not reveal which emails exist', () => {
    it('answers an unknown email exactly like a wrong password', async () => {
      const unknown = await request(server()).post('/auth/login').send({ email: 'nobody-xyz@example.com', password: 'whatever1' }).expect(401);
      const wrong = await request(server()).post('/auth/login').send({ email: 'nsm@bharatfoods.com', password: 'whatever1' }).expect(401);
      expect(unknown.body.message).toBe('Invalid credentials');
      expect(wrong.body.message).toBe(unknown.body.message);
    });

    it('only shows account-state messages after the password is right', async () => {
      await connection.collection('users').updateOne({ email: 'zsm@bharatfoods.com' }, { $set: { status: 'Inactive' } });
      const wrong = await request(server()).post('/auth/login').send({ email: 'zsm@bharatfoods.com', password: 'nope-nope' }).expect(401);
      expect(wrong.body.message).toBe('Invalid credentials');
      const right = await request(server()).post('/auth/login').send({ email: 'zsm@bharatfoods.com', password: 'password123' }).expect(401);
      expect(right.body.message).toBe('User account is not active or not found');
      await connection.collection('users').updateOne({ email: 'zsm@bharatfoods.com' }, { $set: { status: 'Active', failedLoginAttempts: 0 } });
    });
  });

  it("lets a Sales Representative read their own DSR (the app's Today's Report) but not the team DSR", async () => {
    const res = await request(server()).get('/api/v1/performance/dsr').set('Authorization', `Bearer ${repToken}`).expect(200);
    expect(res.body.metrics).toBeDefined();
    await request(server()).get('/api/v1/performance/team-dsr').set('Authorization', `Bearer ${repToken}`).expect(403);
  });

  it('shows a distributor the returns for orders routed to them, and only those', async () => {
    const mine = await insertOrder('Delivered');
    const other = await insertOrder('Delivered', { assignedDistributorId: 'someone-else' });
    await connection.collection('returns').insertMany([
      { organizationId: orgId, orderId: mine.id, outlet: outletId, status: 'Submitted', items: [], value: '0' },
      { organizationId: orgId, orderId: other.id, outlet: outletId, status: 'Submitted', items: [], value: '0' },
    ]);
    const res = await request(server()).get('/returns').set('Authorization', `Bearer ${distributorToken}`).expect(200);
    const orderIds = res.body.map((r: any) => r.orderId);
    expect(orderIds).toContain(mine.id);
    expect(orderIds).not.toContain(other.id);
  });

  describe('price-override approvals', () => {
    async function pendingOrderWithRequest() {
      const order = await insertOrder('Pending_Approval');
      const approval = await connection.collection('approvals').insertOne({
        organizationId: orgId, outlet: 'Outlet', order: order.orderNumber, type: 'Price Override',
        reason: 'below base price', amount: 50, priority: 'High', requestedBy: repId,
        date: new Date().toISOString(), status: 'Pending',
      });
      return { ...order, approvalId: approval.insertedId.toString() };
    }
    const statusOf = async (orderNumber: string) => (await connection.collection('orders').findOne({ orderNumber }))!.status;

    it('approving the request sends the order on to the distributor (Submitted)', async () => {
      const o = await pendingOrderWithRequest();
      await request(server()).put(`/approvals/${o.approvalId}`).set('Authorization', `Bearer ${managerToken}`).send({ status: 'Approved' }).expect(200);
      expect(await statusOf(o.orderNumber)).toBe('Submitted');
    });

    it('rejecting the request rejects the order', async () => {
      const o = await pendingOrderWithRequest();
      await request(server()).put(`/approvals/${o.approvalId}`).set('Authorization', `Bearer ${managerToken}`).send({ status: 'Rejected' }).expect(200);
      expect(await statusOf(o.orderNumber)).toBe('Rejected');
    });

    it('a distributor cannot accept an order that is still waiting for price approval', async () => {
      const o = await pendingOrderWithRequest();
      await request(server()).post(`/orders/${o.id}/approve`).set('Authorization', `Bearer ${distributorToken}`).send({}).expect(403);
      expect(await statusOf(o.orderNumber)).toBe('Pending_Approval');
    });
  });

  it('completes every report export, with CSV values quoted when needed', async () => {
    await connection.collection('targets').insertOne({
      // Older records carry targetAmount instead of targetValue.
      organizationId: orgId, entityType: 'User', entityId: repId, period: 'Monthly',
      startDate: '2026-09-01', endDate: '2026-09-30', targetAmount: 1000, status: 'On Track',
    });
    await connection.collection('outlets').updateOne({ _id: new Types.ObjectId(outletId) }, { $set: { name: 'Sharma, Sons & "Co"' } });
    const reports = app.container.reportsService as any;
    for (let n = 1; n <= 12; n++) {
      const reportId = `rep-${String(n).padStart(2, '0')}`;
      const { jobId } = await reports.runReport(orgId, { reportId }, { sub: adminId, role: 'Organization Admin', orgId });
      let job: any;
      for (let i = 0; i < 50; i++) {
        job = await connection.collection('report_jobs').findOne({ jobId });
        if (job && (job.status === 'Completed' || job.status === 'Failed')) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      expect({ reportId, status: job?.status, error: job?.error }).toEqual({ reportId, status: 'Completed', error: undefined });
      if (reportId === 'rep-10') expect(job.data).toContain('"Sharma, Sons & ""Co"""');
    }
  });

  it('writes platform (Super Admin) changes to the audit log', async () => {
    const superAdmin = await connection.collection('users').findOne({ email: 'superadmin@bharatsales.com' });
    const token = app.jwtService.sign({ sub: superAdmin!._id.toString(), orgId: String(superAdmin!.organizationId), role: 'Super Admin', platformAdmin: true });
    const tenant = await connection.collection('tenants').findOne({ name: 'Raj Pharma Distributors' });
    await request(server())
      .patch(`/superadmin/tenants/${tenant!._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Active' })
      .expect(200);
    let entry: any = null;
    for (let i = 0; i < 20 && !entry; i++) {
      entry = await connection.collection('audit_logs').findOne({ entityName: 'Platform', action: 'PATCH' });
      if (!entry) await new Promise((r) => setTimeout(r, 100));
    }
    expect(entry).toBeTruthy();
    expect(entry.details.params.id).toBe(tenant!._id.toString());
  });
});
