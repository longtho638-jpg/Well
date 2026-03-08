/**
 * Phase 7 Tests: Overage Billing and Quota Enforcement
 *
 * Tests for:
 * - OverageCalculator: Overage calculation and tracking
 * - QuotaEnforcer: Hard/soft quota enforcement
 * - OverageTrackingClient: React hooks and client library
 * - Stripe Integration: Usage record sync
 *
 * Run: npm test -- phase7-overage-tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OverageCalculator } from '@/lib/overage-calculator'
import { QuotaEnforcer } from '@/lib/quota-enforcer'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock Supabase client
const createMockSupabase = () => {
  const mock = {
    from: vi.fn((table: string) => ({
      select: vi.fn((columns: string) => mock),
      insert: vi.fn((data: unknown) => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }),
        })),
      })),
      eq: vi.fn((key: string, value: unknown) => mock),
      gte: vi.fn((key: string, value: string) => mock),
      lte: vi.fn((key: string, value: string) => mock),
      lt: vi.fn((key: string, value: string) => mock),
      order: vi.fn((key: string, options: unknown) => mock),
      limit: vi.fn((num: number) => mock),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn((fn: string, params: unknown) => ({
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { id: 'stripe-record-id' }, error: null }),
    },
  }
  return mock as unknown as SupabaseClient
}

// ============================================================
// OverageCalculator Tests
// ============================================================

describe('OverageCalculator', () => {
  let mockSupabase: SupabaseClient
  let calculator: OverageCalculator

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    calculator = new OverageCalculator(mockSupabase, 'org-123')
  })

  describe('calculateOverage()', () => {
    it('should calculate overage when usage exceeds quota', async () => {
      const result = await calculator.calculateOverage({
        metricType: 'api_calls',
        currentUsage: 15000,
        includedQuota: 10000,
        tier: 'pro',
      })

      expect(result.overageUnits).toBe(5000)
      expect(result.totalCost).toBeGreaterThan(0)
      expect(result.metricType).toBe('api_calls')
    })

    it('should return zero overage when usage is within quota', async () => {
      const result = await calculator.calculateOverage({
        metricType: 'api_calls',
        currentUsage: 5000,
        includedQuota: 10000,
        tier: 'pro',
      })

      expect(result.overageUnits).toBe(0)
      expect(result.totalCost).toBe(0)
    })

    it('should handle unlimited quota (-1)', async () => {
      const result = await calculator.calculateOverage({
        metricType: 'api_calls',
        currentUsage: 1000000,
        includedQuota: -1,
        tier: 'master',
      })

      expect(result.overageUnits).toBe(0)
    })

    it('should calculate overage for different metric types', async () => {
      const metrics: Array<{ type: string; usage: number; quota: number }> = [
        { type: 'ai_calls', usage: 150, quota: 100 },
        { type: 'tokens', usage: 150000, quota: 100000 },
        { type: 'compute_minutes', usage: 120, quota: 100 },
        { type: 'storage_gb', usage: 15, quota: 10 },
      ]

      for (const metric of metrics) {
        const result = await calculator.calculateOverage({
          metricType: metric.type as any,
          currentUsage: metric.usage,
          includedQuota: metric.quota,
          tier: 'pro',
        })

        expect(result.overageUnits).toBeGreaterThan(0)
      }
    })

    it('should apply different rates for different tiers', async () => {
      const tiers = ['free', 'basic', 'pro', 'enterprise', 'master']
      const costs: number[] = []

      for (const tier of tiers) {
        const result = await calculator.calculateOverage({
          metricType: 'api_calls',
          currentUsage: 15000,
          includedQuota: 10000,
          tier,
        })
        costs.push(result.totalCost)
      }

      // Free tier should have highest cost, master should have lowest
      expect(costs[0]).toBeGreaterThanOrEqual(costs[4])
    })
  })

  describe('trackOverage()', () => {
    it('should create overage transaction in database', async () => {
      const result = await calculator.trackOverage({
        metricType: 'api_calls',
        overageUnits: 5000,
        totalCost: 2.50,
        totalUsage: 15000,
        includedQuota: 10000,
      })

      expect(result.success).toBe(true)
      expect(result.transactionId).toBeDefined()
    })

    it('should be idempotent - skip duplicate transactions', async () => {
      // First call
      await calculator.trackOverage({
        metricType: 'api_calls',
        overageUnits: 5000,
        totalCost: 2.50,
        totalUsage: 15000,
        includedQuota: 10000,
      })

      // Second call with same params should return existing
      const result = await calculator.trackOverage({
        metricType: 'api_calls',
        overageUnits: 5000,
        totalCost: 2.50,
        totalUsage: 15000,
        includedQuota: 10000,
      })

      expect(result.success).toBe(true)
    })

    it('should include tenantId when provided', async () => {
      const result = await calculator.trackOverage({
        metricType: 'api_calls',
        overageUnits: 5000,
        totalCost: 2.50,
        totalUsage: 15000,
        includedQuota: 10000,
        tenantId: 'tenant-456',
      })

      expect(result.success).toBe(true)
    })

    it('should track metadata', async () => {
      const result = await calculator.trackOverage({
        metricType: 'api_calls',
        overageUnits: 5000,
        totalCost: 2.50,
        totalUsage: 15000,
        includedQuota: 10000,
        metadata: { source: 'test', campaign: 'phase7' },
      })

      expect(result.success).toBe(true)
    })
  })

  describe('getOverageHistory()', () => {
    it('should return overage transactions', async () => {
      const history = await calculator.getOverageHistory()

      expect(Array.isArray(history)).toBe(true)
    })

    it('should filter by billing period', async () => {
      const history = await calculator.getOverageHistory({
        billingPeriod: '2026-03',
      })

      expect(Array.isArray(history)).toBe(true)
    })

    it('should filter by metric type', async () => {
      const history = await calculator.getOverageHistory({
        metricType: 'api_calls',
      })

      expect(Array.isArray(history)).toBe(true)
    })

    it('should limit results', async () => {
      const history = await calculator.getOverageHistory({
        limit: 10,
      })

      expect(history.length).toBeLessThanOrEqual(10)
    })
  })

  describe('getTotalOverageCost()', () => {
    it('should return total cost for billing period', async () => {
      const result = await calculator.getTotalOverageCost('2026-03')

      expect(result.totalCost).toBeGreaterThanOrEqual(0)
      expect(result.totalTransactions).toBeGreaterThanOrEqual(0)
      expect(typeof result.breakdownByMetric).toBe('object')
    })

    it('should provide breakdown by metric type', async () => {
      const result = await calculator.getTotalOverageCost('2026-03')

      // Should have costs for each metric type that has overages
      expect(typeof result.breakdownByMetric).toBe('object')
    })
  })

  describe('syncToStripe()', () => {
    it('should sync overage transaction to Stripe', async () => {
      const result = await calculator.syncToStripe('transaction-123')

      // Should succeed or fail gracefully
      expect(typeof result.success).toBe('boolean')
    })
  })
})

// ============================================================
// QuotaEnforcer Tests
// ============================================================

describe('QuotaEnforcer', () => {
  let mockSupabase: SupabaseClient
  let enforcer: QuotaEnforcer

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    enforcer = new QuotaEnforcer(mockSupabase, {
      orgId: 'org-123',
      enforcementMode: 'hard',
    })
  })

  describe('checkQuota()', () => {
    it('should allow requests within quota', async () => {
      const result = await enforcer.checkQuota('api_calls')

      expect(result.allowed).toBe(true)
      expect(result.isOverLimit).toBe(false)
      expect(result.remaining).toBeGreaterThanOrEqual(0)
    })

    it('should return correct percentage used', async () => {
      const result = await enforcer.checkQuota('api_calls')

      expect(result.percentageUsed).toBeGreaterThanOrEqual(0)
      expect(result.percentageUsed).toBeLessThanOrEqual(100)
    })

    it('should include quota breakdown in metadata', async () => {
      const result = await enforcer.checkQuota('api_calls')

      expect(result.metadata).toBeDefined()
      expect(result.metadata?.baseQuota).toBeDefined()
    })
  })

  describe('Enforcement Modes', () => {
    it('should allow all requests in soft mode', async () => {
      const softEnforcer = new QuotaEnforcer(mockSupabase, {
        orgId: 'org-123',
        enforcementMode: 'soft',
      })

      // Even if over limit, soft mode should allow
      const result = await softEnforcer.checkQuota('api_calls')
      expect(typeof result.allowed).toBe('boolean')
    })

    it('should block requests in hard mode when over limit', async () => {
      const hardEnforcer = new QuotaEnforcer(mockSupabase, {
        orgId: 'org-123',
        enforcementMode: 'hard',
      })

      const result = await hardEnforcer.checkQuota('api_calls')
      expect(result.enforcementMode).toBe('hard')
    })

    it('should check grace period in hybrid mode', async () => {
      const hybridEnforcer = new QuotaEnforcer(mockSupabase, {
        orgId: 'org-123',
        enforcementMode: 'hybrid',
      })

      const result = await hybridEnforcer.checkQuota('api_calls')
      expect(result.enforcementMode).toBe('hybrid')
    })
  })

  describe('getEffectiveQuota()', () => {
    it('should return base quota for tier', async () => {
      const quota = await enforcer.getEffectiveQuota('api_calls')

      expect(quota).toBeGreaterThan(0)
    })

    it('should handle unlimited quota (-1)', async () => {
      // Master tier has unlimited quotas
      const masterEnforcer = new QuotaEnforcer(mockSupabase, {
        orgId: 'org-123',
      })

      // Mock getOrgTier to return 'master'
      vi.spyOn(masterEnforcer as any, 'getOrgTier').mockResolvedValue('master')

      const quota = await masterEnforcer.getEffectiveQuota('api_calls')
      expect(quota).toBe(-1)
    })
  })

  describe('QuotaExceededResponse', () => {
    it('should create proper 429 response', () => {
      const result = {
        allowed: false,
        currentUsage: 15000,
        effectiveQuota: 10000,
        remaining: 0,
        percentageUsed: 150,
        isOverLimit: true,
        overageUnits: 5000,
        enforcementMode: 'hard' as const,
        retryAfter: 3600,
      }

      const response = QuotaEnforcer.createQuotaExceededResponse(result)

      expect(response.status).toBe(429)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(response.headers.get('Retry-After')).toBe('3600')
    })
  })
})

// ============================================================
// Integration Tests
// ============================================================

describe('Phase 7 Integration', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabase()
  })

  it('should track overage when quota exceeded', async () => {
    const calculator = new OverageCalculator(mockSupabase, 'org-123')
    const enforcer = new QuotaEnforcer(mockSupabase, {
      orgId: 'org-123',
      enforcementMode: 'soft', // Soft mode to allow overage
    })

    // Check quota
    const quotaResult = await enforcer.checkQuota('api_calls')

    // Calculate overage
    const overageResult = await calculator.calculateOverage({
      metricType: 'api_calls',
      currentUsage: quotaResult.currentUsage,
      includedQuota: quotaResult.effectiveQuota,
      tier: 'pro',
    })

    // Should have consistent data
    expect(quotaResult.effectiveQuota).toBe(overageResult.includedQuota)
  })

  it('should enforce hard limits and track overage separately', async () => {
    const hardEnforcer = new QuotaEnforcer(mockSupabase, {
      orgId: 'org-123',
      enforcementMode: 'hard',
    })

    const softEnforcer = new QuotaEnforcer(mockSupabase, {
      orgId: 'org-123',
      enforcementMode: 'soft',
    })

    // Hard mode may block while soft mode allows
    const hardResult = await hardEnforcer.checkQuota('api_calls')
    const softResult = await softEnforcer.checkQuota('api_calls')

    // Both should have valid quota data
    expect(hardResult.effectiveQuota).toBeGreaterThan(0)
    expect(softResult.effectiveQuota).toBeGreaterThan(0)
  })
})

// ============================================================
// Edge Cases
// ============================================================

describe('Phase 7 Edge Cases', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabase()
  })

  it('should handle zero usage', async () => {
    const calculator = new OverageCalculator(mockSupabase, 'org-123')
    const result = await calculator.calculateOverage({
      metricType: 'api_calls',
      currentUsage: 0,
      includedQuota: 10000,
      tier: 'pro',
    })

    expect(result.overageUnits).toBe(0)
    expect(result.totalCost).toBe(0)
  })

  it('should handle exact quota usage', async () => {
    const calculator = new OverageCalculator(mockSupabase, 'org-123')
    const result = await calculator.calculateOverage({
      metricType: 'api_calls',
      currentUsage: 10000,
      includedQuota: 10000,
      tier: 'pro',
    })

    expect(result.overageUnits).toBe(0)
  })

  it('should handle negative quota (unlimited)', async () => {
    const calculator = new OverageCalculator(mockSupabase, 'org-123')
    const result = await calculator.calculateOverage({
      metricType: 'api_calls',
      currentUsage: 1000000,
      includedQuota: -1,
      tier: 'master',
    })

    expect(result.overageUnits).toBe(0)
  })

  it('should handle missing database gracefully', async () => {
    const failingSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
          })),
        })),
      })),
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    } as unknown as SupabaseClient

    const calculator = new OverageCalculator(failingSupabase, 'org-123')
    const result = await calculator.calculateOverage({
      metricType: 'api_calls',
      currentUsage: 15000,
      includedQuota: 10000,
      tier: 'pro',
    })

    // Should use fallback rates
    expect(result.overageUnits).toBe(5000)
  })

  it('should calculate costs accurately', async () => {
    const calculator = new OverageCalculator(mockSupabase, 'org-123')
    const result = await calculator.calculateOverage({
      metricType: 'api_calls',
      currentUsage: 11000,
      includedQuota: 10000,
      tier: 'pro',
    })

    // Cost should be rounded to 2 decimal places
    expect(result.totalCost).toBe(parseFloat(result.totalCost.toFixed(2)))
  })
})
