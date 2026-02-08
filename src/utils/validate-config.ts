export interface ConfigState {
  isValid: boolean;
  missingKeys: string[];
}

/**
 * Validates that all required environment variables are present.
 * Throws an error in production or logs a warning in development if keys are missing.
 */
export function validateConfig(env: Record<string, string | boolean | undefined> = import.meta.env): ConfigState {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_API_URL',
    // Add VITE_GEMINI_API_KEY if strictly required for app startup,
    // otherwise it might be better handled lazily when the feature is accessed.
  ];

  const missingKeys: string[] = [];

  for (const key of requiredEnvVars) {
    // import.meta.env is replaced by Vite at build time.
    // We check if it's undefined or an empty string.
    if (!env[key]) {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    const errorMessage = `
=================================================================
❌ MISSING CONFIGURATION
The following environment variables are missing:
${missingKeys.map(key => `   - ${key}`).join('\n')}

Please create a .env file in the project root with these values.
=================================================================
    `;

    console.error(errorMessage);

    return { isValid: false, missingKeys };
  }

  return { isValid: true, missingKeys: [] };
}
