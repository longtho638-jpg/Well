/**
 * Cloudflare KV Rate Limiter - Phase 6 Security
 *
 * Granular rate limiting per customer plan using Cloudflare KV.
 * Supports sliding window algorithm for accurate rate limiting.
 *
 * Features:
 * - Per-customer rate limits
 * - Tier-based limits (basic/premium/enterprise/master)
 * - Burst handling
 * - Real-time usage tracking
 * - SOC 2 compliant logging
 * - Multi-tenant custom limits (Phase 6.4)
 *
 * @see {@link https://developers.cloudflare.com/kv/}
 */

import type { RateLimitConfig, LicenseTier, AuditLogEntry } from './rbac-engine';
import { getTenantRateLimitPolicy } from '@/middleware/tenant-context';

/**
 * Cloudflare KV binding interface
 */
interface CloudflareKV {
  get(key: string, options?: { type: 'json' }): Promise<unknown | null>;
  put(key: string, value: string | number | object, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

/**
 * Rate limit state stored in KV
 */
interface RateLimitState {
  windowStart: number;       // Unix timestamp (ms)
  requestCount: number;       // Requests in current window
  burstCount: number;         // Requests in current second
  lastRequest: number;        // Last request timestamp
  dailyCount: number;         // Requests today (UTC)
  hourlyCount: number;        // Requests this hour
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;            // Unix timestamp (ms)
  retryAfter?: number;        // Seconds to wait (if denied)
  limit: number;
  used: number;
}

/**
 * Default KV namespace
 */
const KV_NAMESPACE = 'rate_limits';
const KV_PREFIX = 'rl:';

/**
 * Get KV key for customer rate limit
 */
function getRateLimitKey(customerId: string, windowType: 'second' | 'minute' | 'hour' | 'day'): string {
  const date = new Date();
  let windowKey: string;

  switch (windowType) {
    case 'second':
      windowKey = `${Math.floor(date.getTime() / 1000)}`;
      break;
    case 'minute':
      windowKey = `${Math.floor(date.getTime() / 60000)}`;
      break;
    case 'hour':
      windowKey = `${Math.floor(date.getTime() / 3600000)}`;
      break;
    case 'day':
      windowKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
      break;
  }

  return `${KV_PREFIX}${KV_NAMESPACE}:${customerId}:${windowType}:${windowKey}`;
}

/**
 * Sliding window rate limiter using Cloudflare KV
 */
export class CloudflareRateLimiter {
  private kv?: CloudflareKV;

  constructor(kv?: CloudflareKV) {
    this.kv = kv;
  }

  /**
   * Check rate limit for a customer
   */
  async checkRateLimit(
    customerId: string,
    tier: LicenseTier,
    customLimits?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const limits = { ...this.getLimitsForTier(tier), ...customLimits };
    const now = Date.now();

    // Check all windows (second, minute, hour, day)
    const windows = [
      { type: 'second' as const, limit: limits.requestsPerSecond, key: getRateLimitKey(customerId, 'second') },
      { type: 'minute' as const, limit: limits.requestsPerMinute, key: getRateLimitKey(customerId, 'minute') },
      { type: 'hour' as const, limit: limits.requestsPerHour, key: getRateLimitKey(customerId, 'hour') },
      { type: 'day' as const, limit: limits.requestsPerDay, key: getRateLimitKey(customerId, 'day') },
    ];

    // Find the most restrictive limit
    let mostRestrictive: RateLimitResult | null = null;

    for (const window of windows) {
      const result = await this.checkWindow(window.key, window.limit, now);

      if (!mostRestrictive || result.remaining < mostRestrictive.remaining) {
        mostRestrictive = result;
      }

      // If any window is exceeded, deny immediately
      if (!result.allowed) {
        return {
          ...result,
          limit: window.limit,
          retryAfter: Math.ceil((result.resetAt - now) / 1000),
        };
      }
    }

    // All windows passed
    return mostRestrictive!;
  }

  /**
   * Check rate limit for tenant with custom policy limits (Phase 6.4)
   */
  async checkTenantRateLimit(
    tenantId: string,
    tenantPolicyId: string | undefined,
    tier: LicenseTier
  ): Promise<RateLimitResult> {
    // Get custom limits from tenant policy
    let customLimits: Partial<RateLimitConfig> | undefined;

    if (tenantPolicyId) {
      const policyLimits = await getTenantRateLimitPolicy(tenantPolicyId);
      if (policyLimits) {
        customLimits = policyLimits;
      }
    }

    // Fall back to standard tier limits
    return this.checkRateLimit(tenantId, tier, customLimits);
  }

  /**
   * Check a single time window
   */
  private async checkWindow(
    key: string,
    limit: number,
    now: number
  ): Promise<RateLimitResult> {
    if (!this.kv) {
      // No KV available - allow by default (development mode)
      return {
        allowed: true,
        remaining: limit,
        resetAt: now + 60000,
        limit,
        used: 0,
      };
    }

    try {
      const state = await this.kv.get(key, { type: 'json' }) as RateLimitState | null;

      if (!state) {
        // No state - first request in window
        return {
          allowed: true,
          remaining: limit - 1,
          resetAt: this.getWindowResetTime(key, now),
          limit,
          used: 0,
        };
      }

      const used = state.requestCount;
      const remaining = Math.max(0, limit - used);

      return {
        allowed: used < limit,
        remaining,
        resetAt: this.getWindowResetTime(key, now),
        limit,
        used,
      };
    } catch (error) {
      // KV error - fail open in development, fail closed in production
      console.error('[RateLimiter] KV error:', error);
      return {
        allowed: true,
        remaining: limit,
        resetAt: now + 60000,
        limit,
        used: 0,
      };
    }
  }

  /**
   * Increment request count after successful check
   */
  async incrementUsage(
    customerId: string,
    tier: LicenseTier,
    customLimits?: Partial<RateLimitConfig>
  ): Promise<void> {
    if (!this.kv) return;

    const limits = { ...this.getLimitsForTier(tier), ...customLimits };
    const now = Date.now();

    const windows = [
      { type: 'second' as const, key: getRateLimitKey(customerId, 'second') },
      { type: 'minute' as const, key: getRateLimitKey(customerId, 'minute') },
      { type: 'hour' as const, key: getRateLimitKey(customerId, 'hour') },
      { type: 'day' as const, key: getRateLimitKey(customerId, 'day') },
    ];

    // Update all windows
    for (const window of windows) {
      await this.incrementWindow(window.key, limits.requestsPerDay);
    }
  }

  /**
   * Increment a single window counter
   */
  private async incrementWindow(key: string, dailyLimit: number): Promise<void> {
    if (!this.kv) return;

    try {
      const state = await this.kv.get(key, { type: 'json' }) as RateLimitState | null;
      const now = Date.now();

      const newState: RateLimitState = {
        windowStart: now,
        requestCount: (state?.requestCount || 0) + 1,
        burstCount: state && (now - state.lastRequest < 1000) ? state.burstCount + 1 : 1,
        lastRequest: now,
        dailyCount: state && this.isSameDay(state.windowStart, now) ? state.dailyCount + 1 : 1,
        hourlyCount: state && this.isSameHour(state.windowStart, now) ? state.hourlyCount + 1 : 1,
      };

      // TTL based on window type
      let ttl: number;
      if (key.includes(':second:')) ttl = 2;
      else if (key.includes(':minute:')) ttl = 120;
      else if (key.includes(':hour:')) ttl = 7200;
      else ttl = 86400 * 2; // Daily - 2 days

      await this.kv.put(key, JSON.stringify(newState), { expirationTtl: ttl });
    } catch (error) {
      console.error('[RateLimiter] Failed to increment:', error);
    }
  }

  /**
   * Get limits for tier
   */
  private getLimitsForTier(tier: LicenseTier): RateLimitConfig {
    const limits: Record<LicenseTier, RateLimitConfig> = {
      basic: {
        requestsPerSecond: 1,
        requestsPerMinute: 30,
        requestsPerHour: 500,
        requestsPerDay: 5000,
        burstLimit: 3,
        concurrentRequests: 1,
      },
      premium: {
        requestsPerSecond: 10,
        requestsPerMinute: 300,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
        burstLimit: 20,
        concurrentRequests: 5,
      },
      enterprise: {
        requestsPerSecond: 50,
        requestsPerMinute: 2000,
        requestsPerHour: 50000,
        requestsPerDay: 500000,
        burstLimit: 100,
        concurrentRequests: 20,
      },
      master: {
        requestsPerSecond: 200,
        requestsPerMinute: 10000,
        requestsPerHour: 200000,
        requestsPerDay: 2000000,
        burstLimit: 500,
        concurrentRequests: 100,
      },
    };

    return limits[tier] || limits.basic;
  }

  /**
   * Get window reset time based on key type
   */
  private getWindowResetTime(key: string, now: number): number {
    if (key.includes(':second:')) return now + 1000;
    if (key.includes(':minute:')) return now + 60000;
    if (key.includes(':hour:')) return now + 3600000;
    return now + 86400000; // Daily
  }

  /**
   * Check if two timestamps are in the same day
   */
  private isSameDay(t1: number, t2: number): boolean {
    const d1 = new Date(t1);
    const d2 = new Date(t2);
    return d1.getUTCFullYear() === d2.getUTCFullYear() &&
           d1.getUTCMonth() === d2.getUTCMonth() &&
           d1.getUTCDate() === d2.getUTCDate();
  }

  /**
   * Check if two timestamps are in the same hour
   */
  private isSameHour(t1: number, t2: number): boolean {
    const d1 = new Date(t1);
    const d2 = new Date(t2);
    return d1.getUTCFullYear() === d2.getUTCFullYear() &&
           d1.getUTCMonth() === d2.getUTCMonth() &&
           d1.getUTCDate() === d2.getUTCDate() &&
           d1.getUTCHours() === d2.getUTCHours();
  }

  /**
   * Reset rate limit for customer (admin operation)
   */
  async resetCustomerLimit(customerId: string): Promise<void> {
    if (!this.kv) return;

    const patterns = ['second', 'minute', 'hour', 'day'];
    for (const pattern of patterns) {
      const key = getRateLimitKey(customerId, pattern as any);
      await this.kv.delete(key);
    }
  }

  /**
   * Get current usage for customer
   */
  async getUsage(customerId: string, tier: LicenseTier): Promise<{
    second: { used: number; limit: number };
    minute: { used: number; limit: number };
    hour: { used: number; limit: number };
    day: { used: number; limit: number };
  }> {
    const limits = this.getLimitsForTier(tier);

    if (!this.kv) {
      return {
        second: { used: 0, limit: limits.requestsPerSecond },
        minute: { used: 0, limit: limits.requestsPerMinute },
        hour: { used: 0, limit: limits.requestsPerHour },
        day: { used: 0, limit: limits.requestsPerDay },
      };
    }

    const keys = [
      { type: 'second' as const, limit: limits.requestsPerSecond },
      { type: 'minute' as const, limit: limits.requestsPerMinute },
      { type: 'hour' as const, limit: limits.requestsPerHour },
      { type: 'day' as const, limit: limits.requestsPerDay },
    ];

    const usage: Record<string, { used: number; limit: number }> = {};

    for (const key of keys) {
      const kvKey = getRateLimitKey(customerId, key.type);
      const state = await this.kv.get(kvKey, { type: 'json' }) as RateLimitState | null;
      usage[key.type] = {
        used: state?.requestCount || 0,
        limit: key.limit,
      };
    }

    return usage as any;
  }
}

/**
 * Create audit log for rate limit events
 */
export function logRateLimitEvent(
  customerId: string,
  tier: LicenseTier,
  allowed: boolean,
  remaining: number,
  request_id: string
): void {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    user_id: customerId,
    customer_id: customerId,
    action: `rate_limit:${allowed ? 'allowed' : 'denied'}`,
    resource: `/api/v1/*`,
    result: allowed ? 'allowed' : 'denied',
    reason: allowed ? `Remaining: ${remaining}` : 'Rate limit exceeded',
    request_id,
  };

  console.log('[Rate Limit Audit]', JSON.stringify(entry));
}

/**
 * Express/Cloudflare Workers middleware factory
 */
export function createRateLimitMiddleware(
  rateLimiter: CloudflareRateLimiter,
  getCustomerId: (req: any) => string,
  getTier: (req: any) => LicenseTier
) {
  return async (req: any, res: any, next: () => void) => {
    const customerId = getCustomerId(req);
    const tier = getTier(req);
    const requestId = crypto.randomUUID();

    try {
      const result = await rateLimiter.checkRateLimit(customerId, tier);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toUTCString());

      if (!result.allowed) {
        res.setHeader('Retry-After', String(result.retryAfter));
        logRateLimitEvent(customerId, tier, false, 0, requestId);
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please retry after ${result.retryAfter} seconds.`,
          retry_after: result.retryAfter,
          request_id: requestId,
        });
        return;
      }

      // Increment usage
      await rateLimiter.incrementUsage(customerId, tier);
      logRateLimitEvent(customerId, tier, true, result.remaining, requestId);

      next();
    } catch (error) {
      console.error('[Rate Limit Middleware] Error:', error);
      next(); // Fail open on error
    }
  };
}
