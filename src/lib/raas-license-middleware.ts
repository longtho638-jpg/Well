/**
 * License Validation Middleware - Phase 6.2
 *
 * Express/Edge middleware for validating RaaS license keys on API requests.
 * Intercepts requests, validates license via RaaS Gateway, and blocks invalid requests.
 *
 * Features:
 * - Extract API key from X-API-Key or Authorization header
 * - Validate license via RaaS Gateway Client
 * - Cache validation results (5-min TTL)
 * - Grace period support for expired licenses (24h)
 * - Feature gating support
 * - Fail-open mode when gateway is unavailable
 *
 * Usage:
 *   import { licenseValidationMiddleware, licenseDeniedResponse } from '@/lib/raas-license-middleware'
 *
 *   export async function GET(req: Request) {
 *     const result = await licenseValidationMiddleware(req)
 *     if (!result.allowed) {
 *       return licenseDeniedResponse(result)
 *     }
 *     // Continue with protected logic...
 *   }
 */

import {
  raasGatewayClient,
  type RaasGatewayClient,
} from '@/lib/raas-gateway-client'
import type {
  LicenseEnforcementResult,
  LicenseMiddlewareResult,
  LicenseMiddlewareOptions,
} from '@/types/license-enforcement'
import {
  checkSuspensionStatus,
  type SuspensionStatus,
  logSuspensionEvent,
} from '@/lib/raas-suspension-logic'
import {
  build403Response,
  type get403Message,
} from '@/lib/raas-403-response'
import { raasAnalyticsEvents } from '@/lib/raas-analytics-events'
import { createLogger } from '@/utils/logger'

const logger = createLogger('LicenseMiddleware')

/**
 * Default grace period: 24 hours
 */
const DEFAULT_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000

/**
 * Extract API key from request headers
 * Checks X-API-Key first, then Authorization Bearer token
 */
function extractApiKey(request: Request): string | null {
  // Try X-API-Key header first
  const apiKeyHeader = request.headers.get('X-API-Key')
  if (apiKeyHeader && apiKeyHeader.trim()) {
    return apiKeyHeader.trim()
  }

  // Try Authorization Bearer token
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim()
    if (token) {
      return token
    }
  }

  return null
}

/**
 * Check if license is within grace period after expiration
 *
 * @param license - The license to check
 * @param gracePeriodMs - Grace period duration (default: 24 hours)
 * @returns true if within grace period
 */
export function isInGracePeriod(
  license: LicenseEnforcementResult,
  gracePeriodMs: number = DEFAULT_GRACE_PERIOD_MS
): boolean {
  if (!license.expiresAt) {
    return false
  }

  const now = Date.now()
  const expiresAt =
    typeof license.expiresAt === 'string'
      ? new Date(license.expiresAt).getTime()
      : license.expiresAt

  // Check if expired but within grace period
  const timeSinceExpiry = now - expiresAt
  return timeSinceExpiry > 0 && timeSinceExpiry < gracePeriodMs
}

/**
 * License validation middleware for API routes
 *
 * @param request - The incoming HTTP request
 * @param options - Optional middleware configuration
 * @param client - Optional RaaS Gateway client (uses default if not provided)
 * @returns LicenseMiddlewareResult with validation outcome
 */
