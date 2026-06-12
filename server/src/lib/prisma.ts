// Shared PrismaClient instance so the app uses a single connection pool.
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
