// Aggregate counts backing the dashboard stat cards.
import { Router } from 'express';
import { prisma } from '../lib/prisma';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const statsRouter = Router();

statsRouter.get('/', async (_req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [patients, notes, notesThisWeek, notesToday] = await Promise.all([
      prisma.patient.count(),
      prisma.note.count(),
      prisma.note.count({ where: { createdAt: { gte: new Date(Date.now() - WEEK_MS) } } }),
      prisma.note.count({ where: { createdAt: { gte: startOfToday } } }),
    ]);
    res.json({ patients, notes, notesThisWeek, notesToday });
  } catch (error) {
    next(error);
  }
});
