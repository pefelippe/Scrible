// Central error handler: maps known error types to HTTP responses and
// hides internal details for unexpected failures.
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/http-error';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ error: error.issues.map((i) => i.message).join('; ') });
    return;
  }
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
};
