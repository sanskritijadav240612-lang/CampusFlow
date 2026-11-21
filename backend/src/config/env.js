import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load from current working directory, and also fallback to backend/.env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z
  .object({
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').default('http://localhost:5173'),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    AI_API_KEY: z.string().optional(),
    AI_BASE_URL: z.string().url('AI_BASE_URL must be a valid URL').optional(),
    AI_MODEL: z.string().optional(),
    CAMPUS_TIMEZONE: z.string().default('Asia/Kolkata'),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasAny = Boolean(data.AI_API_KEY || data.AI_BASE_URL || data.AI_MODEL);
      const hasAll = Boolean(data.AI_API_KEY && data.AI_BASE_URL && data.AI_MODEL);
      return !hasAny || hasAll;
    },
    {
      message: 'If any AI configuration is provided, AI_API_KEY, AI_BASE_URL, and AI_MODEL must all be set.',
      path: ['AI_API_KEY'],
    }
  );

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:');
  const issues = parsedEnv.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  console.error(issues.join('\n'));
  process.exit(1);
}

const finalEmailFrom = parsedEnv.data.EMAIL_FROM || parsedEnv.data.RESEND_FROM_EMAIL || 'CampusFlow <onboarding@resend.dev>';

export const env = {
  ...parsedEnv.data,
  EMAIL_FROM: finalEmailFrom,
  RESEND_FROM_EMAIL: finalEmailFrom,
};
