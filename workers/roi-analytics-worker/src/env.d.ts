/// <reference types="@cloudflare/workers-types" />

export interface Env {
  // Worker configuration
  ENVIRONMENT: string
  ROI_CALCULATION_VERSION: string
  WEBHOOK_TIMEOUT_MS: number
  MAX_RETRIES: number

  // Secrets
  JWT_SECRET: string
  WEBHOOK_URL: string
  ADMIN_API_KEY: string
  STRIPE_SECRET_KEY: string
  POLAR_ACCESS_TOKEN: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string

  // Bindings
  ROI_CACHE: KVNamespace
  WEBHOOK_RATE_LIMIT: KVNamespace
  ROI_AUDIT_LOGS: R2Bucket
}
