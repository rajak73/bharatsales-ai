import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpException } from './http-errors';
import { Logger } from './logger';

const logger = new Logger('HTTP');

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.path}`, error: 'Not Found', statusCode: 404 });
};

// Central error handler — produces the same { statusCode, message, error }
// body Nest's exception filter did.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof HttpException) {
    return res.status(err.getStatus()).json(err.toJSON());
  }

  // body-parser / multer errors
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ statusCode: 400, message: 'Malformed JSON body', error: 'Bad Request' });
  }
  if (err?.type === 'entity.too.large' || err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ statusCode: 413, message: 'Payload too large', error: 'Payload Too Large' });
  }
  if (err?.name === 'MulterError') {
    return res.status(400).json({ statusCode: 400, message: err.message, error: 'Bad Request' });
  }

  // Mongoose: bad ObjectId / schema validation / duplicate key.
  // Deliberate divergence from Nest, whose default filter answered all of
  // these with 500: a malformed :id or invalid document is the client's
  // fault (400) and a unique-index clash is a conflict (409). Clients that
  // only check for "not 2xx" are unaffected.
  if (err?.name === 'CastError') {
    return res.status(400).json({ statusCode: 400, message: `Invalid ${err.path}`, error: 'Bad Request' });
  }
  if (err?.name === 'ValidationError' && err?.errors) {
    const message = Object.values(err.errors).map((e: any) => e.message);
    return res.status(400).json({ statusCode: 400, message, error: 'Bad Request' });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ statusCode: 409, message: 'Duplicate record', error: 'Conflict' });
  }

  logger.error('Unhandled error', err);
  res.status(500).json({ statusCode: 500, message: 'Internal server error' });
};
