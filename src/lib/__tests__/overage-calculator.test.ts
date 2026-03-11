/**
 * Overage Calculator Unit Tests - Phase 6
 *
 * Tests for overage calculation logic including:
 * - Overage units and cost calculation
 * - Tier-based rate lookup
 * - Idempotency key generation
 * - Transaction tracking
 */

import { OverageCalculator } from '../overage-calculator'
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const createMockSupabase = () => {
  const mock: any = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  }
  return mock as unknown as SupabaseClient
}

describe('OverageCalculator', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let calculator: OverageCalculator

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    calculator = new OverageCalculator(mockSupabase as unknown as SupabaseClient, 'test-org-123')
  })

  describe('calculateOverage', () => {
    it('calculates overage correctly for API calls', async () => {
      // Mock: 15000/10000 used, pro tier
      const result = await calculator.calculateOverage({
        metricType: 'api_calls',
        currentUsage: 15000,
        includedQuota: 10000,
        tier: 'pro',
      })

      expect(result.overageUnits).toBe(5000)
      expect(result.ratePerUnit).toBe(0.0005) // pro rate
      expect(result.totalCost).toBe(2.50)
      expect(result.currency).toBe('USD')
    })

    it('handles unlimited quota (-1)', async () => {
      const result = await calculator.calculateOverage({
        metricType: 'api_calls',
        currentUsage: 1000000,
        includedQuota: -1, // unlimited
        tier: 'master',
      })

      expect(result.overageUnits).toBe(0)
      expect(result.totalCost).toBe(0)
      expect(result.includedQuota).toBe(-1)
    })

    it('returns zero overage when under quota', async () => {
      const result = await calculator.calculateOverage({
        metricType: 'api_calls',
        currentUsage: 5000,
        includedQuota: 10000,
        tier: 'basic',
      })

      expect(result.overageUnits).toBe(0)
      expect(result.totalCost).toBe(0)
      expect(result.totalUsage).toBe(5000)
    })

    it('calculates overage for tokens', async () => {
      const result = await calculator.calculateOverage({
        metricType: 'tokens',
        currentUsage: 1500000,
        includedQuota: 1000000,
        tier: 'pro',
      })

      expect(result.overageUnits).toBe(500000)
      expect(result.ratePerUnit).toBeCloseTo(0.000002, 7) // pro rate per token
      expect(result.totalCost).toBe(1.00)
    })

    it('uses fallback rates when database unavailable', async () => {
      // Mock database error
      mockSupabase.from = vi.fn().mockImplementation(() => {
        throw new Error('DB unavailable')
      })

      const result = await calculator.calculateOverage({
        metricType: 'api_calls',
        currentUsage: 15000,
        includedQuota: 10000,
        tier: 'basic',
      })

      // Should use default rate (0.0008 for basic)
      expect(result.overageUnits).toBe(5000)
      expect(result.ratePerUnit).toBe(0.0008)
      expect(result.totalCost).toBe(4.00)
    })
  })

  describe('trackOverage', () => {
    it('creates overage transaction', async () => {
      // Mock: no existing transaction, tier lookup returns 'pro'
      const chainMock: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }), // No existing
        insert: vi.fn().mockReturnThis(),
      }
      chainMock.select.mockReturnThis()
      mockSupabase.from = vi.fn().mockReturnValue(chainMock)
      chainMock.single.mockResolvedValue({
        data: { id: 'tx-123' },
        error: null,
      })

      const result = await calculator.trackOverage({
        metricType: 'api_calls',
        overageUnits: 5000,
        totalCost: 2.50,
        totalUsage: 15000,
        includedQuota: 10000,
      })

      expect(result.success).toBe(true)
      expect(result.transactionId).toBe('tx-123')
    })

    it('respects idempotency (no duplicate transactions)', async () => {
      // Mock: existing transaction found
      const chainMock: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'existing-tx-456' },
          error: null,
        }),
      }
      mockSupabase.from = vi.fn().mockReturnValue(chainMock)

      const result = await calculator.trackOverage({
        metricType: 'api_calls',
        overageUnits: 5000,
        totalCost: 2.50,
        totalUsage: 15000,
        includedQuota: 10000,
      })

      expect(result.success).toBe(true)
      expect(result.transactionId).toBe('existing-tx-456')
    })
  })

  describe('getOverageHistory', () => {
    it('fetches overage history with filters', async () => {
      const mockData = [
        {
          id: 'tx-1',
          metric_type: 'api_calls',
          overage_units: 5000,
          total_cost: '2.50',
          billing_period: '2026-03',
          created_at: '2026-03-09T00:00:00Z',
        },
      ]

      const chainMock: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }
      mockSupabase.from = vi.fn().mockReturnValue(chainMock)

      const history = await calculator.getOverageHistory({
        billingPeriod: '2026-03',
        limit: 10,
      })

      expect(history).toHaveLength(1)
      expect(history[0].metricType).toBe('api_calls')
      expect(history[0].overageUnits).toBe(5000)
      expect(history[0].totalCost).toBe(2.50)
    })
  })

  describe('getTotalOverageCost', () => {
    it('calculates total overage cost for billing period', async () => {
      const mockData = [
        { metric_type: 'api_calls', total_cost: '2.50' },
        { metric_type: 'tokens', total_cost: '1.00' },
      ]

      // Create a chainable mock that returns data on await
      const queryMock: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: mockData, error: null })),
      }

      mockSupabase.from = vi.fn().mockReturnValue(queryMock)

      const result = await calculator.getTotalOverageCost('2026-03')

      expect(result.totalCost).toBe(3.50)
      expect(result.totalTransactions).toBe(2)
      expect(result.breakdownByMetric).toEqual({
        api_calls: 2.50,
        tokens: 1.00,
      })
    })
  })

  describe('syncToStripe', () => {
    it('syncs overage transaction to Stripe', async () => {
      // Create chainable mock for transaction fetch
      const selectChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'tx-123',
            stripe_subscription_item_id: 'si_abc123',
            overage_units: 5000,
            metric_type: 'api_calls',
            created_at: '2026-03-09T00:00:00Z',
            idempotency_key: 'ovg_key',
          },
          error: null,
        }),
      }

      // Create chainable mock for update
      const updateChain: any = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      // Mock .from() to return appropriate chain based on call
      mockSupabase.from = vi.fn()
        .mockReturnValueOnce(selectChain) // First call: select
        .mockReturnValueOnce(updateChain) // Second call: update

      // Mock Stripe function call
      ;(mockSupabase as any).functions = {
        invoke: vi.fn().mockResolvedValue({ data: { id: 'usage-rec-456' }, error: null }),
      }

      const result = await calculator.syncToStripe('tx-123')

      expect(result.success).toBe(true)
      expect(result.stripeUsageRecordId).toBe('usage-rec-456')
    })
  })
})
