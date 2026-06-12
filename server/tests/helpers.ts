// Shared utilities for integration tests: database reset and authenticated
// test users/tokens.
import bcrypt from 'bcryptjs';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '../src/lib/prisma';

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE "Note", "Patient", "User" CASCADE');
}

export async function createUserWithToken(app: Express): Promise<string> {
  const email = 'admin@test.local';
  const password = 'password123';
  await prisma.user.create({
    data: {
      email,
      name: 'Test Admin',
      passwordHash: await bcrypt.hash(password, 4),
    },
  });
  const response = await request(app).post('/api/auth/login').send({ email, password });
  return (response.body as { token: string }).token;
}

export function createTestPatient(overrides: { mrn?: string } = {}) {
  return prisma.patient.create({
    data: {
      mrn: overrides.mrn ?? 'MRN-TEST-1',
      firstName: 'Test',
      lastName: 'Patient',
      dob: new Date('1950-01-01'),
      gender: 'Female',
    },
  });
}
