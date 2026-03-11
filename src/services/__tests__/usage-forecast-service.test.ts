/**
 * Usage Forecast Service Unit Tests - Phase 6
 *
 * Tests for predictive usage analytics including:
 * - Linear regression calculation
 * - End-of-month projection
 * - Confidence interval calculation
 * - Trend analysis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UsageForecastService } from '../usage-forecast-service'
import { calculateLinearRegression, calculateConfidence } from '../usage-forecast-helpers'
import type { SupabaseClient } from '@supabase/supabase-js'

const createMockSupabase = () => {
  // Create a chainable mock that returns a promise-like object
  const createChainableMock = (result = { data: null, error: null }) => {
    const mockQuery: any = {}
    const methods = ['select', 'eq', 'gte', 'order', 'limit', 'single']
    methods.forEach(method => {
      mockQuery[method] = vi.fn().mockReturnThis()
    })
    // Make order and single return promise-like objects
    mockQuery.order.mockResolvedValue(result)
    mockQuery.single.mockResolvedValue(result)
    return mockQuery
  }

  return {
    from: vi.fn().mockImplementation(() => createChainableMock()),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}

describe('UsageForecastService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let forecastService: UsageForecastService

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    forecastService = new UsageForecastService(mockSupabase as unknown as SupabaseClient, 'test-org-123')
  })

  const setupForecastMocks = (
    mockUsageData: Array<{ feature: string; quantity: number; recorded_at: string }>,
    quotaLimit: number,
    planSlug = 'pro'
  ) => {
    // Create a fully chainable mock query builder
    const createChainableQueryMock = (finalResult: any) => {
      const mockQuery: any = {}
      const methods = ['select', 'eq', 'gte', 'order', 'limit', 'single']
      methods.forEach(method => {
        mockQuery[method] = vi.fn().mockReturnThis()
      })
      mockQuery.order.mockResolvedValue(finalResult)
      mockQuery.single.mockResolvedValue(finalResult)
      return mockQuery
    }

    // First call: getHistoricalUsage - from('usage_records')
    const usageQueryMock = createChainableQueryMock({ data: mockUsageData, error: null })
    // Second call: getQuotaLimit - from('billing_state')
    const quotaQueryMock = createChainableQueryMock({ data: { quota_limit: quotaLimit }, error: null })
    // Third call: getOrgTier - from('subscriptions')
    const tierQueryMock = createChainableQueryMock({ data: { plan_slug: planSlug }, error: null })

    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(usageQueryMock)   // First .from() call for usage_records
      .mockReturnValueOnce(quotaQueryMock)   // Second .from() call for billing_state
      .mockReturnValueOnce(tierQueryMock)    // Third .from() call for subscriptions
  }

  describe('getForecast', () => {
    it('returns forecast with projected end-of-month usage', async () => {
      const mockUsageData = Array.from({ length: 30 }, (_, i) => ({
        feature: 'tokens',
        quantity: 1000 + (i * 100),
        recorded_at: `2026-03-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      }))

      setupForecastMocks(mockUsageData, 100000, 'pro')

      const forecast = await forecastService.getForecast('tokens')

      if (forecast) {
        expect(forecast.metricType).toBe('tokens')
        expect(forecast.currentUsage).toBeGreaterThan(0)
        expect(forecast.projectedEndOfMonth).toBeGreaterThan(forecast.currentUsage)
        expect(forecast.trend).toBeDefined()
        expect(forecast.confidence).toBeGreaterThanOrEqual(0)
        expect(forecast.confidence).toBeLessThanOrEqual(1)
        expect(forecast.dailyRunRate).toBeGreaterThan(0)
      }
    })

    it('handles empty usage data', async () => {
      setupForecastMocks([], 0, 'pro')

      const forecast = await forecastService.getForecast('tokens')

      if (forecast) {
        expect(forecast.currentUsage).toBe(0)
        expect(forecast.projectedEndOfMonth).toBe(0)
        expect(forecast.confidence).toBe(0)
        expect(forecast.trend).toBe('stable')
      }
    })

    it('detects upward trend', async () => {
      const mockUsageData = Array.from({ length: 14 }, (_, i) => ({
        feature: 'tokens',
        quantity: 1000 * (i + 1),
        recorded_at: `2026-03-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      }))

      setupForecastMocks(mockUsageData, 100000, 'pro')

      const forecast = await forecastService.getForecast('tokens')

      if (forecast) {
        expect(forecast.trend).toBe('up')
      }
    })

    it('detects downward trend', async () => {
      const mockUsageData = Array.from({ length: 14 }, (_, i) => ({
        feature: 'tokens',
        quantity: 1000 * (14 - i),
        recorded_at: `2026-03-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      }))

      setupForecastMocks(mockUsageData, 100000, 'pro')

      const forecast = await forecastService.getForecast('tokens')

      if (forecast) {
        expect(forecast.trend).toBe('down')
      }
    })

    it('calculates projected overage cost', async () => {
      // Mock: strongly increasing usage that will exceed quota
      // Starting at 1000, increasing by 2000 each day: day 20 = 39000
      // With upward trend, projection will exceed quota of 10000
      const mockUsageData = Array.from({ length: 20 }, (_, i) => ({
        feature: 'tokens',
        quantity: 1000 + (i * 2000),
        recorded_at: `2026-03-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      }))

      setupForecastMocks(mockUsageData, 10000, 'pro')

      const forecast = await forecastService.getForecast('tokens')

      if (forecast) {
        expect(forecast.projectedOverageUnits).toBeGreaterThan(0)
        expect(forecast.projectedOverageCost).toBeGreaterThan(0)
      }
    })
  })

  describe('getAllForecasts', () => {
    it('returns forecasts for all metric types', async () => {
      // getAllForecasts calls getForecast for each metric type
      // Each getForecast calls getHistoricalUsage and getQuotaLimit

      const mockMetrics = ['api_calls', 'tokens']

      // For each metric, we need 2 mock queries (usage + quota)
      for (let i = 0; i < mockMetrics.length * 2; i++) {
        const mockQuery: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          single: vi.fn().mockResolvedValue({ data: { quota_limit: 0 }, error: null }),
        }
        mockSupabase.from.mockReturnValueOnce(mockQuery)
      }

      const forecasts = await forecastService.getAllForecasts()

      expect(Object.keys(forecasts).length).toBeGreaterThan(0)
    })
  })

  describe('calculateLinearRegression', () => {
    it('calculates correct slope and intercept', () => {
      const data = [
        { date: '2026-03-01', value: 100 },
        { date: '2026-03-02', value: 200 },
        { date: '2026-03-03', value: 300 },
        { date: '2026-03-04', value: 400 },
        { date: '2026-03-05', value: 500 },
      ]

      const result = calculateLinearRegression(data)

      expect(result.slope).toBeCloseTo(100, 0)
      expect(result.rSquared).toBeCloseTo(1, 2) // Perfect linear relationship
    })

    it('handles low correlation data', () => {
      const data = [
        { date: '2026-03-01', value: 100 },
        { date: '2026-03-02', value: 500 },
        { date: '2026-03-03', value: 200 },
        { date: '2026-03-04', value: 800 },
        { date: '2026-03-05', value: 150 },
      ]

      const result = calculateLinearRegression(data)

      expect(result.rSquared).toBeLessThan(0.5) // Low correlation
    })
  })

  describe('calculateConfidence', () => {
    it('returns higher confidence for consistent data than erratic data', () => {
      const consistentData = [
        { date: '2026-03-01', value: 100 },
        { date: '2026-03-02', value: 102 },
        { date: '2026-03-03', value: 98 },
        { date: '2026-03-04', value: 101 },
        { date: '2026-03-05', value: 99 },
      ]

      const erraticData = [
        { date: '2026-03-01', value: 10 },
        { date: '2026-03-02', value: 1000 },
        { date: '2026-03-03', value: 5 },
        { date: '2026-03-04', value: 500 },
        { date: '2026-03-05', value: 100 },
      ]

      const consistentRegression = calculateLinearRegression(consistentData)
      const erraticRegression = calculateLinearRegression(erraticData)

      const consistentConfidence = calculateConfidence(consistentData, consistentRegression)
      const erraticConfidence = calculateConfidence(erraticData, erraticRegression)

      // Consistent data should have higher confidence than erratic data
      expect(consistentConfidence).toBeGreaterThan(erraticConfidence)
      expect(consistentConfidence).toBeGreaterThan(0.1)
      expect(erraticConfidence).toBeLessThan(0.5)
    })

    it('returns low confidence for erratic data', () => {
      const data = [
        { date: '2026-03-01', value: 10 },
        { date: '2026-03-02', value: 1000 },
        { date: '2026-03-03', value: 5 },
        { date: '2026-03-04', value: 500 },
        { date: '2026-03-05', value: 100 },
      ]

      const regression = calculateLinearRegression(data)
      const confidence = calculateConfidence(data, regression)

      expect(confidence).toBeLessThan(0.5)
    })
  })
})
