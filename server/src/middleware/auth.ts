// Authentication middleware: every signed-in user has full access.
import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http-error';
import { verifyToken, type AuthUser } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Authentication required'));
    return;
  }
  try {
    req.user = verifyToken(header.slice('Bearer '.length));
    next();
  } catch (error) {
    next(error);
  }
}
