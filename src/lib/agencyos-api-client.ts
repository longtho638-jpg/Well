/**
 * AgencyOS Internal API Client - Phase 6
 *
 * Client for communicating with AgencyOS dashboard internal APIs.
 * Handles JWT authentication, request signing, and response parsing.
 *
 * Features:
 * - JWT-based authentication
 * - Automatic token refresh
 * - Request retry with exponential backoff
 * - Idempotency key generation
 * - Response caching
 *
 * Usage:
 *   const client = new AgencyOSClient()
 *   await client.updatePlanEntitlements('org-123', entitlements)
 */

import { analyticsLogger } from '@/utils/logger'
import { GatewayAuthClient } from '@/lib/gateway-auth-client'

/**
 * Get environment variable (Node/browser)
 */
function getEnvVar(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }
  return undefined
}

export interface Entitlements {
  plan_id: string
  plan_name: string
  features: Record<string, unknown>
  quota_limits: Record<string, number>
  overage_rates: Record<string, number>
  effective_date: string
  expiry_date?: string
}

export interface PlanEntitlementsPayload {
  org_id: string
  entitlements: Entitlements
  sync_timestamp: string
}

export interface AgencyOSResponse {
  success: boolean
  data?: unknown
  error?: string
  message?: string
}

export interface AgencyOSClientOptions {
  baseUrl?: string
  apiKey?: string
  timeoutMs?: number
  maxRetries?: number
}

export class AgencyOSClient {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly timeoutMs: number
  private readonly maxRetries: number
  private authClient?: GatewayAuthClient
  private tokenCache?: { token: string; expiresAt: number }
  private readonly JWT_ISSUER = 'wellnexus.vn'
  private readonly JWT_AUDIENCE = 'agencyos.network'

  constructor(options: AgencyOSClientOptions = {}) {
    this.baseUrl =
      options.baseUrl ||
      getEnvVar('AGENCYOS_API_URL') ||
      'https://agencyos.network/api/internal'

    this.apiKey =
      options.apiKey ||
      getEnvVar('AGENCYOS_API_KEY') ||
      ''

    this.timeoutMs = options.timeoutMs || 10000
    this.maxRetries = options.maxRetries || 3

    if (!this.apiKey) {
      analyticsLogger.warn('[AgencyOSClient] AGENCYOS_API_KEY not configured')
    }
  }

