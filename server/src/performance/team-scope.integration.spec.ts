import request from 'supertest';
import { bootTestApp, seedTestDatabase, TestApp } from '../test/test-app';

// Regression: Team performance for a Sales Manager failed with
// "Invalid _id" (400). The baseline seed writes hierarchy parentIds as plain
// strings, so the ObjectId-cast descendant query found no reps; the empty team
// then hit a '__none__' sentinel in the users query, which cannot be cast to
// an ObjectId.
describe('Sales Manager team scope (e2e)', () => {
  let app: TestApp;
  jest.setTimeout(30000);

  const login = async (email: string) => {
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'password123' });
    expect(res.status).toBe(200);
    return res.body.access_token as string;
  };

  beforeAll(async () => {
    app = await bootTestApp();
    await seedTestDatabase(app.connection);
  });

  afterAll(async () => {
    await app.close();
  });

  it('resolves reps below a zonal manager whose hierarchy parents are stored as strings', async () => {
    const token = await login('zsm@bharatfoods.com');
    const res = await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.map((u: any) => u.email)).toContain('rep@bharatfoods.com');
  });

  it('returns empty lists, not "Invalid _id", for a manager with no team', async () => {
    const token = await login('nsm@bharatfoods.com'); // Sales Manager with no territories

    const users = await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${token}`);
    expect(users.status).toBe(200);
    expect(users.body).toEqual([]);

    const targets = await request(app.getHttpServer()).get('/api/v1/performance/team-targets').set('Authorization', `Bearer ${token}`);
    expect(targets.status).toBe(200);
    expect(targets.body).toEqual([]);
  });

  it('names the rep on each team target', async () => {
    const rep = await app.connection.collection('users').findOne({ email: 'rep@bharatfoods.com' });
    await app.connection.collection('targets').insertOne({
      organizationId: rep!.organizationId, entityType: 'User', entityId: rep!._id.toString(),
      period: 'Monthly', targetMetric: 'SalesValue', targetValue: 1000, actualValue: 0, status: 'On Track',
      startDate: new Date(Date.now() - 86400000), endDate: new Date(Date.now() + 86400000 * 20),
    });
    const token = await login('asm@bharatfoods.com');
    const res = await request(app.getHttpServer()).get('/api/v1/performance/team-targets').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].entityName).toBe('Sales Rep Saket');
  });
});
