import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(6002),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    // Refresh tokens are opaque random values stored server-side, so this is
    // not used to sign anything today; kept optional for older deploy configs.
    JWT_REFRESH_SECRET: z.string().optional(),
    MONGODB_URI: z.string().optional(),
    CORS_ORIGINS: z.string().optional(),
    // Where uploaded photos live: gridfs (MongoDB, survives deploys; default) or local (dev disk).
    STORAGE_DRIVER: z.enum(['gridfs', 'local']).default('gridfs'),
  })
  .passthrough()
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.JWT_SECRET.length < 32) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['JWT_SECRET'], message: 'JWT_SECRET must be at least 32 characters in production' });
    }
    if (env.NODE_ENV === 'production' && !env.MONGODB_URI) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['MONGODB_URI'], message: 'MONGODB_URI is required in production' });
    }
  });

export type Env = z.infer<typeof envSchema>;

/** Validates process.env at boot. Throws with every problem listed. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.') || 'env'}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return parsed.data;
}
