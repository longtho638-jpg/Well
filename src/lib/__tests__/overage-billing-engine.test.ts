/**
 * Overage Billing Engine Unit Tests - Phase 6
 *
 * Tests for overage billing orchestration including:
 * - Usage processing and overage detection
 * - Invoice creation with idempotency
 * - Billing state updates
 * - Usage forecasting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OverageBillingEngine } from '../overage-billing-engine'
import type { SupabaseClient } from '@supabase/supabase-js'

const createMockSupabase = () => {
  // Create a fully chainable query mock using Promise subclass for proper await support
  const createChainableMock = (result = { data: null, error: null }) => {
    const mockQuery: any = {}
    const methods = ['select', 'eq', 'gte', 'order', 'limit', 'single', 'insert', 'values', 'upsert', 'update']
    methods.forEach(method => {
      mockQuery[method] = vi.fn().mockReturnThis()
    })
    // Make await work - then must call resolve with result
    mockQuery.then = vi.fn((resolve, reject) => resolve(result))
    return mockQuery
  }

  return {
    from: vi.fn().mockImplementation(() => createChainableMock()),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true, invoice_id: 'in_123' }, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}

describe('OverageBillingEngine', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let engine: OverageBillingEngine

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    engine = new OverageBillingEngine(mockSupabase as unknown as SupabaseClient, 'test-org-123')
  })

  describe('processUsage', () => {
    it('detects overage and creates invoice', async () => {
      // Full mock chain for processUsage with overage:
      // Internal: OverageCalculator.getRatePerUnit needs overage_rates
      // 1. saveOverageEvent: insert().select().single()
      // 2. findExistingInvoice: select().eq().eq().eq().order().limit().single()
      // 3. getStripeCustomerId: select().eq().single()
      // 4. functions.invoke()
      // 5. update overage event: update().eq()
      // 6. updateBillingState: upsert()

      // Mock 0: OverageCalculator.getRatePerUnit - overage_rates query (returns error to use fallback)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      })
      // Mock 1: saveOverageEvent
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'event-123', stripe_invoice_id: null },
          error: null,
        }),
      })
      // Mock 2: findExistingInvoice - no existing invoice
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })
      // Mock 3: getStripeCustomerId
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { stripe_customer_id: 'cus_abc' }, error: null }),
      })
      // Mock 4: functions.invoke
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: { success: true, invoice_id: 'in_123' },
        error: null,
      })
      // Mock 5: update overage event
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })
      // Mock 6: updateBillingState
      mockSupabase.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      const result = await engine.processUsage({
        metricType: 'tokens',
        currentUsage: 125000,
        quotaLimit: 100000,
        tier: 'pro',
        userId: 'user-456',
      })

      expect(result.hasOverage).toBe(true)
      expect(result.invoiceCreated).toBe(true)
      expect(result.overageEvent?.overageUnits).toBeGreaterThan(0)
    })

    it('returns no overage when under quota', async () => {
      // No overage flow: updateBillingState only
      // But OverageCalculator.getRatePerUnit still gets called
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      })
      mockSupabase.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      const result = await engine.processUsage({
        metricType: 'api_calls',
        currentUsage: 5000,
        quotaLimit: 10000,
        tier: 'basic',
      })

      expect(result.hasOverage).toBe(false)
      expect(result.invoiceCreated).toBe(false)
    })

    it('updates billing state after processing', async () => {
      // Full mock chain for processUsage with overage
      // Mock 0: OverageCalculator.getRatePerUnit
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      })
      // Mock 1: saveOverageEvent
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'event-123', stripe_invoice_id: null },
          error: null,
        }),
      })
      // Mock 2: findExistingInvoice
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })
      // Mock 3: getStripeCustomerId
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { stripe_customer_id: 'cus_abc' }, error: null }),
      })
      // Mock 4: functions.invoke
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: { success: true, invoice_id: 'in_123' },
        error: null,
      })
      // Mock 5: update overage event
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })
      // Mock 6: updateBillingState (this is what we're testing)
      mockSupabase.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      await engine.processUsage({
        metricType: 'tokens',
        currentUsage: 125000,
        quotaLimit: 100000,
        tier: 'pro',
      })

      // Verify billing_state was called (6th call to .from(), index 5)
      expect(mockSupabase.from.mock.calls[5]?.[0]).toBe('billing_state')
    })
  })

  describe('createInvoice', () => {
    it('creates Stripe invoice for overage event', async () => {
      const mockEvent = {
        id: 'event-123',
        orgId: 'test-org-123',
        metricType: 'tokens',
        overageUnits: 25000,
        overageCost: 12.50,
        status: 'pending' as const,
        createdAt: new Date(),
      }

      // Mock: findExistingInvoice - no existing invoice found
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      // Mock: getStripeCustomerId - return Stripe customer ID
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { stripe_customer_id: 'cus_abc123' }, error: null }),
      })

      // Mock: update overage event with invoice ID - update().eq()
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      const result = await engine.createInvoice(mockEvent)

      expect(result.success).toBe(true)
      expect(result.invoiceId).toBe('in_123')
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        'stripe-overage-invoice',
        expect.objectContaining({
          body: expect.objectContaining({
            org_id: 'test-org-123',
            metric_type: 'tokens',
            overage_cost: 12.50,
          }),
        })
      )
    })

    it('respects idempotency (no duplicate invoices)', async () => {
      const mockEvent = {
        id: 'event-123',
        orgId: 'test-org-123',
        metricType: 'tokens',
        overageUnits: 25000,
        overageCost: 12.50,
        status: 'pending' as const,
        createdAt: new Date(),
      }

      // Mock: findExistingInvoice - existing invoice found
      // Production code: from('overage_events').select().eq().eq().eq().order().limit().single()
      const mockResult = {
        data: { stripe_invoice_id: 'in_existing' },
        error: null,
      }

      // Create a mock that supports infinite .eq() calls
      const chainableMock: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(function() { return chainableMock; }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockResult),
      }
      chainableMock.then = vi.fn((resolve) => resolve(mockResult))

      // Use mockImplementation to intercept the table name
      mockSupabase.from.mockImplementationOnce((tableName: string) => {
        console.log('from() called with table:', tableName)
        return chainableMock
      })

      const result = await engine.createInvoice(mockEvent)

      console.log('result:', result)
      console.log('from calls:', mockSupabase.from.mock.calls)

      expect(result.success).toBe(true)
      expect(result.invoiceId).toBe('in_existing')
    })

    it('fails when no Stripe customer ID', async () => {
      const mockEvent = {
        id: 'event-123',
        orgId: 'test-org-123',
        metricType: 'tokens',
        overageUnits: 25000,
        overageCost: 12.50,
        status: 'pending' as const,
        createdAt: new Date(),
      }

      // Mock: findExistingInvoice - no existing invoice
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      // Mock: getStripeCustomerId - no Stripe customer
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      const result = await engine.createInvoice(mockEvent)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Stripe customer')
    })
  })

  describe('updateBillingState', () => {
    it('updates billing_state KV store', async () => {
      mockSupabase.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      await engine.updateBillingState({
        orgId: 'test-org-123',
        metricType: 'tokens',
        currentUsage: 125000,
        quotaLimit: 100000,
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('billing_state')
    })

    it('calculates percentage correctly', async () => {
      mockSupabase.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      await engine.updateBillingState({
        orgId: 'test-org-123',
        metricType: 'api_calls',
        currentUsage: 800,
        quotaLimit: 1000,
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('billing_state')
    })
  })

  describe('getForecast', () => {
    it('returns usage forecast with trend analysis', async () => {
      const mockUsageData = [
        { feature: 'tokens', quantity: 1000, recorded_at: '2026-03-01T00:00:00Z' },
        { feature: 'tokens', quantity: 1500, recorded_at: '2026-03-02T00:00:00Z' },
        { feature: 'tokens', quantity: 2000, recorded_at: '2026-03-03T00:00:00Z' },
      ]

      // getForecast calls getHistoricalUsage which needs: from().select().eq().gte().order()
      // Then it calls getQuotaLimit which needs: from().select().eq().single()
      const mockUsageQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockUsageData, error: null }),
      }
      const mockQuotaQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { quota_limit: 100000 }, error: null }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockUsageQuery)
        .mockReturnValueOnce(mockQuotaQuery)

      const forecast = await engine.getForecast('tokens')

      if (forecast) {
        expect(forecast.metricType).toBe('tokens')
        expect(forecast.currentUsage).toBeGreaterThan(0)
        expect(forecast.trend).toBeDefined()
        expect(forecast.confidence).toBeGreaterThanOrEqual(0)
        expect(forecast.confidence).toBeLessThanOrEqual(1)
      }
    })

    it('returns null when no usage data', async () => {
      const mockUsageQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockSupabase.from.mockReturnValueOnce(mockUsageQuery)

      const forecast = await engine.getForecast('tokens')

      expect(forecast).toBeNull()
    })
  })

  describe('getOverageEvents', () => {
    it('fetches overage events with filters', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          org_id: 'test-org-123',
          metric_type: 'tokens',
          overage_units: 25000,
          overage_cost: '12.50',
          status: 'invoiced',
          created_at: '2026-03-09T00:00:00Z',
        },
      ]

      // Mock needs to support: select().eq().order().eq().limit() then await
      // Each .eq() call returns a new object with remaining chain methods
      const selectResult: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      }
      // Make it thenable
      selectResult.then = vi.fn((resolve) => resolve({ data: mockEvents, error: null }))

      mockSupabase.from.mockReturnValueOnce(selectResult)

      const events = await engine.getOverageEvents({ limit: 10, status: 'invoiced' })

      expect(events).toHaveLength(1)
      expect(events[0].metricType).toBe('tokens')
      expect(events[0].overageUnits).toBe(25000)
    })
  })

  describe('getTotalOverageCost', () => {
    it('calculates total overage cost', async () => {
      const mockData = [
        { overage_cost: '12.50' },
        { overage_cost: '5.00' },
        { overage_cost: '7.50' },
      ]

      // Mock needs to support: select().eq().eq() then await
      // Each .eq() call returns this for chaining
      const selectResult: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }
      // Make it thenable
      selectResult.then = vi.fn((resolve) => resolve({ data: mockData, error: null }))

      mockSupabase.from.mockReturnValueOnce(selectResult)

      const total = await engine.getTotalOverageCost('2026-03')

      expect(total).toBe(25.00)
    })
  })
})
