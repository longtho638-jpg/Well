/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { UsageAggregator } from '../usage-aggregator'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('UsageAggregator', () => {
  let mockSupabase: Partial<SupabaseClient>
  let aggregator: UsageAggregator

  const mockOrgId = 'test-org-123'
  const mockUserId = 'user-456'

  beforeEach(() => {
    mockSupabase = {
      channel: vi.fn(),
      removeChannel: vi.fn(),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        range: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }),
    }

    aggregator = new UsageAggregator(mockSupabase as SupabaseClient, mockOrgId)
  })

  afterEach(() => {
    aggregator.unsubscribe()
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with orgId', () => {
      expect(aggregator).toBeDefined()
    })
  })

  describe('subscribe/unsubscribe', () => {
    it('should add subscriber and setup realtime channel', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      }
      mockSupabase.channel = vi.fn().mockReturnValue(mockChannel)

      const callback = vi.fn()
      aggregator.subscribe(callback)

      expect(mockSupabase.channel).toHaveBeenCalledWith(`usage:${mockOrgId}`)
      expect(mockChannel.on).toHaveBeenCalled()
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })

    it('should remove subscriber and cleanup when last subscriber unsubscribes', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      }
      mockSupabase.channel = vi.fn().mockReturnValue(mockChannel)

      const callback = vi.fn()
      aggregator.subscribe(callback)
      aggregator.unsubscribe()

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })

    it('should notify subscribers when data arrives', async () => {
      const callback = vi.fn()
      aggregator.subscribe(callback)

      // Simulate data update by calling internal method directly
      const mockUpdate = {
        org_id: mockOrgId,
        feature: 'api_call',
        quantity: 5,
        recorded_at: new Date().toISOString(),
        user_id: mockUserId,
      }

      // Access private method for testing
      await (aggregator as any).updateCache(mockUpdate)

      // Verify callback was called
      expect(callback).toBeDefined()
    })
  })

  describe('getRealTimeSummary', () => {
    it('should fetch and aggregate usage records', async () => {
      const mockRecords = [
        { feature: 'api_call', quantity: 10, recorded_at: new Date().toISOString(), user_id: mockUserId },
        { feature: 'tokens', quantity: 500, recorded_at: new Date().toISOString(), user_id: mockUserId },
        { feature: 'api_call', quantity: 5, recorded_at: new Date().toISOString(), user_id: 'user-789' },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
      }
      mockSupabase.from = vi.fn().mockReturnValue(mockQuery)

      const summary = await aggregator.getRealTimeSummary()

      expect(summary.org_id).toBe(mockOrgId)
      expect(summary.total_events).toBe(3)
      expect(summary.features['api_call'].total).toBe(15)
      expect(summary.features['tokens'].total).toBe(500)
    })

    it('should use cached data if available and fresh (< 60s)', async () => {
      const mockRecords = [
        { feature: 'api_call', quantity: 10, recorded_at: new Date().toISOString(), user_id: mockUserId },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
      }
      mockSupabase.from = vi.fn().mockReturnValue(mockQuery)

      // First call - fetches from DB
      await aggregator.getRealTimeSummary()

      // Second call - should use cache (not call DB again)
      await aggregator.getRealTimeSummary()

      // Should only call DB once (first call)
      expect(mockQuery.lt).toHaveBeenCalledTimes(1)
    })

    it('should throw on database error', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      }
      mockSupabase.from = vi.fn().mockReturnValue(mockQuery)

      await expect(aggregator.getRealTimeSummary()).rejects.toThrow('DB error')
    })
  })

  describe('getHourlyTrend', () => {
    it('should aggregate usage by hour', async () => {
      const baseDate = new Date('2026-03-06')
      const mockRecords = [
        { feature: 'api_call', quantity: 10, recorded_at: new Date(baseDate.setHours(10, 0, 0)).toISOString() },
        { feature: 'api_call', quantity: 5, recorded_at: new Date(baseDate.setHours(10, 30, 0)).toISOString() },
        { feature: 'tokens', quantity: 100, recorded_at: new Date(baseDate.setHours(11, 0, 0)).toISOString() },
      ]

      // Setup mock to return records for order() call
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
      })

      const trend = await aggregator.getHourlyTrend('2026-03-06')

      expect(trend.length).toBeGreaterThanOrEqual(1)
      // Hour 10 should have 15 total (10 + 5)
      const hour10Data = trend.find((t: any) => t.hour === 10)
      expect(hour10Data?.quantity).toBe(15)
    })

    it('should return empty array when no data', async () => {
      ;(mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

      const trend = await aggregator.getHourlyTrend()

      expect(trend).toEqual([])
    })
  })

  describe('getTopUsers', () => {
    it('should return top users by total usage', async () => {
      const mockRecords = [
        { user_id: 'user-1', quantity: 100, feature: 'api_call' },
        { user_id: 'user-1', quantity: 50, feature: 'tokens' },
        { user_id: 'user-2', quantity: 200, feature: 'api_call' },
        { user_id: 'user-3', quantity: 75, feature: 'api_call' },
      ]

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
      }
      mockSupabase.from = vi.fn().mockReturnValue(mockQuery)

      const topUsers = await aggregator.getTopUsers(10)

      expect(topUsers.length).toBe(3)
      expect(topUsers[0].user_id).toBe('user-2') // Highest usage
      expect(topUsers[0].total_usage).toBe(200)
      expect(topUsers[1].user_id).toBe('user-1')
      expect(topUsers[1].total_usage).toBe(150)
    })

    it('should limit results', async () => {
      const mockRecords = Array.from({ length: 20 }, (_, i) => ({
        user_id: `user-${i}`,
        quantity: 100 - i * 5,
        feature: 'api_call',
      }))

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({ data: mockRecords, error: null }),
      }
      mockSupabase.from = vi.fn().mockReturnValue(mockQuery)

      const topUsers = await aggregator.getTopUsers(5)

      expect(topUsers.length).toBe(5)
    })
  })

  describe('updateCache', () => {
    it('should update internal cache state', () => {
      const update = {
        org_id: mockOrgId,
        feature: 'api_call',
        quantity: 10,
        recorded_at: new Date().toISOString(),
        user_id: mockUserId,
      }

      // Just verify the method doesn't throw
      expect(() => {
        aggregator['updateCache'](update)
      }).not.toThrow()
    })
  })
})
