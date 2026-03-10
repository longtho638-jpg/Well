/**
 * RaaS Gateway Client - Phase 6.2
 *
 * Client for communicating with RaaS Gateway Worker for license validation.
 * Implements caching layer to reduce latency and gateway load.
 *
 * Features:
 * - LRU cache with configurable TTL
 * - Graceful degradation on gateway errors
 * - Automatic retry with exponential backoff
 *
 * Usage:
 *   const client = new RaasGatewayClient()
 *   const result = await client.validateLicenseKey('raas_premium_xxx')
 */

import type {
  LicenseEnforcementResult,
  LicenseCacheEntry,
  RaasGatewayResponse,
} from '@/types/license-enforcement'

export interface RaasGatewayClientOptions {
  /** Gateway base URL (default: from env or production) */
  gatewayUrl?: string
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTtlMs?: number
  /** Maximum cache size (default: 100 entries) */
  maxCacheSize?: number
  /** Enable fail-open mode (default: true) */
  failOpen?: boolean
  /** Request timeout in ms (default: 5000) */
  timeoutMs?: number
  /** Max retry attempts (default: 3) */
  maxRetries?: number
}

export class RaasGatewayClient {
  private cache: Map<string, LicenseCacheEntry>
  private readonly options: Required<RaasGatewayClientOptions>

  constructor(options: RaasGatewayClientOptions = {}) {
    this.cache = new Map()
    this.options = {
      gatewayUrl:
        options.gatewayUrl ||
        (import.meta.env.VITE_RAAS_GATEWAY_URL as string) ||
        'https://raas.agencyos.network',
      cacheTtlMs: options.cacheTtlMs || 5 * 60 * 1000, // 5 minutes
      maxCacheSize: options.maxCacheSize || 100,
      failOpen: options.failOpen !== false,
      timeoutMs: options.timeoutMs || 5000,
      maxRetries: options.maxRetries || 3,
    }
  }

  /**
   * Validate a license key against RaaS Gateway
   *
   * @param licenseKey - The license key to validate
   * @param options - Optional validation options
   * @returns LicenseEnforcementResult with validation status
   */
  async validateLicenseKey(
    licenseKey: string,
    options?: {
      orgId?: string
      userId?: string
      skipCache?: boolean
    }
  ): Promise<LicenseEnforcementResult> {
    const { orgId, userId, skipCache = false } = options || {}

    // Check cache first (unless skipped)
    if (!skipCache) {
      const cached = this.getFromCache(licenseKey)
      if (cached) {
        return cached
      }
    }

    // Call RaaS Gateway
    const result = await this.callGateway(licenseKey, { orgId, userId })

    // Cache the result
    this.addToCache(licenseKey, result)

    return result
  }

  /**
   * Validate multiple license keys in batch
   *
   * @param licenseKeys - Array of license keys to validate
   * @returns Map of license keys to validation results
   */
  async validateBatch(
    licenseKeys: string[]
  ): Promise<Map<string, LicenseEnforcementResult>> {
    const results = new Map<string, LicenseEnforcementResult>()

    // Validate each key (could be optimized with batch endpoint)
    for (const key of licenseKeys) {
      try {
        const result = await this.validateLicenseKey(key)
        results.set(key, result)
      } catch (error) {
        console.error('[RaasGatewayClient] Batch validation error:', error)
        results.set(key, {
          isValid: false,
          status: 'invalid',
        })
      }
    }

    return results
  }

  /**
   * Clear the cache (for testing or manual invalidation)
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Invalidate a specific cache entry
   *
   * @param key - The cache key to invalidate
   */
  invalidateCacheEntry(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hits: number; misses: number } {
    const now = Date.now()
    const validEntries = Array.from(this.cache.values()).filter(
      (entry) => entry.expiry > now
    )
    return {
      size: validEntries.length,
      hits: 0, // Could track hits/misses if needed
      misses: 0,
    }
  }

  /**
   * Get result from cache if valid
   */
  private getFromCache(key: string): LicenseEnforcementResult | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now >= entry.expiry) {
      // Entry expired
      this.cache.delete(key)
      return null
    }

    return entry.result
  }

  /**
   * Add result to cache with LRU eviction
   */
  private addToCache(key: string, result: LicenseEnforcementResult): void {
    const now = Date.now()

    // Evict oldest if at capacity
    if (this.cache.size >= this.options.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      key,
      result,
      expiry: now + this.options.cacheTtlMs,
    })
  }

  /**
   * Call RaaS Gateway with retry logic
   */
  private async callGateway(
    licenseKey: string,
    options: { orgId?: string; userId?: string }
  ): Promise<LicenseEnforcementResult> {
    const { orgId, userId } = options
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.options.timeoutMs
        )

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'WellNexus/1.0',
        }

        if (orgId) {
          headers['X-Org-ID'] = orgId
        }

        if (userId) {
          headers['X-User-ID'] = userId
        }

        const response = await fetch(
          `${this.options.gatewayUrl}/v1/validate-license`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ licenseKey }),
            signal: controller.signal,
          }
        )

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.error || `Gateway error: ${response.status}`
          )
        }

        const data: RaasGatewayResponse = await response.json()

        // Transform gateway response to enforcement result
        return {
          isValid: data.isValid,
          licenseKey,
          tier: (data.tier as LicenseEnforcementResult['tier']) || 'basic',
          features: data.features,
          expiresAt: data.expiresAt,
          daysRemaining: data.daysRemaining,
          status: this.determineStatus(data),
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(
          `[RaasGatewayClient] Attempt ${attempt} failed:`,
          lastError.message
        )

        // Don't retry on client errors (4xx)
        if (
          lastError.message.includes('400') ||
          lastError.message.includes('401') ||
          lastError.message.includes('403')
        ) {
          break
        }

        // Exponential backoff for retries
        if (attempt < this.options.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    // All retries failed - fail open or return error
    if (this.options.failOpen) {
      console.warn(
        '[RaasGatewayClient] Gateway unavailable, failing open:',
        lastError?.message
      )
      return {
        isValid: true, // Allow request in fail-open mode
        licenseKey,
        status: 'active',
        tier: 'basic',
        features: {},
      }
    }

    // Fail closed - return error result
    return {
      isValid: false,
      licenseKey,
      status: 'invalid',
      suspensionReason: lastError?.message || 'Gateway communication failed',
    }
  }

  /**
   * Determine license status from gateway response
   */
  private determineStatus(data: RaasGatewayResponse): LicenseEnforcementResult['status'] {
    if (!data.isValid) {
      return 'revoked'
    }

    if (data.expiresAt) {
      const now = Date.now()
      const expiresAt =
        typeof data.expiresAt === 'string'
          ? new Date(data.expiresAt).getTime()
          : data.expiresAt

      if (now > expiresAt) {
        return 'expired'
      }
    }

    return 'active'
  }
}

/**
 * Default client instance for common usage
 */
export const raasGatewayClient = new RaasGatewayClient()

export default RaasGatewayClient