export async function licenseValidationMiddleware(
  request: Request,
  options: LicenseMiddlewareOptions & {
    /** Locale for i18n messages (default: 'en') */
    locale?: 'vi' | 'en'
    /** Org ID for billing checks (extracted from license if not provided) */
    orgId?: string
  } = {},
  client: RaasGatewayClient = raasGatewayClient
): Promise<LicenseMiddlewareResult> {
  const {
    requireFeature,
    enableGracePeriod = true,
    gracePeriodMs = DEFAULT_GRACE_PERIOD_MS,
    failOpen = true,
    locale = 'en',
    orgId,
  } = options

  const url = new URL(request.url)
  const path = url.pathname
  const startTime = Date.now()

  // Extract API key from headers
  const apiKey = extractApiKey(request)

  if (!apiKey) {
    return {
      allowed: false,
      error: 'API key required. Provide X-API-Key or Authorization Bearer token.',
      statusCode: 401,
    }
  }

  try {
    // Validate license via RaaS Gateway Client
    const license = await client.validateLicenseKey(apiKey, {
      skipCache: false,
    })

    const responseTime = Date.now() - startTime

    // Emit license validation event
    await raasAnalyticsEvents.emitLicenseValidated({
      org_id: orgId || license.licenseKey || 'unknown',
      license_key: apiKey.substring(0, 12) + '...',
      valid: license.isValid,
      tier: license.tier,
      source: 'api',
      response_time_ms: responseTime,
      cached: false, // Could add cache detection logic here
      path,
    })

    // Check if license is valid
    if (!license.isValid) {
      // Emit license expired/revoked event
      await raasAnalyticsEvents.emitLicenseExpired({
        org_id: orgId || license.licenseKey || 'unknown',
        license_key: apiKey.substring(0, 12) + '...',
        tier: license.tier,
      })

      return {
        allowed: false,
        license,
        error: `License ${license.status}: ${license.suspensionReason || 'Invalid license key'}`,
        statusCode: 403,
        suspensionStatus: {
          shouldSuspend: true,
          reason: 'license_revoked',
          message: license.suspensionReason || 'Invalid license',
          daysPastDue: 0,
          amountOwed: 0,
          subscriptionStatus: 'none',
          adminBypassAvailable: false,
        },
      }
    }

    // Check if license is expired (but not in grace period)
    if (license.status === 'expired') {
      if (enableGracePeriod && isInGracePeriod(license, gracePeriodMs)) {
        // Allow but log warning
        logger.warn('Expired license in grace period', {
          licenseKey: apiKey.substring(0, 8) + '...',
          expiresAt: license.expiresAt,
          gracePeriodHours: gracePeriodMs / (1000 * 60 * 60),
        })

        // Emit subscription warning
        await raasAnalyticsEvents.emitSubscriptionWarning({
          org_id: orgId || license.licenseKey || 'unknown',
          warning_type: 'approaching_limit',
          days_remaining: license.daysRemaining,
          path,
        })

        return { allowed: true, license }
      }

      // Emit license expired event
      await raasAnalyticsEvents.emitLicenseExpired({
        org_id: orgId || license.licenseKey || 'unknown',
        license_key: apiKey.substring(0, 12) + '...',
        tier: license.tier,
        days_expired: license.daysRemaining ? Math.abs(license.daysRemaining) : undefined,
      })

      return {
        allowed: false,
        license,
        error: `License expired ${license.daysRemaining ? Math.abs(license.daysRemaining) + ' days ago' : ''}`,
        statusCode: 403,
        suspensionStatus: {
          shouldSuspend: true,
          reason: 'license_expired',
          message: 'License has expired',
          daysPastDue: 0,
          amountOwed: 0,
          subscriptionStatus: 'none',
          adminBypassAvailable: false,
        },
      }
    }

    // Check if license is revoked
    if (license.status === 'revoked') {
      // Emit license expired event
      await raasAnalyticsEvents.emitLicenseExpired({
        org_id: orgId || license.licenseKey || 'unknown',
        license_key: apiKey.substring(0, 12) + '...',
        tier: license.tier,
      })

      return {
        allowed: false,
        license,
        error: 'License has been revoked',
        statusCode: 403,
        suspensionStatus: {
          shouldSuspend: true,
          reason: 'license_revoked',
          message: 'License has been revoked',
          daysPastDue: 0,
          amountOwed: 0,
          subscriptionStatus: 'none',
          adminBypassAvailable: false,
        },
      }
    }

    // Check required feature if specified
    if (requireFeature) {
      const hasFeature = license.features?.[requireFeature] || false
      if (!hasFeature) {
        return {
          allowed: false,
          license,
          error: `Feature '${requireFeature}' not available in ${license.tier || 'your'} tier`,
          statusCode: 403,
        }
      }
    }

    // Check billing suspension status if orgId is available
    const targetOrgId = orgId || license.licenseKey // Use licenseKey as fallback identifier
    if (targetOrgId) {
      const suspensionStatus = await checkSuspensionStatus(targetOrgId, license)

      if (suspensionStatus.shouldSuspend && !suspensionStatus.adminBypassAvailable) {
        // Log suspension event with analytics emission
        await logSuspensionEvent(targetOrgId, null, suspensionStatus, path)

        return {
          allowed: false,
          license,
          error: suspensionStatus.message,
          statusCode: 403,
          suspensionStatus,
        }
      }

      // Log grace period warning
      if (suspensionStatus.gracePeriodRemainingHours && suspensionStatus.gracePeriodRemainingHours > 0) {
        logger.warn('Subscription in grace period', {
          orgId: targetOrgId,
          gracePeriodHours: suspensionStatus.gracePeriodRemainingHours,
          amountOwed: suspensionStatus.amountOwed,
        })

        // Emit subscription warning
        await raasAnalyticsEvents.emitSubscriptionWarning({
          org_id: targetOrgId,
          warning_type: 'past_due',
          days_remaining: Math.floor(suspensionStatus.gracePeriodRemainingHours / 24),
          amount_owed: suspensionStatus.amountOwed,
          dunning_stage: suspensionStatus.dunningStage,
          path,
        })
      }
    }

    // All checks passed
    return {
      allowed: true,
      license,
    }
  } catch (error) {
    logger.error('Validation error', { error })

    // Fail open or closed based on configuration
    if (failOpen) {
      logger.warn('Gateway error, failing open', {
        error: error instanceof Error ? error.message : String(error),
      })
      return {
        allowed: true,
        license: {
          isValid: true,
          licenseKey: apiKey,
          status: 'active',
          tier: 'basic',
          features: {},
        },
      }
    }

    // Fail closed - block request
    return {
      allowed: false,
      error: 'License validation service unavailable',
      statusCode: 500,
      retryAfter: 60, // Suggest retry after 1 minute
    }
  }
}

