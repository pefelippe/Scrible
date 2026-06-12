// Authentication endpoints.
import { Router } from 'express';
import { z } from 'zod';
import { login } from '../services/auth.service';

const loginBodySchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = loginBodySchema.parse(req.body);
    res.json(await login(body.email, body.password));
  } catch (error) {
    next(error);
  }
});