  /**
   * Push plan entitlements to AgencyOS dashboard
   *
   * @param orgId - Organization ID
   * @param entitlements - Plan entitlements to sync
   * @returns AgencyOS response
   */
  async updatePlanEntitlements(
    orgId: string,
    entitlements: Entitlements
  ): Promise<AgencyOSResponse> {
    try {
      analyticsLogger.info('[AgencyOSClient] Updating plan entitlements', {
        orgId,
        planId: entitlements.plan_id,
      })

      // Get JWT auth token
      const token = await this.getAuthToken(orgId)

      // Prepare payload
      const payload: PlanEntitlementsPayload = {
        org_id: orgId,
        entitlements,
        sync_timestamp: new Date().toISOString(),
      }

      // Generate idempotency key
      const idempotencyKey = this.generateIdempotencyKey(orgId, entitlements.plan_id)

      // Make API call with retry logic
      const response = await this.makeRequest(
        '/plan/entitlements',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(payload),
        },
        'updatePlanEntitlements'
      )

      analyticsLogger.info('[AgencyOSClient] Plan entitlements updated', {
        orgId,
        success: response.success,
      })

      return response
    } catch (error) {
      analyticsLogger.error('[AgencyOSClient] updatePlanEntitlements error', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get plan entitlements for an organization
   *
   * @param orgId - Organization ID
   * @returns Current entitlements or null
   */
  async getPlanEntitlements(orgId: string): Promise<Entitlements | null> {
    try {
      const token = await this.getAuthToken(orgId)

      const response = await this.makeRequest(
        `/plan/entitlements/${orgId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
        'getPlanEntitlements'
      )

      if (response.success && response.data) {
        return response.data as Entitlements
      }

      return null
    } catch (error) {
      analyticsLogger.error('[AgencyOSClient] getPlanEntitlements error', error)
      return null
    }
  }

  /**
   * Revoke plan entitlements (e.g., on subscription cancellation)
   *
   * @param orgId - Organization ID
   * @param reason - Revocation reason
   * @returns AgencyOS response
   */
  async revokePlanEntitlements(
    orgId: string,
    reason: string
  ): Promise<AgencyOSResponse> {
    try {
      const token = await this.getAuthToken(orgId)

      const response = await this.makeRequest(
        `/plan/entitlements/${orgId}/revoke`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            org_id: orgId,
            reason,
            revoked_at: new Date().toISOString(),
          }),
        },
        'revokePlanEntitlements'
      )

      analyticsLogger.info('[AgencyOSClient] Plan entitlements revoked', {
        orgId,
        reason,
      })

      return response
    } catch (error) {
      analyticsLogger.error('[AgencyOSClient] revokePlanEntitlements error', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Sync usage data to AgencyOS
   *
   * @param orgId - Organization ID
   * @param usageData - Usage metrics to sync
   * @returns AgencyOS response
   */
  async syncUsageData(
    orgId: string,
    usageData: Record<string, number>
  ): Promise<AgencyOSResponse> {
    try {
      const token = await this.getAuthToken(orgId)

      const response = await this.makeRequest(
        '/usage/sync',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            org_id: orgId,
            usage: usageData,
            sync_timestamp: new Date().toISOString(),
          }),
        },
        'syncUsageData'
      )

      return response
    } catch (error) {
      analyticsLogger.error('[AgencyOSClient] syncUsageData error', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get organization status from AgencyOS
   *
   * @param orgId - Organization ID
   * @returns Organization status
   */
  async getOrganizationStatus(orgId: string): Promise<{
    active: boolean
    plan_id?: string
    suspended?: boolean
    suspension_reason?: string
  } | null> {
    try {
      const token = await this.getAuthToken(orgId)

      const response = await this.makeRequest(
        `/org/${orgId}/status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
        'getOrganizationStatus'
      )

      if (response.success && response.data) {
        return response.data as {
          active: boolean
          plan_id?: string
          suspended?: boolean
          suspension_reason?: string
        }
      }

      return null
    } catch (error) {
      analyticsLogger.error('[AgencyOSClient] getOrganizationStatus error', error)
      return null
    }
  }

  /**
   * Get JWT auth token for API calls
   */
  private async getAuthToken(orgId: string): Promise<string> {
    try {
      // Return cached token if still valid
      if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 60000) {
        return this.tokenCache.token
      }

      // Initialize auth client if needed
      if (!this.authClient) {
        this.authClient = new GatewayAuthClient({
          issuer: this.JWT_ISSUER,
          audience: this.JWT_AUDIENCE,
          apiKey: this.apiKey,
          tokenExpirySeconds: 3600, // 1 hour
        })
      }

      // Get valid token (generates new or returns cached)
      const authResult = await this.authClient.getValidToken(orgId)

      // Cache the token
      this.tokenCache = {
        token: authResult.token,
        expiresAt: authResult.expiresAt,
      }

      return authResult.token
    } catch (error) {
      analyticsLogger.error('[AgencyOSClient] getAuthToken error', error)
      throw new Error('Failed to get auth token')
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    path: string,
    options: RequestInit,
    operation: string
  ): Promise<AgencyOSResponse> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

        const url = `${this.baseUrl}${path}`
        analyticsLogger.debug('[AgencyOSClient] Making request', {
          url,
          operation,
          attempt,
        })

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Parse response
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        return data as AgencyOSResponse
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        analyticsLogger.warn('[AgencyOSClient] Request attempt failed', {
          operation,
          attempt,
          error: lastError.message,
        })

        // Don't retry on client errors (4xx)
        if (
          lastError.message.includes('400') ||
          lastError.message.includes('401') ||
          lastError.message.includes('403') ||
          lastError.message.includes('404')
        ) {
          break
        }

        // Exponential backoff
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    // All retries failed
    throw lastError || new Error('Request failed')
  }

  /**
   * Generate idempotency key for requests
   */
  private generateIdempotencyKey(orgId: string, planId: string): string {
    const timestamp = Math.floor(Date.now() / 1000 / 300) // 5-minute windows
    return `agencyos_${orgId}_${planId}_${timestamp}`
  }

  /**
   * Clear token cache (for testing)
   */
  clearTokenCache(): void {
    this.tokenCache = undefined
  }
}

export const agencyOSClient = new AgencyOSClient()

export default AgencyOSClient
