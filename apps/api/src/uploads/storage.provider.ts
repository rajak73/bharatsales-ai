import * as fs from 'fs';
import * as path from 'path';
import type { Readable } from 'stream';
import mongoose, { Connection } from 'mongoose';
import { Logger } from '../core/logger';
import { ServiceUnavailableException } from '../core/http-errors';
import { detectImageExtension } from './image-type';

/** Server-generated upload names: 128 random bits as hex + image extension. */
const LOCAL_FILENAME_RE = /^([0-9a-f]{32})(\.jpg|\.png|\.webp)$/;

export interface StoredFile {
  stream: Readable;
  contentType: string;
  length: number;
}

export interface IStorageProvider {
  /**
   * Persists `buffer` and returns the public URL/path it can be fetched from.
   * `filename` is always server-generated (never the client's original name).
   */
  upload(buffer: Buffer, filename: string, contentType: string): Promise<string>;
  /**
   * Opens a stored file for streaming, or resolves null when this provider
   * does not hold it (the caller then falls back to the legacy disk files).
   * Providers whose files are served some other way may omit it.
   */
  open?(filename: string): Promise<StoredFile | null>;
}

/** Bucket holding uploaded photos (collections uploads.files / uploads.chunks). */
export const UPLOADS_BUCKET = 'uploads';

/**
 * Persistent storage in MongoDB GridFS. Render's disk is wiped on every
 * deploy, the database is not — so this is the production default.
 * Files are fetched back through GET /uploads/:filename (see uploads.routes).
 */
export class GridFsStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(GridFsStorageProvider.name);
  private bucketInstance: InstanceType<typeof mongoose.mongo.GridFSBucket> | null = null;

  constructor(private readonly conn: Connection) {}

  // Created lazily: the connection may still be opening when the container is built.
  private bucket() {
    if (!this.bucketInstance) {
      if (!this.conn.db) throw new ServiceUnavailableException('Upload storage is not available');
      this.bucketInstance = new mongoose.mongo.GridFSBucket(this.conn.db, { bucketName: UPLOADS_BUCKET });
    }
    return this.bucketInstance;
  }

  async upload(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const bucket = this.bucket();
    await new Promise<void>((resolve, reject) => {
      const stream = bucket.openUploadStream(filename, { metadata: { contentType } });
      stream.once('error', reject);
      stream.once('finish', () => resolve());
      stream.end(buffer);
    });
    this.logger.log(`Stored upload ${filename} in GridFS (${buffer.length} bytes)`);
    return `/uploads/${filename}`;
  }

  async open(filename: string): Promise<StoredFile | null> {
    const bucket = this.bucket();
    const [file] = await bucket.find({ filename }).sort({ uploadDate: -1 }).limit(1).toArray();
    if (!file) return null;
    return {
      stream: bucket.openDownloadStream(file._id),
      contentType: (file.metadata?.contentType as string) || 'application/octet-stream',
      length: file.length,
    };
  }
}

// Dev-only storage: writes to a local disk directory, served back by the
// express.static mount on <cwd>/uploads at /uploads. On Render (and most PaaS)
// the local disk is ephemeral — files are lost on every deploy/restart.
export class LocalDiskStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(LocalDiskStorageProvider.name);
  private readonly uploadDir: string;

  constructor(uploadDir: string = path.join(process.cwd(), 'uploads')) {
    this.uploadDir = uploadDir;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(buffer: Buffer, filename: string): Promise<string> {
    // The route already stores only content-verified images under a
    // server-generated name; re-check both here so this disk write can never
    // receive anything else (wrong bytes, or a name that escapes uploadDir).
    const ext = detectImageExtension(buffer);
    const match = LOCAL_FILENAME_RE.exec(filename);
    if (!ext || !match || match[2] !== ext) {
      throw new Error('LocalDiskStorageProvider only stores verified JPEG/PNG/WebP images under a generated name');
    }
    const safeName = `${match[1]}${ext}`;
    const filePath = path.join(this.uploadDir, safeName);
    await fs.promises.writeFile(filePath, buffer);
    this.logger.log(`Stored upload at ${filePath}`);
    return `/uploads/${safeName}`;
  }
}

/** STORAGE_DRIVER=gridfs (default) | local. */
export function createStorageProvider(conn: Connection, driver = process.env.STORAGE_DRIVER): IStorageProvider {
  const d = (driver || 'gridfs').trim().toLowerCase();
  if (d === 'local') return new LocalDiskStorageProvider();
  if (d !== 'gridfs') throw new Error(`Unknown STORAGE_DRIVER "${driver}" (expected "gridfs" or "local")`);
  return new GridFsStorageProvider(conn);
}
