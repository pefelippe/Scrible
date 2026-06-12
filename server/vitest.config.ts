// Integration test config: tests run sequentially against a dedicated
// Postgres test database (created/migrated in tests/global-setup.ts).
import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './tests/test-database-url';

export default defineConfig({
  test: {
    globalSetup: './tests/global-setup.ts',
    fileParallelism: false,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: 'test-secret',
      OPENAI_API_KEY: 'test-key',
      UPLOADS_DIR: 'tests/.uploads',
    },
  },
});
