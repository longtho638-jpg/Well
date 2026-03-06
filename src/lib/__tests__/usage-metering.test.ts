/**
 * Usage Metering Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UsageMeter, TIER_LIMITS } from '../usage-metering'

// Mock Supabase client
const createMockSupabase = () => ({
  from: vi.fn((table: string) => ({
    insert: vi.fn((data: any, options?: any) => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: Array.isArray(data) ? data.map((d, i) => ({ id: `mock-${i}`, ...d })) : { id: 'mock-1', ...data },
          error: null
        }))
      }))
    })),
    select: vi.fn((columns?: string) => ({
      eq: vi.fn((key: string, value: any) => ({
        gte: vi.fn((field: string, value: string) => ({
          lt: vi.fn((field: string, value: string) => ({
            order: vi.fn(() => ({
              range: vi.fn(async () => ({ data: [], error: null })),
            })),
            single: vi.fn(async () => ({ data: null, error: null })),
          })),
          single: vi.fn(async () => ({ data: null, error: null })),
        })),
        order: vi.fn(() => ({
          range: vi.fn(async () => ({ data: [], error: null })),
        })),
        lt: vi.fn((field: string, value: string) => ({
          single: vi.fn(async () => ({ data: null, error: null })),
        })),
      })),
    })),
    gte: vi.fn((field: string, value: string) => ({
      lt: vi.fn((field: string, value: string) => ({
        order: vi.fn(() => ({
          range: vi.fn(async () => ({ data: [], error: null })),
        })),
      })),
    })),
    lt: vi.fn((field: string, value: string) => ({
      single: vi.fn(async () => ({ data: null, error: null })),
    })),
    order: vi.fn(() => ({
      range: vi.fn(async () => ({ data: [], error: null })),
    })),
  })),
})

describe('UsageMeter', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabase()
  })

  describe('Tier Limits', () => {
    it('should have correct tier limits for all tiers', () => {
      expect(TIER_LIMITS.free.api_calls_per_minute).toBe(5)
      expect(TIER_LIMITS.free.api_calls_per_day).toBe(100)
      expect(TIER_LIMITS.free.tokens_per_day).toBe(10_000)

      expect(TIER_LIMITS.basic.api_calls_per_minute).toBe(20)
      expect(TIER_LIMITS.basic.api_calls_per_day).toBe(1_000)

      expect(TIER_LIMITS.premium.api_calls_per_minute).toBe(60)
      expect(TIER_LIMITS.premium.tokens_per_day).toBe(1_000_000)

      expect(TIER_LIMITS.enterprise.api_calls_per_day).toBe(100_000)
      expect(TIER_LIMITS.enterprise.compute_minutes_per_day).toBe(1_440)

      expect(TIER_LIMITS.master.api_calls_per_day).toBe(-1) // unlimited
      expect(TIER_LIMITS.master.tokens_per_day).toBe(-1)
    })
  })

  describe('Constructor', () => {
    it('should create meter with default free tier', () => {
      const meter = new UsageMeter(mockSupabase, { userId: 'user-123' })
      expect(meter).toBeDefined()
    })

    it('should create meter with custom tier', () => {
      const meter = new UsageMeter(mockSupabase, {
        userId: 'user-123',
        tier: 'premium'
      })
      expect(meter).toBeDefined()
    })

    it('should accept orgId and licenseId', () => {
      const meter = new UsageMeter(mockSupabase, {
        userId: 'user-123',
        orgId: 'org-456',
        licenseId: 'license-789',
        tier: 'enterprise',
      })
      expect(meter).toBeDefined()
    })
  })

  describe('track()', () => {
    it('should track API call with default quantity 1', async () => {
      const meter = new UsageMeter(mockSupabase, { userId: 'user-123' })

      const result = await meter.track('api_call', {})

      expect(result).toBeDefined()
      expect(mockSupabase.from).toHaveBeenCalledWith('usage_records')
    })

    it('should track tokens with custom quantity', async () => {
      const meter = new UsageMeter(mockSupabase, { userId: 'user-123' })

      await meter.track('tokens', { tokens: 5000 })

      expect(mockSupabase.from).toHaveBeenCalled()
    })

    it('should track compute time in milliseconds', async () => {
      const meter = new UsageMeter(mockSupabase, { userId: 'user-123' })

      await meter.track('compute_ms', { computeMs: 2500 })

      expect(mockSupabase.from).toHaveBeenCalled()
    })

    it('should include metadata in tracking', async () => {
      const meter = new UsageMeter(mockSupabase, {
        userId: 'user-123',
        tier: 'premium'
      })

      await meter.track('api_call', {
        metadata: { endpoint: '/api/users', method: 'POST' },
      })

      expect(mockSupabase.from).toHaveBeenCalled()
    })
  })

  describe('trackBatch()', () => {
    it('should track multiple events at once', async () => {
      const meter = new UsageMeter(mockSupabase, { userId: 'user-123' })

      const events = [
        { metric: 'api_call' as const, quantity: 1 },
        { metric: 'tokens' as const, quantity: 1000 },
        { metric: 'compute_ms' as const, quantity: 500 },
      ]

      const count = await meter.trackBatch(events)

      expect(count).toBe(3)
    })
  })

  describe('trackApiCall()', () => {
    it('should track API call and return remaining quota', async () => {
      const meter = new UsageMeter(mockSupabase, { userId: 'user-123' })

      const result = await meter.trackApiCall('/api/users', 'GET')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeDefined()
    })

    it('should include endpoint and method in metadata', async () => {
      const meter = new UsageMeter(mockSupabase, { userId: 'user-123' })

      await meter.trackApiCall('/api/products', 'POST', { productId: '123' })

      expect(mockSupabase.from).toHaveBeenCalled()
    })
  })

  describe('trackTokens()', () => {
    it('should track token usage for LLM calls', async () => {
      const meter = new UsageMeter(mockSupabase, { userId: 'user-123' })

      await meter.trackTokens(2048, {
        model: 'gpt-4',
        provider: 'openai',
        direction: 'input',
      })

      expect(mockSupabase.from).toHaveBeenCalled()
    })
  })

  describe('trackCompute()', () => {
    it('should track compute time', async () => {
      const meter = new UsageMeter(mockSupabase, { userId: 'user-123' })

      await meter.trackCompute(1500, {
        operation: 'image-processing',
        gpu: true,
      })

      expect(mockSupabase.from).toHaveBeenCalled()
    })
  })

  describe('getUsageStatus()', () => {
    it('should return usage status for current day', async () => {
      const meter = new UsageMeter(mockSupabase, { userId: 'user-123', tier: 'basic' })

      const status = await meter.getUsageStatus()

      expect(status).toHaveProperty('api_calls')
      expect(status).toHaveProperty('tokens')
      expect(status).toHaveProperty('compute')
      expect(status).toHaveProperty('isLimited')
      expect(status).toHaveProperty('resetAt')
    })

    it('should show unlimited for master tier', async () => {
      const meter = new UsageMeter(mockSupabase, { userId: 'user-123', tier: 'master' })

      const status = await meter.getUsageStatus()

      expect(status.api_calls.remaining).toBe(Infinity)
      expect(status.tokens.remaining).toBe(Infinity)
    })
  })

  describe('isRateLimited()', () => {
    it('should check rate limit status', () => {
      const meter = new UsageMeter(mockSupabase, { userId: 'user-123' })

      const status = meter.isRateLimited()

      expect(status).toHaveProperty('allowed')
      expect(status).toHaveProperty('remaining')
    })

    it('should respect tier limits', () => {
      const freeMeter = new UsageMeter(mockSupabase, { userId: 'user-123', tier: 'free' })
      const premiumMeter = new UsageMeter(mockSupabase, { userId: 'user-456', tier: 'premium' })

      const freeStatus = freeMeter.isRateLimited()
      const premiumStatus = premiumMeter.isRateLimited()

      // Premium should have higher or equal remaining
      expect((premiumStatus.remaining || 0) >= (freeStatus.remaining || 0)).toBe(true)
    })
  })
})

describe('Tier Limits Configuration', () => {
  it('should have progressive limits across tiers', () => {
    const tiers = ['free', 'basic', 'premium', 'enterprise', 'master']

    tiers.forEach((tier, index) => {
      const limits = TIER_LIMITS[tier]
      expect(limits).toBeDefined()

      if (index < tiers.length - 1) {
        const nextLimits = TIER_LIMITS[tiers[index + 1]]
        // Skip check if next tier is unlimited (-1), as master tier should be
        if (nextLimits.api_calls_per_day !== -1) {
          expect(limits.api_calls_per_day).toBeLessThanOrEqual(nextLimits.api_calls_per_day)
        }
        if (nextLimits.tokens_per_day !== -1) {
          expect(limits.tokens_per_day).toBeLessThanOrEqual(nextLimits.tokens_per_day)
        }
      }
    })
  })

  it('should have -1 (unlimited) only for master tier', () => {
    expect(TIER_LIMITS.free.api_calls_per_day).toBeGreaterThan(0)
    expect(TIER_LIMITS.basic.api_calls_per_day).toBeGreaterThan(0)
    expect(TIER_LIMITS.premium.api_calls_per_day).toBeGreaterThan(0)
    expect(TIER_LIMITS.enterprise.api_calls_per_day).toBeGreaterThan(0)
    expect(TIER_LIMITS.master.api_calls_per_day).toBe(-1)
  })
})
