import { createLogger } from './logger';
import { validateRaaSLicense } from '../lib/raas-gate';

const configLogger = createLogger('Config');

export interface ConfigState {
  isValid: boolean;
  missingKeys: string[];
  licenseError?: string;
}

/**
 * Validates that all required environment variables are present.
 * Also validates RaaS license key if RAAS_LICENSE_KEY env var is defined.
 *
 * @param exitOnLicenseError - If true, process.exit(1) on invalid license (for middleware mode)
 * @returns ConfigState with validation result
 */
export function validateConfig(
  env: Record<string, string | boolean | undefined> = import.meta.env as Record<string, string | boolean | undefined>,
  exitOnLicenseError: boolean = false
): ConfigState {
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

    configLogger.error(errorMessage);

    return { isValid: false, missingKeys };
  }

  // Validate RaaS license key if present in environment
  const raasLicenseKey = env.VITE_RAAS_LICENSE_KEY;
  // Check if license key is explicitly set as a valid non-empty string (not undefined, not empty)
  // Empty string or undefined → treat as no license = free tier = valid
  // Non-string values (e.g., boolean) also treated as missing = valid
  if (raasLicenseKey !== undefined && typeof raasLicenseKey === 'string' && raasLicenseKey.length > 0) {
    // Valid string, validate the license format
    const licenseResult = validateRaaSLicense(raasLicenseKey);
    if (!licenseResult.isValid) {
      const licenseErrorMessage = `
=================================================================
❌ INVALID RAAS LICENSE KEY
The RAAS_LICENSE_KEY environment variable is invalid: "${raasLicenseKey}"

Please check your license key format:
  - Must start with "RAAS-"
  - Followed by 10 digits (timestamp)
  - Followed by "-" and at least 6 uppercase alphanumeric characters
  - Example: RAAS-1234567890-ABC123XYZ

Application will exit with code 1 in middleware mode.
=================================================================
      `;

      configLogger.error(licenseErrorMessage);

      const result: ConfigState = {
        isValid: false,
        missingKeys,
        licenseError: 'Invalid RAAS license key'
      };

      // Exit process if in middleware mode (for server-side validation)
      if (exitOnLicenseError && typeof process !== 'undefined' && process.exit) {
        process.exit(1);
      }

      return result;
    }
  }
  // If raasLicenseKey is undefined or non-string (e.g., boolean), treat as no license = free tier = valid

  return { isValid: true, missingKeys: [] };
}
