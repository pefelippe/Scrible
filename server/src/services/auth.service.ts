// Credential verification and JWT issuing/validation.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { HttpError } from '../lib/http-error';
import { prisma } from '../lib/prisma';

const TOKEN_TTL = '12h';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  const authUser: AuthUser = { id: user.id, email: user.email, name: user.name };
  const token = jwt.sign(authUser, config.JWT_SECRET, { expiresIn: TOKEN_TTL });
  return { token, user: authUser };
}

export function verifyToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthUser;
    return { id: payload.id, email: payload.email, name: payload.name };
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
}
