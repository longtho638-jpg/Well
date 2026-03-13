/**
 * Usage Metering Middleware Helper
 *
 * Express/FastAPI middleware for usage tracking and rate limiting
 * Updated Phase 3: Integrates with usage-tracker.ts for simplified tracking
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { UsageMeter } from './usage-metering'
import { trackUsage } from '@/metering/usage-tracker'
import { createLogger } from '@/utils/logger'

const logger = createLogger('UsageMetering')

export interface UserFromRequest {
  userId: string
  orgId?: string
  tier?: string
}

export interface UsageMiddlewareOptions {
  getUserFromRequest: (req: RequestLike) => Promise<UserFromRequest>
}

export interface RequestLike {
  originalUrl?: string
  url?: string
  method?: string
  usageMeter?: UsageMeter
}

export interface ResponseLike {
  statusCode?: number
  setHeader(key: string, value: string): void
  json(body: unknown): unknown
}

/**
 * Create usage tracking middleware for Express/FastAPI
 */
export function createUsageMiddleware(
  supabase: SupabaseClient,
  options: UsageMiddlewareOptions
): (req: RequestLike, res: ResponseLike, next: () => void) => Promise<void> {
  return async (req: RequestLike, res: ResponseLike, next: () => void): Promise<void> => {
    try {
      const user = await options.getUserFromRequest(req)
      const meter = new UsageMeter(supabase, user)

      // Check rate limit
      const rateStatus = meter.isRateLimited()
      if (!rateStatus.allowed) {
        res.setHeader('X-RateLimit-Limit', '0')
        res.setHeader('X-RateLimit-Remaining', '0')
        res.setHeader('X-RateLimit-Reset', rateStatus.resetAt || '')
        res.json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please upgrade your plan.',
          retryAfter: rateStatus.resetAt,
        })
        return
      }

      // Attach meter to request
      req.usageMeter = meter

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', String(rateStatus.remaining || 0))
      res.setHeader('X-RateLimit-Remaining', String((rateStatus.remaining || 0) - 1))
      res.setHeader('X-RateLimit-Reset', rateStatus.resetAt || '')

      // Track API call after response using Phase 3 tracker
      const originalJson = res.json.bind(res)
      res.json = (body: unknown): unknown => {
        trackUsage({
          orgId: user.orgId || user.userId,
          userId: user.userId,
          metricType: 'api_calls',
          quantity: 1,
          metadata: {
            endpoint: req.originalUrl || req.url,
            method: req.method,
            statusCode: res.statusCode,
          },
        }).catch((err: Error) => logger.error('Failed to track API call', { error: err }))
        return originalJson(body)
      }

      next()
    } catch (error) {
      logger.error('Usage middleware error', { error })
      next()
    }
  }
}