/**
 * Create HTTP 403 response for license denied requests
 *
 * @param result - The middleware result (should have allowed: false)
 * @param locale - Locale for i18n messages (default: 'en')
 * @returns HTTP Response with 403 status and JSON error body
 */
export function licenseDeniedResponse(
  result: LicenseMiddlewareResult,
  locale: 'vi' | 'en' = 'en'
): Response {
  // Use suspension-aware 403 response if available
  if (result.suspensionStatus) {
    return build403Response(result.suspensionStatus, locale)
  }

  // Fallback to legacy response format
  return new Response(
    JSON.stringify({
      error: 'license_denied',
      message: result.error || 'License validation failed',
      details: {
        license: result.license
          ? {
              status: result.license.status,
              tier: result.license.tier,
              expiresAt: result.license.expiresAt,
              daysRemaining: result.license.daysRemaining,
            }
          : null,
      },
      upgrade_url: '/dashboard/license',
    }),
    {
      status: result.statusCode || 403,
      headers: {
        'Content-Type': 'application/json',
        'X-License-Status': result.license?.status || 'unknown',
        'X-License-Tier': result.license?.tier || 'unknown',
        ...(result.retryAfter
          ? { 'Retry-After': String(result.retryAfter) }
          : {}),
      },
    }
  )
}

/**
 * Create HTTP 401 response for missing API key
 */
export function apiKeyMissingResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'api_key_required',
      message:
        'Please provide your API key via X-API-Key or Authorization Bearer header',
      documentation_url: '/docs/api/authentication',
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

/**
 * Middleware wrapper for route handlers
 *
 * Usage:
 *   export const GET = withLicenseCheck(async (req) => {
 *     // Protected handler logic
 *     return Response.json({ data: 'protected' })
 *   })
 */
export function withLicenseCheck<
  T extends (request: Request) => Promise<Response>,
>(
  handler: T,
  options?: LicenseMiddlewareOptions
): T {
  return (async (request: Request) => {
    const result = await licenseValidationMiddleware(request, options)

    if (!result.allowed) {
      return licenseDeniedResponse(result)
    }

    // Add license info to request headers for downstream use
    const newRequest = new Request(request)
    if (result.license) {
      newRequest.headers.set('X-License-Tier', result.license.tier || 'basic')
      newRequest.headers.set(
        'X-License-Status',
        result.license.status || 'unknown'
      )
    }

    return handler(newRequest)
  }) as T
}

/**
 * Check if a specific feature is available
 *
 * @param license - The license to check
 * @param feature - The feature name to check
 * @returns true if feature is available
 */
export function hasFeature(
  license: LicenseEnforcementResult,
  feature: string
): boolean {
  return license.features?.[feature] || false
}

/**
 * Export middleware components
 */
export const raasLicenseMiddleware = {
  licenseValidationMiddleware,
  licenseDeniedResponse,
  apiKeyMissingResponse,
  withLicenseCheck,
  hasFeature,
  isInGracePeriod,
  extractApiKey,
}

export default raasLicenseMiddleware
