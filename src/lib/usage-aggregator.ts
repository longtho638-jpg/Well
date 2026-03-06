/* eslint-disable max-lines */
/**
 * Real-time Usage Aggregation Service
 *
 * Provides real-time usage aggregation for analytics dashboard.
 * Uses Supabase Realtime subscriptions for live updates.
 *
 * Usage:
 *   import { UsageAggregator } from '@/lib/usage-aggregator';
 *
 *   const aggregator = new UsageAggregator(supabase, orgId);
 *   aggregator.subscribe((update) => {
 *     console.log('Real-time usage update:', update);
 *   });
 *
 *   const summary = await aggregator.getRealTimeSummary();
 */

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'

export interface UsageUpdate {
  org_id: string
  feature: string
  quantity: number
  recorded_at: string
  user_id: string
}

export interface RealTimeUsageSummary {
  org_id: string
  period: {
    start: string
    end: string
  }
  features: Record<string, {
    total: number
    count: number
    last_updated: string
  }>
  total_events: number
  updated_at: string
}

export class UsageAggregator {
  private supabase: SupabaseClient
  private orgId: string
  private channel: RealtimeChannel | null = null
  private subscribers: Set<(update: UsageUpdate) => void> = new Set()
  private cache: Map<string, RealTimeUsageSummary> = new Map()

  constructor(supabase: SupabaseClient, orgId: string) {
    this.supabase = supabase
    this.orgId = orgId
  }

  /**
   * Subscribe to real-time usage updates
   */
  subscribe(callback: (update: UsageUpdate) => void): () => void {
    this.subscribers.add(callback)

    if (!this.channel) {
      this.setupRealtimeSubscription()
    }

    return () => {
      this.subscribers.delete(callback)
      if (this.subscribers.size === 0) {
        this.unsubscribe()
      }
    }
  }

  /**
   * Setup Supabase Realtime subscription
   */
  private setupRealtimeSubscription(): void {
    this.channel = this.supabase.channel(`usage:${this.orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usage_records',
          filter: `org_id=eq.${this.orgId}`,
        },
        (payload) => {
          const update = payload.new as UsageUpdate
          this.notifySubscribers(update)
          this.updateCache(update)
        }
      )
      .subscribe()

    console.warn(`[UsageAggregator] Realtime subscription started for org ${this.orgId}`)
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(): void {
    if (this.channel) {
      this.supabase.removeChannel(this.channel)
      this.channel = null
      console.warn(`[UsageAggregator] Realtime subscription stopped for org ${this.orgId}`)
    }
  }

  /**
   * Notify all subscribers of new update
   */
  private notifySubscribers(update: UsageUpdate): void {
    this.subscribers.forEach(callback => {
      try {
        callback(update)
      } catch (error) {
        console.error('[UsageAggregator] Subscriber error:', error)
      }
    })
  }

  /**
   * Update local cache with new data
   */
  private updateCache(update: UsageUpdate): void {
    const today = new Date().toISOString().split('T')[0]
    const cached = this.cache.get(today)

    if (cached) {
      const feature = cached.features[update.feature] || { total: 0, count: 0, last_updated: update.recorded_at }
      cached.features[update.feature] = {
        total: feature.total + update.quantity,
        count: feature.count + 1,
        last_updated: update.recorded_at,
      }
      cached.total_events += 1
      cached.updated_at = new Date().toISOString()
      this.cache.set(today, cached)
    }
  }

  /**
   * Get real-time usage summary
   */
  async getRealTimeSummary(periodStart?: string, periodEnd?: string): Promise<RealTimeUsageSummary> {
    const now = new Date()
    const start = periodStart || new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const end = periodEnd || new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

    // Check cache first
    const cacheKey = start.split('T')[0]
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - new Date(cached.updated_at).getTime() < 60000) {
      return cached
    }

    // Fetch from Supabase
    const { data: records, error } = await this.supabase
      .from('usage_records')
      .select('feature, quantity, recorded_at, user_id')
      .eq('org_id', this.orgId)
      .gte('recorded_at', start)
      .lt('recorded_at', end)

    if (error) {
      console.error('[UsageAggregator] Fetch error:', error)
      throw error
    }

    // Aggregate
    const features: Record<string, { total: number; count: number; last_updated: string }> = {}
    let totalEvents = 0

    records?.forEach(record => {
      const feature = features[record.feature] || { total: 0, count: 0, last_updated: record.recorded_at }
      feature.total += record.quantity
      feature.count += 1
      feature.last_updated = record.recorded_at
      features[record.feature] = feature
      totalEvents += 1
    })

    const summary: RealTimeUsageSummary = {
      org_id: this.orgId,
      period: { start, end },
      features,
      total_events: totalEvents,
      updated_at: new Date().toISOString(),
    }

    this.cache.set(cacheKey, summary)
    return summary
  }

  /**
   * Get usage trend data for charts (hourly breakdown)
   */
  async getHourlyTrend(date: string = new Date().toISOString().split('T')[0]): Promise<{
    hour: number
    feature: string
    quantity: number
  }[]> {
    const dayStart = new Date(`${date}T00:00:00`).toISOString()
    const dayEnd = new Date(`${date}T23:59:59`).toISOString()

    const { data, error } = await this.supabase
      .from('usage_records')
      .select('feature, quantity, recorded_at')
      .eq('org_id', this.orgId)
      .gte('recorded_at', dayStart)
      .lt('recorded_at', dayEnd)
      .order('recorded_at', { ascending: true })

    if (error) {
      console.error('[UsageAggregator] Trend fetch error:', error)
      throw error
    }

    // Aggregate by hour
    const hourlyMap = new Map<string, { hour: number; feature: string; quantity: number }>()

    data?.forEach(record => {
      const hour = new Date(record.recorded_at).getHours()
      const key = `${hour}-${record.feature}`
      const existing = hourlyMap.get(key)

      if (existing) {
        existing.quantity += record.quantity
      } else {
        hourlyMap.set(key, { hour, feature: record.feature, quantity: record.quantity })
      }
    })

    return Array.from(hourlyMap.values()).sort((a, b) => a.hour - b.hour)
  }

  /**
   * Get top users by usage
   */
  async getTopUsers(limit: number = 10, periodStart?: string): Promise<{
    user_id: string
    total_usage: number
    features_used: number
  }[]> {
    const start = periodStart || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()

    const { data, error } = await this.supabase
      .from('usage_records')
      .select('user_id, quantity, feature')
      .eq('org_id', this.orgId)
      .gte('recorded_at', start)

    if (error) {
      console.error('[UsageAggregator] Top users fetch error:', error)
      throw error
    }

    // Aggregate by user
    const userMap = new Map<string, { user_id: string; total_usage: number; features: Set<string> }>()

    data?.forEach(record => {
      const user = userMap.get(record.user_id) || {
        user_id: record.user_id,
        total_usage: 0,
        features: new Set(),
      }
      user.total_usage += record.quantity
      user.features.add(record.feature)
      userMap.set(record.user_id, user)
    })

    return Array.from(userMap.values())
      .map(u => ({
        user_id: u.user_id,
        total_usage: u.total_usage,
        features_used: u.features.size,
      }))
      .sort((a, b) => b.total_usage - a.total_usage)
      .slice(0, limit)
  }
}

export default UsageAggregator
