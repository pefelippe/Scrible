// Integration tests for the patient CRUD endpoints.
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { createTestPatient, createUserWithToken, resetDatabase } from './helpers';

const app = createApp();

const validBody = {
  firstName: 'June',
  lastName: 'Osei',
  dob: '1957-05-20',
  gender: 'Female',
};

describe('patients CRUD', () => {
  let token: string;

  beforeEach(async () => {
    await resetDatabase();
    token = await createUserWithToken(app);
  });

  it('creates a patient with a generated MRN', async () => {
    const response = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send(validBody);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ firstName: 'June' });
    expect(response.body.mrn).toMatch(/^MRN-/);
    expect(await prisma.patient.count()).toBe(1);
  });

  it('rejects invalid bodies with 400', async () => {
    const response = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validBody, dob: 'not-a-date' });

    expect(response.status).toBe(400);
  });

  it('lists and fetches patients', async () => {
    const patient = await createTestPatient();

    const list = await request(app).get('/api/patients').set('Authorization', `Bearer ${token}`);
    const single = await request(app)
      .get(`/api/patients/${patient.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(single.status).toBe(200);
    expect(single.body.mrn).toBe(patient.mrn);
  });

  it('updates a patient', async () => {
    const patient = await createTestPatient();

    const response = await request(app)
      .put(`/api/patients/${patient.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validBody, firstName: 'Updated' });

    expect(response.status).toBe(200);
    expect(response.body.firstName).toBe('Updated');
  });

  it('deletes a patient without notes', async () => {
    const patient = await createTestPatient();

    const response = await request(app)
      .delete(`/api/patients/${patient.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect(await prisma.patient.count()).toBe(0);
  });

  it('cascade-deletes a patient along with their notes', async () => {
    const patient = await createTestPatient();
    await prisma.note.create({
      data: {
        patientId: patient.id,
        sourceType: 'TEXT',
        rawText: 'raw',
        summary: 'summary',
      },
    });

    const response = await request(app)
      .delete(`/api/patients/${patient.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect(await prisma.patient.count()).toBe(0);
    expect(await prisma.note.count()).toBe(0);
  });

  it('returns 404 for unknown patient on GET', async () => {
    const response = await request(app)
      .get('/api/patients/3e8c3a4e-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('returns 404 for unknown patient on PUT', async () => {
    const response = await request(app)
      .put('/api/patients/3e8c3a4e-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send(validBody);

    expect(response.status).toBe(404);
  });

  it('returns 404 for unknown patient on DELETE', async () => {
    const response = await request(app)
      .delete('/api/patients/3e8c3a4e-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
