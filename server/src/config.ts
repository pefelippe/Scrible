// Typed environment configuration. Fails fast at startup if required
// variables are missing so misconfiguration surfaces immediately.
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  PORT: z.coerce.number().int().positive().default(4000),
  UPLOADS_DIR: z.string().default('uploads'),
  // S3 audio storage is optional: when S3_BUCKET is unset, audio stays on
  // local disk. AWS credentials/region resolve via the standard AWS chain.
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(), // e.g. LocalStack endpoint
});

export const config = envSchema.parse(process.env);
