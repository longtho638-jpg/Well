/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_URL: string;
  /** @deprecated GEMINI_API_KEY is server-side only via Supabase Edge Function Secrets */
  readonly VITE_ADMIN_EMAILS: string;
  readonly VITE_MEKONG_HUB_ENDPOINT: string;
  readonly VITE_MEKONG_HUB_API_KEY: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
