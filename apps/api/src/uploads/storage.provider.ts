import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface IStorageProvider {
  upload(buffer: Buffer, filename: string): Promise<string>;
}

// MVP storage: writes to a local disk directory, served back via GET /uploads/:filename.
// Swappable for an S3/Cloudinary-backed provider later without touching callers.
@Injectable()
export class LocalDiskStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(LocalDiskStorageProvider.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(buffer: Buffer, filename: string): Promise<string> {
    const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(this.uploadDir, safeName);
    await fs.promises.writeFile(filePath, buffer);
    this.logger.log(`Stored upload at ${filePath}`);
    return `/uploads/${safeName}`;
  }
}
