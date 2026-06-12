// Creates the dedicated test database (if missing) and applies migrations
// before the integration test suite runs.
import { execSync } from 'node:child_process';
import { TEST_DATABASE_URL } from './test-database-url';

export default function setup(): void {
  const url = new URL(TEST_DATABASE_URL);
  const databaseName = url.pathname.slice(1);
  const adminUrl = new URL(TEST_DATABASE_URL);
  adminUrl.pathname = '/postgres';

  try {
    execSync(`npx prisma db execute --url "${adminUrl.href}" --stdin`, {
      input: `CREATE DATABASE "${databaseName}"`,
      stdio: ['pipe', 'ignore', 'ignore'],
    });
  } catch {
    // Database already exists.
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
