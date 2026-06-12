// Integration tests for note creation and the paginated listing. The OpenAI
// services are mocked (external boundary); everything else hits the real
// Express app + Postgres.
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { createTestPatient, createUserWithToken, resetDatabase } from './helpers';

vi.mock('../src/services/transcription.service', () => ({
  transcribeAudio: vi.fn().mockResolvedValue('Transcribed visit note from audio.'),
}));

vi.mock('../src/services/summary.service', () => ({
  generateSoapSummary: vi
    .fn()
    .mockResolvedValue('S: ...\nO: ...\nA: ...\nP: ...'),
}));

const app = createApp();

describe('notes', () => {
  let token: string;

  beforeEach(async () => {
    await resetDatabase();
    token = await createUserWithToken(app);
  });

  it('creates a text note with an AI summary', async () => {
    const patient = await createTestPatient();

    const response = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .field('patientId', patient.id)
      .field('text', 'Patient reports mild dizziness. BP 130/85.');

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      sourceType: 'TEXT',
      rawText: 'Patient reports mild dizziness. BP 130/85.',
      summary: 'S: ...\nO: ...\nA: ...\nP: ...',
    });
    expect(response.body.patient.id).toBe(patient.id);
  });

  it('creates an audio note via transcription', async () => {
    const patient = await createTestPatient();

    const response = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .field('patientId', patient.id)
      .attach('audio', Buffer.from('fake-audio-bytes'), 'visit.mp3');

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      sourceType: 'AUDIO',
      audioFilename: 'visit.mp3',
      rawText: 'Transcribed visit note from audio.',
    });
    expect(response.body.audioLocation).toMatch(/^local:/);
  });

  it('rejects a note without text or audio', async () => {
    const patient = await createTestPatient();

    const response = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .field('patientId', patient.id);

    expect(response.status).toBe(400);
  });

  it('rejects unsupported audio formats', async () => {
    const patient = await createTestPatient();

    const response = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .field('patientId', patient.id)
      .attach('audio', Buffer.from('nope'), 'notes.pdf');

    expect(response.status).toBe(400);
  });

  it('returns 404 when the patient does not exist', async () => {
    const response = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .field('patientId', '3e8c3a4e-0000-0000-0000-000000000000')
      .field('text', 'orphan note');

    expect(response.status).toBe(404);
  });

  it('paginates the notes list newest first', async () => {
    const patient = await createTestPatient();
    for (let i = 1; i <= 5; i += 1) {
      await prisma.note.create({
        data: {
          patientId: patient.id,
          sourceType: 'TEXT',
          rawText: `raw ${i}`,
          summary: `summary ${i}`,
          createdAt: new Date(Date.now() + i * 1000),
        },
      });
    }

    const pageOne = await request(app)
      .get('/api/notes?page=1&pageSize=2')
      .set('Authorization', `Bearer ${token}`);
    const pageThree = await request(app)
      .get('/api/notes?page=3&pageSize=2')
      .set('Authorization', `Bearer ${token}`);

    expect(pageOne.status).toBe(200);
    expect(pageOne.body.total).toBe(5);
    expect(pageOne.body.items).toHaveLength(2);
    expect(pageOne.body.items[0].summary).toBe('summary 5');
    expect(pageThree.body.items).toHaveLength(1);
    expect(pageThree.body.items[0].summary).toBe('summary 1');
  });

  it('filters the notes list by patientId', async () => {
    const patientA = await createTestPatient();
    const patientB = await createTestPatient({ mrn: 'MRN-TEST-2' });
    await prisma.note.create({
      data: { patientId: patientA.id, sourceType: 'TEXT', rawText: 'raw a', summary: 'sum a' },
    });
    await prisma.note.create({
      data: { patientId: patientB.id, sourceType: 'TEXT', rawText: 'raw b', summary: 'sum b' },
    });

    const response = await request(app)
      .get(`/api/notes?patientId=${patientA.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].patientId).toBe(patientA.id);
  });

  it('rejects an invalid pagination query', async () => {
    const response = await request(app)
      .get('/api/notes?page=0&pageSize=999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('fetches a single note with patient metadata', async () => {
    const patient = await createTestPatient();
    const note = await prisma.note.create({
      data: { patientId: patient.id, sourceType: 'TEXT', rawText: 'raw', summary: 'sum' },
    });

    const response = await request(app)
      .get(`/api/notes/${note.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.patient.mrn).toBe(patient.mrn);
  });

  it('updates a note summary', async () => {
    const patient = await createTestPatient();
    const note = await prisma.note.create({
      data: { patientId: patient.id, sourceType: 'TEXT', rawText: 'raw', summary: 'old' },
    });

    const response = await request(app)
      .put(`/api/notes/${note.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ summary: 'updated summary' });

    expect(response.status).toBe(200);
    expect(response.body.summary).toBe('updated summary');
    expect(response.body.patient.id).toBe(patient.id);
  });

  it('rejects an empty summary update', async () => {
    const patient = await createTestPatient();
    const note = await prisma.note.create({
      data: { patientId: patient.id, sourceType: 'TEXT', rawText: 'raw', summary: 'old' },
    });

    const response = await request(app)
      .put(`/api/notes/${note.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ summary: '   ' });

    expect(response.status).toBe(400);
  });

  it('returns 404 when updating a missing note', async () => {
    const response = await request(app)
      .put('/api/notes/3e8c3a4e-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ summary: 'updated' });

    expect(response.status).toBe(404);
  });

  it('deletes a note', async () => {
    const patient = await createTestPatient();
    const note = await prisma.note.create({
      data: { patientId: patient.id, sourceType: 'TEXT', rawText: 'raw', summary: 'sum' },
    });

    const response = await request(app)
      .delete(`/api/notes/${note.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect(await prisma.note.findUnique({ where: { id: note.id } })).toBeNull();
  });

  it('returns 404 when deleting a missing note', async () => {
    const response = await request(app)
      .delete('/api/notes/3e8c3a4e-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  describe('POST /api/notes/generate-summary', () => {
    it('returns an AI-generated summary for valid text', async () => {
      const response = await request(app)
        .post('/api/notes/generate-summary')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Patient reports mild dizziness. BP 130/85.' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(typeof response.body.summary).toBe('string');
      expect(response.body.summary.length).toBeGreaterThan(0);
    });

    it('rejects empty text with 400', async () => {
      const response = await request(app)
        .post('/api/notes/generate-summary')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: '   ' });

      expect(response.status).toBe(400);
    });

    it('rejects missing text field with 400', async () => {
      const response = await request(app)
        .post('/api/notes/generate-summary')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/notes/transcribe', () => {
    it('returns a transcript for a valid audio file', async () => {
      const response = await request(app)
        .post('/api/notes/transcribe')
        .set('Authorization', `Bearer ${token}`)
        .attach('audio', Buffer.from('fake-audio-bytes'), 'visit.mp3');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transcript');
      expect(response.body.transcript).toBe('Transcribed visit note from audio.');
    });

    it('rejects requests with no audio file with 400', async () => {
      const response = await request(app)
        .post('/api/notes/transcribe')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('rejects unsupported audio formats with 400', async () => {
      const response = await request(app)
        .post('/api/notes/transcribe')
        .set('Authorization', `Bearer ${token}`)
        .attach('audio', Buffer.from('nope'), 'document.pdf');

      expect(response.status).toBe(400);
    });
  });
});
