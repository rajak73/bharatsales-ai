import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import mongoose, { Connection } from 'mongoose';
import { createUploadsRouter } from './uploads.routes';
import { detectImageExtension } from './image-type';
import { errorHandler } from '../core/error-handler';
import { GridFsStorageProvider, IStorageProvider, UPLOADS_BUCKET } from './storage.provider';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x10, 0, 0, 0]), Buffer.from('WEBPVP8 '), Buffer.alloc(8)]);
const HTML = Buffer.from('<html><script>alert(1)</script></html>');

describe('detectImageExtension', () => {
  it('detects JPEG, PNG and WebP by magic bytes', () => {
    expect(detectImageExtension(JPEG)).toBe('.jpg');
    expect(detectImageExtension(PNG)).toBe('.png');
    expect(detectImageExtension(WEBP)).toBe('.webp');
  });
  it('rejects non-images and short buffers', () => {
    expect(detectImageExtension(HTML)).toBeNull();
    expect(detectImageExtension(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(detectImageExtension(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE')]))).toBeNull();
  });
});

describe('POST /uploads/visit-photo', () => {
  const storage: IStorageProvider & { upload: jest.Mock } = {
    upload: jest.fn(async (_buf: Buffer, name: string) => `/uploads/${name}`),
  };
  const app = express();
  app.use('/uploads', createUploadsRouter({ storageProvider: storage }));
  app.use(errorHandler);
  const token = jwt.sign({ sub: 'u1', orgId: 'org1', role: 'Sales Representative' }, process.env.JWT_SECRET as string);

  afterEach(() => storage.upload.mockClear());

  it('requires authentication', async () => {
    await request(app).post('/uploads/visit-photo').attach('photo', JPEG, 'a.jpg').expect(401);
  });

  it('stores a real PNG under a server-chosen .png name even if the client claims otherwise', async () => {
    const res = await request(app)
      .post('/uploads/visit-photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', PNG, { filename: 'evil.html', contentType: 'text/html' })
      .expect(201);
    const storedName = storage.upload.mock.calls[0][1] as string;
    expect(storedName).toMatch(/^[0-9a-f]{32}\.png$/);
    expect(storage.upload.mock.calls[0][2]).toBe('image/png');
    expect(res.body).toEqual({ url: `/uploads/${storedName}` });
  });

  it('rejects an HTML file disguised with an image mimetype and .jpg name', async () => {
    const res = await request(app)
      .post('/uploads/visit-photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', HTML, { filename: 'photo.jpg', contentType: 'image/jpeg' })
      .expect(400);
    expect(res.body.message).toBe('Only JPEG, PNG, or WebP images are allowed');
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('returns 400 when no file is sent', async () => {
    const res = await request(app).post('/uploads/visit-photo').set('Authorization', `Bearer ${token}`).expect(400);
    expect(res.body.message).toBe('No photo file provided');
  });

  it('returns 413 for files over 5MB', async () => {
    const big = Buffer.concat([JPEG, Buffer.alloc(5 * 1024 * 1024)]);
    await request(app)
      .post('/uploads/visit-photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', big, 'big.jpg')
      .expect(413);
  });
});

describe('GridFS uploads: upload + public fetch', () => {
  let conn: Connection;
  let app: express.Express;
  let legacyDir: string;
  const token = () => jwt.sign({ sub: 'u1', orgId: 'org1', role: 'Sales Representative' }, process.env.JWT_SECRET as string);

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set (jest globalSetup)');
    conn = await mongoose.createConnection(uri, { dbName: `uploads_spec_${process.env.JEST_WORKER_ID || '1'}` }).asPromise();
    await conn.db!.dropDatabase();
    legacyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-uploads-'));
    fs.writeFileSync(path.join(legacyDir, '1712345678901-old-photo.jpg'), JPEG);
    app = express();
    app.use('/uploads', createUploadsRouter({ storageProvider: new GridFsStorageProvider(conn), staticDir: legacyDir }));
    app.use(errorHandler);
  });

  afterAll(async () => {
    await conn.db!.dropDatabase();
    await conn.close();
    fs.rmSync(legacyDir, { recursive: true, force: true });
  });

  it('stores the photo in GridFS and serves it back without auth', async () => {
    const up = await request(app)
      .post('/uploads/visit-photo')
      .set('Authorization', `Bearer ${token()}`)
      .attach('photo', WEBP, { filename: 'shop.webp', contentType: 'image/webp' })
      .expect(201);
    expect(up.body.url).toMatch(/^\/uploads\/[0-9a-f]{32}\.webp$/);

    const stored = await conn.db!.collection(`${UPLOADS_BUCKET}.files`).findOne({ filename: up.body.url.split('/').pop() });
    expect(stored?.length).toBe(WEBP.length);

    const res = await request(app).get(up.body.url).buffer(true).parse((r, cb) => {
      const chunks: Buffer[] = [];
      r.on('data', (c: Buffer) => chunks.push(c));
      r.on('end', () => cb(null, Buffer.concat(chunks)));
    }).expect(200);
    expect(res.headers['content-type']).toBe('image/webp');
    expect(res.headers['cache-control']).toBe('private, max-age=86400');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(Buffer.compare(res.body as Buffer, WEBP)).toBe(0);

    const head = await request(app).head(up.body.url).expect(200);
    expect(head.headers['content-length']).toBe(String(WEBP.length));
  });

  it('returns 404 for a well-formed name that does not exist', async () => {
    const res = await request(app).get(`/uploads/${'a'.repeat(32)}.jpg`).expect(404);
    expect(res.body.statusCode).toBe(404);
  });

  it('returns 404 (not 401) for malformed names and path tricks', async () => {
    await request(app).get('/uploads/..%2F..%2Fetc%2Fpasswd').expect(404);
    await request(app).get(`/uploads/${'A'.repeat(32)}.jpg`).expect(404);
    await request(app).get(`/uploads/${'a'.repeat(32)}.html`).expect(404);
    await request(app).get('/uploads/visit-photo').expect(404);
  });

  it('still serves legacy files from the old disk directory', async () => {
    const res = await request(app).get('/uploads/1712345678901-old-photo.jpg').expect(200);
    expect(res.headers['content-type']).toBe('image/jpeg');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
