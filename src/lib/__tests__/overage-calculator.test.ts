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

const createMockSupabase = () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  insert: jest.fn().mockReturnThis(),
})

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
      expect(result.percentageUsed).toBe(50)
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
      mockSupabase.from = jest.fn().mockImplementation(() => {
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
      mockSupabase.from = jest.fn().mockReturnThis()
      mockSupabase.select = jest.fn().mockResolvedValue({ data: null, error: null }) // No existing
      mockSupabase.insert = jest.fn().mockReturnThis()
      mockSupabase.single = jest.fn().mockResolvedValue({
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
      mockSupabase.from = jest.fn().mockReturnThis()
      mockSupabase.select = jest.fn().mockResolvedValue({
        data: { id: 'existing-tx-456' },
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

      mockSupabase.from = jest.fn().mockReturnThis()
      mockSupabase.select = jest.fn().mockResolvedValue({ data: mockData, error: null })

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

      mockSupabase.from = jest.fn().mockReturnThis()
      mockSupabase.select = jest.fn().mockResolvedValue({ data: mockData, error: null })

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
      // Mock transaction fetch
      mockSupabase.from = jest.fn().mockReturnThis()
      mockSupabase.select = jest.fn().mockResolvedValue({
        data: {
          id: 'tx-123',
          stripe_subscription_item_id: 'si_abc123',
          overage_units: 5000,
          metric_type: 'api_calls',
          created_at: '2026-03-09T00:00:00Z',
        },
        error: null,
      })

      // Mock Stripe function call
      mockSupabase.functions = {
        invoke: jest.fn().mockResolvedValue({ data: { id: 'usage-rec-456' }, error: null }),
      }

      const result = await calculator.syncToStripe('tx-123')

      expect(result.success).toBe(true)
      expect(result.stripeUsageRecordId).toBe('usage-rec-456')
    })
  })
})
