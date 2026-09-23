import express, { Router, RequestHandler } from 'express';
import multer from 'multer';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { Resource, Action } from '@bharatsales/permissions';
import { authenticate, requirePermission } from '../core/auth.middleware';
import { route } from '../core/http';
import { BadRequestException } from '../core/http-errors';
import { detectImageExtension, ImageExtension } from './image-type';
import type { IStorageProvider } from './storage.provider';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

/** Names the server generates: 128 random bits as hex + an image extension. */
export const STORED_FILENAME_RE = /^[0-9a-f]{32}\.(jpg|png|webp)$/;

const CONTENT_TYPES: Record<ImageExtension, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

function setServeHeaders(res: express.Response) {
  // Private: photos are only reachable by their unguessable name, so shared
  // caches/CDNs must not keep them; the owning browser/app may for a day.
  res.setHeader('Cache-Control', 'private, max-age=86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
}

export function createUploadsRouter(deps: {
  storageProvider: IStorageProvider;
  /** Legacy disk uploads (files written before GridFS), still served read-only. */
  staticDir?: string;
}): Router {
  const { storageProvider } = deps;
  const staticDir = deps.staticDir ?? path.join(process.cwd(), 'uploads');
  const router = Router();

  // ---- Public reads: GET/HEAD /uploads/:filename --------------------------
  // No auth header needed so <img>/<Image> can load them (the shipped APK
  // relies on this); the 128-bit random filename is the capability.
  const serveStored: RequestHandler = async (req, res, next) => {
    const filename = req.params.filename;
    if (!STORED_FILENAME_RE.test(filename) || !storageProvider.open) return next();
    try {
      const file = await storageProvider.open(filename);
      if (!file) return next();
      const ext = path.extname(filename) as ImageExtension;
      res.status(200);
      res.setHeader('Content-Type', CONTENT_TYPES[ext] ?? file.contentType);
      res.setHeader('Content-Length', String(file.length));
      setServeHeaders(res);
      if (req.method === 'HEAD') {
        file.stream.destroy();
        return res.end();
      }
      file.stream.once('error', (err) => {
        if (!res.headersSent) return next(err);
        res.destroy(err);
      });
      file.stream.pipe(res);
    } catch (err) {
      next(err);
    }
  };
  router.get('/:filename', serveStored);

  // Fallback: files uploaded to local disk (dev, or before the GridFS switch).
  router.use(
    express.static(staticDir, {
      fallthrough: true,
      index: false,
      dotfiles: 'deny',
      setHeaders: (res) => setServeHeaders(res),
    }),
  );
  // A missing file is a 404, not a 401 from the authenticated routes below.
  router.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl.split('?')[0]}`, error: 'Not Found', statusCode: 404 });
  });

  // ---- Authenticated writes ----------------------------------------------
  router.use(authenticate);

  // Shared by outlet-visit shopfront photos and attendance selfies — both are
  // only ever captured by a Sales Representative, who holds Visits:Create.
  // Oversized files → 413 via the central error handler (multer LIMIT_FILE_SIZE).
  router.post('/visit-photo', requirePermission(Resource.Visits, Action.Create), upload.single('photo'),
    route(async (req) => {
      const file = req.file;
      if (!file) {
        throw new BadRequestException('No photo file provided');
      }
      // Validate by content, not by the client's mimetype/extension, and store
      // under a server-chosen name + extension.
      const ext = detectImageExtension(file.buffer);
      if (!ext) {
        throw new BadRequestException('Only JPEG, PNG, or WebP images are allowed');
      }
      const filename = `${randomBytes(16).toString('hex')}${ext}`;
      const url = await storageProvider.upload(file.buffer, filename, CONTENT_TYPES[ext]);
      return { url };
    }));

  return router;
}
