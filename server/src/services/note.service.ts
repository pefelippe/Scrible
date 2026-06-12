// Orchestrates note creation: resolves raw text (typed or transcribed from
// audio), optionally attaches an AI-generated summary, and persists the note.
import { NoteSource } from '@prisma/client';
import { HttpError } from '../lib/http-error';
import { prisma } from '../lib/prisma';
import { audioStorage } from '../storage/audio-storage';
import { transcribeAudio } from './transcription.service';

interface CreateNoteInput {
  patientId: string;
  text?: string;
  audio?: { path: string; originalName: string };
  // Pre-generated summary from the client; skips the AI call when provided.
  summary?: string;
}

export async function createNote(input: CreateNoteInput) {
  const patient = await prisma.patient.findUnique({ where: { id: input.patientId } });
  if (!patient) {
    throw new HttpError(404, 'Patient not found');
  }

  let rawText: string;
  let sourceType: NoteSource;
  let audioLocation: string | undefined;
  if (input.audio) {
    rawText = await transcribeAudio(input.audio.path);
    audioLocation = await audioStorage.store(input.audio.path);
    sourceType = NoteSource.AUDIO;
  } else if (input.text && input.text.trim().length > 0) {
    rawText = input.text.trim();
    sourceType = NoteSource.TEXT;
  } else {
    throw new HttpError(400, 'Provide either note text or an audio file');
  }

  const summary = input.summary?.trim() || null;

  return prisma.note.create({
    data: {
      patientId: patient.id,
      sourceType,
      audioFilename: input.audio?.originalName,
      audioLocation,
      rawText,
      summary,
    },
    include: { patient: true },
  });
}
