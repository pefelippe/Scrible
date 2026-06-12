// Seed runner. Only executes when the project is started with SEED=on, so
// seeding is an explicit opt-in flag. Seed data lives in ./seeds (one file
// per entity); currently only patients are seeded. Idempotent: upserts by
// MRN so re-running never duplicates records.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { patientSeeds } from './seeds/patients';
import { userSeeds } from './seeds/users';

const prisma = new PrismaClient();

async function seedPatients(): Promise<void> {
  for (const patient of patientSeeds) {
    await prisma.patient.upsert({
      where: { mrn: patient.mrn },
      update: {},
      create: patient,
    });
  }
  console.log(`Seeded ${patientSeeds.length} patients`);
}

async function seedUsers(): Promise<void> {
  for (const { password, ...user } of userSeeds) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, passwordHash: await bcrypt.hash(password, 10) },
    });
  }
  console.log(`Seeded ${userSeeds.length} users`);
}

async function main(): Promise<void> {
  if (process.env.SEED !== 'on') {
    console.log('Seeding skipped (set SEED=on to enable)');
    return;
  }
  await seedPatients();
  await seedUsers();
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
