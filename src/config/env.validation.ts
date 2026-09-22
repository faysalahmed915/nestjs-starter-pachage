import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  APP_NAME: z.string().default('nestjs-enterprise-starter'),
  API_PREFIX: z.string().default('api/v1'),

  // Database
  DATABASE_URL: z
    .string()
    .url()
    .default(
      'postgresql://postgres:postgres_secure_password@localhost:5432/starter_db?schema=public',
    ),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres_secure_password'),
  DB_NAME: z.string().default('starter_db'),

  // Security & Throttling
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),
  THROTTLE_TTL: z.coerce.number().default(60000),
  THROTTLE_LIMIT: z.coerce.number().default(100),

  // Authentication (Better-Auth Ready)
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, 'BETTER_AUTH_SECRET must be at least 16 characters for secure session signing')
    .default('change-this-to-a-very-long-and-cryptographically-secure-random-secret'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(
      `\n❌ Invalid environment variable configuration:\n${formattedErrors}\n\nPlease check your .env file.`,
    );
  }

  return result.data;
}
