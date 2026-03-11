export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder',
  API_URL: import.meta.env.VITE_API_URL,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  IS_PROD: import.meta.env.PROD,
  IS_DEV: import.meta.env.DEV,
};

export const isSupabaseConfigured = () => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

export const validateEnv = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_API_URL'
  ];
  const missing = required.filter(key => !import.meta.env[key]);
  return {
    isValid: missing.length === 0,
    missingKeys: missing
  };
};
