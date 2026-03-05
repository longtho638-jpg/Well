/**
 * RaaS License Gate
 *
 * License validation and feature gating for RaaS (Revenue as a Service) deployment.
 *
 * Features gated behind RAAS_LICENSE_KEY:
 * - Admin dashboard access
 * - PayOS production webhook handling
 * - Commission distribution
 * - Policy engine configuration
 *
 * License format: RAAS-{timestamp}-{hash}
 * Example: RAAS-1709337600-a1b2c3d4e5f6
 */

// License pattern: RAAS-{timestamp}-{hash}
const LICENSE_PATTERN = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/;

export interface LicenseValidationResult {
  isValid: boolean;
  license?: string;
  expiresAt?: number;
  features: {
    adminDashboard: boolean;
    payosWebhook: boolean;
    commissionDistribution: boolean;
    policyEngine: boolean;
  };
  error?: string;
}

/**
 * Get license key from environment (Vite or Node)
 */
function getLicenseKey(): string | undefined {
  // Vite env (frontend) - cast to string to handle boolean edge case
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const val = import.meta.env.VITE_RAAS_LICENSE_KEY;
    if (typeof val === 'boolean') return undefined;
    return val;
  }
  // Node env (backend/SSR)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.RAAS_LICENSE_KEY;
  }
  return undefined;
}

/**
 * Check if running in development mode
 */
function isDevelopment(): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    return true;
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return true;
  }
  return false;
}

/**
 * Validate RaaS license key format and expiration
 */
export function validateRaasLicense(): LicenseValidationResult {
  const licenseKey = getLicenseKey();

  // License not configured - allow in development
  if (!licenseKey) {
    if (isDevelopment()) {
      return {
        isValid: true,
        features: {
          adminDashboard: true,
          payosWebhook: true,
          commissionDistribution: true,
          policyEngine: true,
        },
      };
    }

    return {
      isValid: false,
      features: {
        adminDashboard: false,
        payosWebhook: false,
        commissionDistribution: false,
        policyEngine: false,
      },
      error: 'RAAS_LICENSE_KEY not configured',
    };
  }

  // Validate license format
  if (!LICENSE_PATTERN.test(licenseKey)) {
    return {
      isValid: false,
      features: {
        adminDashboard: false,
        payosWebhook: false,
        commissionDistribution: false,
        policyEngine: false,
      },
      error: 'Invalid license format',
    };
  }

  // Parse license components
  const parts = licenseKey.split('-');
  const timestamp = parseInt(parts[1], 10);
  const expiresAt = timestamp + (365 * 24 * 60 * 60 * 1000); // 1 year from timestamp
  const now = Date.now();

  // Check expiration
  if (now > expiresAt) {
    return {
      isValid: false,
      expiresAt,
      features: {
        adminDashboard: false,
        payosWebhook: false,
        commissionDistribution: false,
        policyEngine: false,
      },
      error: 'License expired',
    };
  }

  // License valid - enable all features
  return {
    isValid: true,
    license: licenseKey,
    expiresAt,
    features: {
      adminDashboard: true,
      payosWebhook: true,
      commissionDistribution: true,
      policyEngine: true,
    },
  };
}

/**
 * Check if admin dashboard is accessible
 */
export function isAdminDashboardEnabled(): boolean {
  const result = validateRaasLicense();
  return result.features.adminDashboard;
}

/**
 * Check if PayOS webhook should process production events
 */
export function isPayosWebhookEnabled(): boolean {
  const result = validateRaasLicense();
  return result.features.payosWebhook;
}

/**
 * Get current license status for UI display
 */
export function getLicenseStatus(): {
  isActive: boolean;
  expiresAt?: number;
  daysRemaining?: number;
} {
  const result = validateRaasLicense();

  if (!result.isValid || !result.expiresAt) {
    return { isActive: false };
  }

  const daysRemaining = Math.floor((result.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
  return {
    isActive: true,
    expiresAt: result.expiresAt,
    daysRemaining,
  };
}

/**
 * Middleware guard for admin routes
 * Returns true if access allowed, false otherwise
 */
export function checkRaasLicenseGuard(): boolean {
  return validateRaasLicense().isValid;
}

// Singleton validation result (cached for performance)
let cachedResult: LicenseValidationResult | null = null;

/**
 * Get cached validation result
 * Use this in hot paths to avoid repeated env var lookups
 */
export function getCachedLicenseResult(): LicenseValidationResult {
  if (!cachedResult) {
    cachedResult = validateRaasLicense();
  }
  return cachedResult;
}

/**
 * Clear cached result (for testing or license refresh)
 */
export function clearCachedLicenseResult(): void {
  cachedResult = null;
}
