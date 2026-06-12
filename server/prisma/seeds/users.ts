// User seed data: a single admin account for the demo.
// Passwords here are demo-only and documented in the README.
export interface UserSeed {
  email: string;
  name: string;
  password: string;
}

export const userSeeds: UserSeed[] = [
  {
    email: 'admin@scribe.local',
    name: 'Ada Admin',
    password: 'admin123',
  },
];
