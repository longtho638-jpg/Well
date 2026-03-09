/**
 * License Validation Handler
 *
 * Handles license validation requests with KV caching.
 * Extracted from main index.ts for better organization.
 */

export interface ValidateLicenseRequest {
  licenseKey: string
  mkApiKey?: string
  orgId?: string
}

export interface ValidateLicenseResponse {
  isValid: boolean
  tier: string
  status: 'active' | 'revoked' | 'expired' | 'suspension'
  features: Record<string, boolean>
  expiresAt?: string
  daysRemaining?: number
  message?: string
  cached?: boolean
}

/**
 * Validate license key format
 */
export function isValidLicenseFormat(licenseKey: string): boolean {
  // Expected format: RAAS-XXXXX-XXXXX-XXXXX or similar
  return /^RAAS-[A-Z0-9]{4,}(-[A-Z0-9]{4,})*$/i.test(licenseKey)
}

/**
 * Build cache key for license
 */
export function getCacheKey(licenseKey: string): string {
  return `license:${licenseKey.toLowerCase()}`
}

/**
 * Check if cached result is still valid
 */
export function isCacheValid(cached: ValidateLicenseResponse | null): boolean {
  if (!cached) return false
  // Cache validity handled by KV TTL
  return true
}
