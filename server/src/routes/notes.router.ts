// Note endpoints: list, detail, creation (text or audio upload), summary
// update, and deletion.
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Prisma } from '@prisma/client';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { config } from '../config';
import { HttpError } from '../lib/http-error';
import { prisma } from '../lib/prisma';
import { createNote } from '../services/note.service';
import { generateSoapSummary } from '../services/summary.service';
import { transcribeAudio } from '../services/transcription.service';

const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.mp4', '.m4a', '.wav', '.webm', '.ogg', '.flac'];
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // Whisper API limit

fs.mkdirSync(config.UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: config.UPLOADS_DIR,
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: MAX_AUDIO_BYTES },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_AUDIO_EXTENSIONS.includes(extension)) {
      cb(new HttpError(400, `Unsupported audio format. Allowed: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`));
      return;
    }
    cb(null, true);
  },
});

const createNoteBodySchema = z.object({
  patientId: z.string().uuid('patientId must be a valid UUID'),
  text: z.string().optional(),
  summary: z.string().optional(),
});

const generateSummaryBodySchema = z.object({
  text: z.string().trim().min(1, 'text is required'),
});

const updateNoteBodySchema = z.object({
  summary: z.string().trim().min(1, 'summary is required'),
});

const listNotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  // Comma-separated list of patient ids to filter by.
  patientId: z
    .string()
    .transform((value) => value.split(','))
    .pipe(z.array(z.string().uuid('patientId must be a valid UUID')))
    .optional(),
  sourceType: z.enum(['TEXT', 'AUDIO']).optional(),
  q: z.string().trim().optional(),
});

export const notesRouter = Router();

// Transcribe an uploaded audio file to text without creating a note.
notesRouter.post('/transcribe', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError(400, 'An audio file is required');
    }
    const transcript = await transcribeAudio(req.file.path);
    res.json({ transcript });
  } catch (error) {
    next(error);
  }
});

// Generate a SOAP summary from text without creating a note.
notesRouter.post('/generate-summary', async (req, res, next) => {
  try {
    const { text } = generateSummaryBodySchema.parse(req.body);
    const summary = await generateSoapSummary(text);
    res.json({ summary });
  } catch (error) {
    next(error);
  }
});

notesRouter.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, patientId, sourceType, q } = listNotesQuerySchema.parse(req.query);
    const where: Prisma.NoteWhereInput = {
      ...(patientId ? { patientId: { in: patientId } } : {}),
      ...(sourceType ? { sourceType } : {}),
      ...(q
        ? {
            OR: [
              { summary: { contains: q, mode: 'insensitive' } },
              { rawText: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { patient: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.note.count({ where }),
    ]);
    res.json({ items, total, page, pageSize });
  } catch (error) {
    next(error);
  }
});

notesRouter.get('/:id', async (req, res, next) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
      include: { patient: true },
    });
    if (!note) {
      throw new HttpError(404, 'Note not found');
    }
    res.json(note);
  } catch (error) {
    next(error);
  }
});

notesRouter.post('/', upload.single('audio'), async (req, res, next) => {
  try {
    const body = createNoteBodySchema.parse(req.body);
    const note = await createNote({
      patientId: body.patientId,
      text: body.text,
      summary: body.summary,
      audio: req.file
        ? { path: req.file.path, originalName: req.file.originalname }
        : undefined,
    });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

notesRouter.put('/:id', async (req, res, next) => {
  try {
    const body = updateNoteBodySchema.parse(req.body);
    const existing = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new HttpError(404, 'Note not found');
    }
    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: { summary: body.summary },
      include: { patient: true },
    });
    res.json(note);
  } catch (error) {
    next(error);
  }
});

notesRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new HttpError(404, 'Note not found');
    }
    await prisma.note.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
