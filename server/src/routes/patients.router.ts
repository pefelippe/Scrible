// Patient CRUD endpoints, backing the patient management panel.
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from '../lib/http-error';
import { prisma } from '../lib/prisma';

const patientBodySchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  dob: z.coerce.date({ errorMap: () => ({ message: 'dob must be a valid date' }) }),
  gender: z.string().trim().min(1, 'Gender is required'),
});

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

// Medical record numbers are system-assigned: short, readable, and unique.
function generateMrn(): string {
  return `MRN-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export const patientsRouter = Router();

patientsRouter.get('/', async (_req, res, next) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { lastName: 'asc' },
      include: { _count: { select: { notes: true } } },
    });
    res.json(patients.map(({ _count, ...patient }) => ({ ...patient, noteCount: _count.notes })));
  } catch (error) {
    next(error);
  }
});

patientsRouter.get('/:id', async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!patient) {
      throw new HttpError(404, 'Patient not found');
    }
    res.json(patient);
  } catch (error) {
    next(error);
  }
});

patientsRouter.post('/', async (req, res, next) => {
  try {
    const body = patientBodySchema.parse(req.body);
    const patient = await prisma.patient.create({ data: { ...body, mrn: generateMrn() } });
    res.status(201).json(patient);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      next(new HttpError(409, 'A patient with this MRN already exists'));
      return;
    }
    next(error);
  }
});

patientsRouter.put('/:id', async (req, res, next) => {
  try {
    const body = patientBodySchema.parse(req.body);
    const existing = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new HttpError(404, 'Patient not found');
    }
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: body,
    });
    res.json(patient);
  } catch (error) {
    next(error);
  }
});

patientsRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new HttpError(404, 'Patient not found');
    }
    await prisma.$transaction([
      prisma.note.deleteMany({ where: { patientId: req.params.id } }),
      prisma.patient.delete({ where: { id: req.params.id } }),
    ]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
