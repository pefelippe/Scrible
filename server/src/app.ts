// Express application: middleware, routes, and central error handling.
import cors from 'cors';
import express from 'express';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { authRouter } from './routes/auth.router';
import { notesRouter } from './routes/notes.router';
import { patientsRouter } from './routes/patients.router';
import { statsRouter } from './routes/stats.router';

export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/patients', authenticate, patientsRouter);
  app.use('/api/notes', authenticate, notesRouter);
  app.use('/api/stats', authenticate, statsRouter);

  app.use(errorHandler);

  return app;
}
