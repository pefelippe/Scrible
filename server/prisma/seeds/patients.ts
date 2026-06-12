// Patient seed data. Each entity type gets its own file in this directory
// (e.g. notes.ts could be added later); only patients are seeded for now.
import type { Prisma } from '@prisma/client';

export const patientSeeds: Prisma.PatientCreateInput[] = [
  {
    mrn: 'MRN-0001',
    firstName: 'Margaret',
    lastName: 'Holloway',
    dob: new Date('1948-03-12'),
    gender: 'Female',
  },
  {
    mrn: 'MRN-0002',
    firstName: 'Walter',
    lastName: 'Reyes',
    dob: new Date('1955-11-02'),
    gender: 'Male',
  },
  {
    mrn: 'MRN-0003',
    firstName: 'Dorothy',
    lastName: 'Nakamura',
    dob: new Date('1942-07-28'),
    gender: 'Female',
  },
];
