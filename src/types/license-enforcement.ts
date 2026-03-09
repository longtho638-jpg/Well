/**
 * License Enforcement Types - Phase 6.2
 *
 * Types for license validation middleware and enforcement logic.
 * Used by RaaS Gateway integration for quota + license checks.
 */

/**
 * Result of license validation from RaaS Gateway
 */
export interface LicenseEnforcementResult {
  /** Whether the license is currently valid */
  isValid: boolean
  /** The license key that was validated */
  licenseKey?: string
  /** License tier: basic, premium, enterprise, master */
  tier?: 'basic' | 'premium' | 'enterprise' | 'master'
  /** Feature flags available for this license */
  features?: Record<string, boolean>
  /** Expiration timestamp (ms since epoch) */
  expiresAt?: number | string
  /** Days remaining until expiration */
  daysRemaining?: number
  /** Current license status */
  status: 'active' | 'expired' | 'revoked' | 'invalid' | 'pending_revocation'
  /** Suspension timestamp if applicable */
  suspendedAt?: string
  /** Reason for suspension if applicable */
  suspensionReason?: string
}

/**
 * Result of license middleware validation
 */
export interface LicenseMiddlewareResult {
  /** Whether the request is allowed to proceed */
  allowed: boolean
  /** License validation result if available */
  license?: LicenseEnforcementResult
  /** Error message if validation failed */
  error?: string
  /** HTTP status code to return if not allowed */
  statusCode?: 401 | 403 | 500
  /** Retry-After header value (seconds) */
  retryAfter?: number
  /** Suspension status if request was blocked due to billing/license */
  suspensionStatus?: import('@/lib/raas-suspension-logic').SuspensionStatus
}

/**
 * Cache entry for license validation results
 */
export interface LicenseCacheEntry {
  /** The cached validation result */
  result: LicenseEnforcementResult
  /** Cache expiry timestamp (ms since epoch) */
  expiry: number
  /** Cache key (license key or API key) */
  key: string
}

/**
 * Options for license validation middleware
 */
export interface LicenseMiddlewareOptions {
  /** Require a specific feature to be enabled */
  requireFeature?: string
  /** Enable grace period for expired licenses (default: true) */
  enableGracePeriod?: boolean
  /** Grace period duration in ms (default: 24 hours) */
  gracePeriodMs?: number
  /** Fail open on gateway errors (default: true) */
  failOpen?: boolean
}

/**
 * RaaS Gateway validation response
 */
export interface RaasGatewayResponse {
  /** Validation result */
  isValid: boolean
  /** License tier */
  tier: string
  /** Feature flags */
  features: Record<string, boolean>
  /** Expiration timestamp */
  expiresAt?: number
  /** Days remaining */
  daysRemaining?: number
  /** Status message */
  message?: string
  /** Error if validation failed */
  error?: string
}
