// Connection string for the dedicated integration-test database.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://scribe:scribe@localhost:5432/scribe_test';
