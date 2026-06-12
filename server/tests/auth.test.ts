// Integration tests for authentication rules.
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createUserWithToken, resetDatabase } from './helpers';

const app = createApp();

describe('auth', () => {
  beforeEach(resetDatabase);

  it('logs in with valid credentials and returns a token + user', async () => {
    await createUserWithToken(app);
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.local', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTypeOf('string');
    expect(response.body.user).toMatchObject({ email: 'admin@test.local' });
  });

  it('rejects invalid credentials', async () => {
    await createUserWithToken(app);
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.local', password: 'wrong' });

    expect(response.status).toBe(401);
  });

  it('rejects unauthenticated access to protected endpoints', async () => {
    const patients = await request(app).get('/api/patients');
    const notes = await request(app).get('/api/notes');

    expect(patients.status).toBe(401);
    expect(notes.status).toBe(401);
  });
});
