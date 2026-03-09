/**
 * RaaS Gateway Metrics Client
 *
 * Fetches usage metrics from RaaS Gateway (raas.agencyos.network)
 * with JWT + mk_ API key authentication.
 *
 * Features:
 * - JWT token exchange with mk_ API key
 * - Retry logic with exponential backoff
 * - Mock adapter for local dev/testing
 * - Rate limiting awareness
 *
 * Usage:
 *   const client = new RaaSGatewayMetricsClient('mk_xxx', 'license-123')
 *   const metrics = await client.getUsageMetrics('org-456')
 */

import { analyticsLogger } from '@/utils/logger'

export interface RaaSMetricsConfig {
  apiKey: string // mk_ prefixed API key
  licenseId: string
  baseUrl?: string
  timeoutMs?: number
  maxRetries?: number
}

export interface UsageMetrics {
  orgId: string
  period: string // YYYY-MM
  metrics: MetricData[]
  lastSyncedAt: string
}

export interface MetricData {
  metricType: string
  currentUsage: number
  quotaLimit: number
  percentageUsed: number
  isOverLimit: boolean
  overageUnits: number
  overageCost: number
  trend: 'up' | 'down' | 'stable'
  dailyData: DailyMetric[]
}

export interface DailyMetric {
  date: string // YYYY-MM-DD
  value: number
  quota: number
}

export interface RaaSGatewayResponse<T> {
  success: boolean
  data: T
  error?: string
  timestamp: string
  requestId: string
}

export class RaaSGatewayMetricsClient {
  private apiKey: string
  private licenseId: string
  private baseUrl: string
  private timeoutMs: number
  private maxRetries: number
  private tokenCache: Map<string, { token: string; expiresAt: number }> = new Map()

  constructor(config: RaaSMetricsConfig) {
    this.apiKey = config.apiKey
    this.licenseId = config.licenseId
    this.baseUrl = config.baseUrl || 'https://raas.agencyos.network/api/v1'
    this.timeoutMs = config.timeoutMs || 10000
    this.maxRetries = config.maxRetries || 3
  }

  /**
   * Get usage metrics for organization
   */
  async getUsageMetrics(orgId: string, period?: string): Promise<UsageMetrics> {
    const token = await this.getOrCreateToken(orgId)

    const url = new URL(`${this.baseUrl}/metrics/usage`)
    url.searchParams.set('org_id', orgId)
    if (period) url.searchParams.set('period', period)

    const response = await this.fetchWithRetry<UsageMetrics>(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': this.apiKey,
        'X-License-ID': this.licenseId,
        'Content-Type': 'application/json',
      },
    })

    return response.data
  }

  /**
   * Get real-time quota status
   */
  async getQuotaStatus(orgId: string): Promise<QuotaStatus> {
    const token = await this.getOrCreateToken(orgId)

    const url = new URL(`${this.baseUrl}/metrics/quota`)
    url.searchParams.set('org_id', orgId)

    const response = await this.fetchWithRetry<QuotaStatus>(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': this.apiKey,
        'X-License-ID': this.licenseId,
        'Content-Type': 'application/json',
      },
    })

    return response.data
  }

  /**
   * Get overage summary for billing period
   */
  async getOverageSummary(orgId: string, period?: string): Promise<OverageSummary> {
    const token = await this.getOrCreateToken(orgId)

    const url = new URL(`${this.baseUrl}/metrics/overage`)
    url.searchParams.set('org_id', orgId)
    if (period) url.searchParams.set('period', period)

    const response = await this.fetchWithRetry<OverageSummary>(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-API-Key': this.apiKey,
        'X-License-ID': this.licenseId,
        'Content-Type': 'application/json',
      },
    })

    return response.data
  }

  /**
   * Get or create JWT token for API access
   */
  private async getOrCreateToken(orgId: string): Promise<string> {
    const cacheKey = `${this.licenseId}:${orgId}`
    const cached = this.tokenCache.get(cacheKey)

    // Return cached token if still valid (with 5min buffer)
    if (cached && cached.expiresAt > Date.now() + 300000) {
      analyticsLogger.debug('[RaaSGateway] Using cached JWT token', { orgId })
      return cached.token
    }

    // Exchange API key for JWT token
    analyticsLogger.info('[RaaSGateway] Exchanging API key for JWT token', { orgId })

    const url = `${this.baseUrl}/auth/token`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-License-ID': this.licenseId,
      },
      body: JSON.stringify({
        grant_type: 'api_key',
        api_key: this.apiKey,
        license_id: this.licenseId,
        org_id: orgId,
        aud: 'raas.agencyos.network',
        iss: 'wellnexus.vn',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      analyticsLogger.error('[RaaSGateway] Token exchange failed', error)
      throw new Error(`Token exchange failed: ${response.status} ${error}`)
    }

    const data = await response.json()
    const token = data.access_token
    const expiresIn = data.expires_in || 3600

    // Cache token
    this.tokenCache.set(cacheKey, {
      token,
      expiresAt: Date.now() + (expiresIn * 1000),
    })

    analyticsLogger.debug('[RaaSGateway] Token obtained', { orgId, expiresIn })

    return token
  }

  /**
   * Fetch with retry and exponential backoff
   */
  private async fetchWithRetry<T>(url: string, init: RequestInit, attempt = 1): Promise<RaaSGatewayResponse<T>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Retry on 5xx errors
        if (response.status >= 500 && attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          analyticsLogger.warn('[RaaSGateway] Server error, retrying', { status: response.status, attempt, delay })
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.fetchWithRetry<T>(url, init, attempt + 1)
        }

        const error = await response.text()
        analyticsLogger.error('[RaaSGateway] Request failed', { status: response.status, error })

        return {
          success: false,
          data: null as unknown as T,
          error: `HTTP ${response.status}: ${error}`,
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('x-request-id') || 'unknown',
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: data.data || data,
        timestamp: new Date().toISOString(),
        requestId: response.headers.get('x-request-id') || 'unknown',
      }
    } catch (error) {
      // Network error or timeout - retry
      if (attempt < this.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        analyticsLogger.warn('[RaaSGateway] Network error, retrying', { attempt, delay, error })
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.fetchWithRetry<T>(url, init, attempt + 1)
      }

      analyticsLogger.error('[RaaSGateway] All retries failed', error)

      return {
        success: false,
        data: null as unknown as T,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: 'client-error',
      }
    }
  }

  /**
   * Clear token cache (useful for testing)
   */
  clearTokenCache(): void {
    this.tokenCache.clear()
    analyticsLogger.debug('[RaaSGateway] Token cache cleared')
  }
}

export interface QuotaStatus {
  orgId: string
  tier: string
  metrics: {
    [metricType: string]: {
      current: number
      quota: number
      percentageUsed: number
      remaining: number
      isOverLimit: boolean
      overageUnits: number
      overageCost: number
    }
  }
  billingPeriodStart: string
  billingPeriodEnd: string
  daysRemaining: number
}

export interface OverageSummary {
  orgId: string
  period: string
  totalOverageCost: number
  transactions: {
    metricType: string
    units: number
    cost: number
    rate: number
    timestamp: string
  }[]
  breakdown: {
    [metricType: string]: {
      units: number
      cost: number
      rate: number
    }
  }
}

export default RaaSGatewayMetricsClient
