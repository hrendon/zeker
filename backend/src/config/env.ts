import { fileURLToPath } from 'node:url'
import path from 'node:path'
import dotenv from 'dotenv'
import { z } from 'zod'

const here = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(here, '..', '..')
const repoRoot = path.resolve(backendRoot, '..')

// Local development reads .env from the backend folder first, then falls back to
// the repository root (where .env.example lives). On Cloud Run there is no .env
// file at all — the platform supplies the variables directly.
dotenv.config({ path: [path.join(backendRoot, '.env'), path.join(repoRoot, '.env')], quiet: true })

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    // Firestore and Firebase Auth are reached through Application Default
    // Credentials, so the project id is the only GCP value the app needs here.
    GCP_PROJECT_ID: z.string().min(1).optional(),
    // Comma-separated list of browser origins allowed to call this API.
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && !value.GCP_PROJECT_ID) {
      ctx.addIssue({
        code: 'custom',
        path: ['GCP_PROJECT_ID'],
        message: 'GCP_PROJECT_ID is required when NODE_ENV=production',
      })
    }
  })

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Invalid environment configuration:\n${details}`)
}

export const env = parsed.data

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0)

export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'
