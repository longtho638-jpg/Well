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
 *
 * Batch Aggregation for Stripe Billing:
 *   const result = await aggregator.aggregateForBilling({
 *     licenseId: 'lic_xxx',
 *     period: 'daily',
 *     date: '2026-03-07'
 *   });
 *
 *   await aggregator.syncToStripe({
 *     subscriptionItemId: 'si_xxx',
 *     dryRun: false
 *   });
 */

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'

// Stripe Billing Aggregation Types
export interface AggregationKey {
  license_id: string
  feature: string
  period_start: string
  period_end: string
}

export interface AggregatedUsage {
  id: string
  license_id: string
  user_id: string
  feature: string
  total_quantity: number
  event_count: number
  period_start: string
  period_end: string
  stripe_subscription_item_id?: string
  stripe_price_id?: string
  is_synced_to_stripe: boolean
  synced_at?: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AggregationOptions {
  period?: 'hourly' | 'daily' | 'monthly'
  date?: string
  licenseId?: string
  feature?: string
  dryRun?: boolean
}

export interface SyncToStripeOptions {
  subscriptionItemId: string
  dryRun?: boolean
  dateStart?: string
  dateEnd?: string
}

export interface AggregationResult {
  eventsProcessed: number
  aggregationsCreated: number
  duplicatesSkipped: number
  aggregationIds: string[]
}

export interface StripePriceMapping {
  api_call: string
  tokens: string
  model_inference: string
  agent_execution: string
  compute_ms: string
}

// Stripe Price ID mapping from environment
const STRIPE_PRICE_IDS: StripePriceMapping = {
  api_call: (import.meta.env.VITE_STRIPE_PRICE_ID_API_CALLS as string) || '',
  tokens: (import.meta.env.VITE_STRIPE_PRICE_ID_TOKENS as string) || '',
  model_inference: (import.meta.env.VITE_STRIPE_PRICE_ID_INFERENCES as string) || '',
  agent_execution: (import.meta.env.VITE_STRIPE_PRICE_ID_AGENTS as string) || '',
  compute_ms: (import.meta.env.VITE_STRIPE_PRICE_ID_COMPUTE as string) || '',
}

/**
 * Get billing period boundaries
 */
function getPeriodBoundaries(period: 'hourly' | 'daily' | 'monthly', date?: string): { start: string; end: string } {
  const now = date ? new Date(date) : new Date()

  if (period === 'hourly') {
    const start = new Date(now)
    start.setMinutes(0, 0, 0)
    const end = new Date(start)
    end.setHours(start.getHours() + 1)
    return { start: start.toISOString(), end: end.toISOString() }
  }

  if (period === 'daily') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start: start.toISOString(), end: end.toISOString() }
  }

  // monthly
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

/**
 * Generate idempotency key for aggregation
 */
function generateAggregationKey(licenseId: string, feature: string, periodStart: string, periodEnd: string): string {
  return `agg_${licenseId}_${feature}_${periodStart}_${periodEnd}`
}

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

  // ============================================================
  // BATCH AGGREGATION FOR STRIPE BILLING
  // ============================================================

  /**
   * Aggregate raw usage events into billing periods
   * Idempotent: can be called multiple times safely
   */
  async aggregateForBilling(options: AggregationOptions = {}): Promise<AggregationResult> {
    const {
      period = this.period,
      date,
      licenseId,
      feature,
      dryRun = false,
    } = options

    const { start: periodStart, end: periodEnd } = getPeriodBoundaries(period, date)

    console.warn('[UsageAggregator] Starting billing aggregation:', {
      period,
      periodStart,
      periodEnd,
      licenseId,
      feature,
      dryRun,
    })

    // Step 1: Get raw events to aggregate
    let query = this.supabase
      .from('usage_records')
      .select('id, user_id, license_id, feature, quantity, metadata, recorded_at')
      .gte('recorded_at', periodStart)
      .lt('recorded_at', periodEnd)
      .order('recorded_at', { ascending: true })

    if (licenseId) {
      query = query.eq('license_id', licenseId)
    }
    if (feature) {
      query = query.eq('feature', feature)
    }

    const { data: events, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch usage events: ${fetchError.message}`)
    }

    if (!events || events.length === 0) {
      console.warn('[UsageAggregator] No events to aggregate')
      return {
        eventsProcessed: 0,
        aggregationsCreated: 0,
        duplicatesSkipped: 0,
        aggregationIds: [],
      }
    }

    // Step 2: Group by license_id + feature
    const grouped = new Map<string, Array<typeof events[0]>>()
    for (const event of events) {
      const key = `${event.license_id || 'anon'}_${event.feature}`
      const existing = grouped.get(key) || []
      existing.push(event)
      grouped.set(key, existing)
    }

    console.warn('[UsageAggregator] Grouped events:', {
      totalEvents: events.length,
      groups: grouped.size,
    })

    // Step 3: Create/update aggregations
    const result: AggregationResult = {
      eventsProcessed: 0,
      aggregationsCreated: 0,
      duplicatesSkipped: 0,
      aggregationIds: [],
    }

    for (const [groupKey, groupEvents] of grouped.entries()) {
      const [lid, feat] = groupKey.split('_')
      const totalQuantity = groupEvents.reduce((sum, e) => sum + (e.quantity || 0), 0)
      const firstEvent = groupEvents[0]

      const aggregationKey = generateAggregationKey(lid, feat, periodStart, periodEnd)

      if (dryRun) {
        console.warn('[UsageAggregator] Dry run - would create aggregation:', {
          aggregationKey,
          licenseId: lid,
          feature: feat,
          totalQuantity,
          eventCount: groupEvents.length,
        })
        result.aggregationIds.push(aggregationKey)
        continue
      }

      // Check if aggregation already exists (idempotency)
      const { data: existing } = await this.supabase
        .from('usage_aggregations')
        .select('id, total_quantity')
        .eq('license_id', lid)
        .eq('feature', feat)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .single()

      if (existing) {
        // Already aggregated - skip or update if quantity changed
        console.warn('[UsageAggregator] Aggregation exists:', {
          aggregationKey,
          existingQuantity: existing.total_quantity,
          newQuantity: totalQuantity,
        })
        result.duplicatesSkipped++
        result.aggregationIds.push(existing.id)
        continue
      }

      // Create new aggregation
      const { data: aggregation, error: insertError } = await this.supabase
        .from('usage_aggregations')
        .insert({
          license_id: lid,
          user_id: firstEvent?.user_id,
          feature: feat,
          total_quantity: totalQuantity,
          event_count: groupEvents.length,
          period_start: periodStart,
          period_end: periodEnd,
          stripe_price_id: this.getStripePriceId(feat),
          is_synced_to_stripe: false,
          metadata: {
            period_type: period,
            first_event: firstEvent?.recorded_at,
            last_event: groupEvents[groupEvents.length - 1]?.recorded_at,
            aggregated_at: new Date().toISOString(),
          },
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('[UsageAggregator] Failed to create aggregation:', insertError)
        continue
      }

      result.aggregationsCreated++
      result.aggregationIds.push(aggregation.id)
    }

    result.eventsProcessed = events.length

    console.warn('[UsageAggregator] Aggregation complete:', {
      eventsProcessed: result.eventsProcessed,
      aggregationsCreated: result.aggregationsCreated,
      duplicatesSkipped: result.duplicatesSkipped,
    })

    return result
  }

  /**
   * Sync aggregated usage to Stripe
   */
  async syncToStripe(options: SyncToStripeOptions): Promise<{
    success: boolean
    recordsSynced: number
    recordsFailed: number
    errors: Array<{ aggregationId: string; error: string }>
  }> {
    const { subscriptionItemId, dryRun = false, dateStart, dateEnd } = options

    // Get aggregations not yet synced to Stripe
    let query = this.supabase
      .from('usage_aggregations')
      .select('*')
      .eq('is_synced_to_stripe', false)

    if (dateStart) {
      query = query.gte('period_start', dateStart)
    }
    if (dateEnd) {
      query = query.lt('period_end', dateEnd)
    }

    const { data: aggregations, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch aggregations: ${fetchError.message}`)
    }

    if (!aggregations || aggregations.length === 0) {
      console.log('[UsageAggregator] No aggregations to sync')
      return { success: true, recordsSynced: 0, recordsFailed: 0, errors: [] }
    }

    console.log('[UsageAggregator] Syncing to Stripe:', {
      subscriptionItemId,
      aggregationsCount: aggregations.length,
      dryRun,
    })

    const result = {
      success: true,
      recordsSynced: 0,
      recordsFailed: 0,
      errors: [] as Array<{ aggregationId: string; error: string }>,
    }

    for (const agg of aggregations) {
      if (dryRun) {
        console.log('[UsageAggregator] Dry run - would sync:', {
          aggregationId: agg.id,
          feature: agg.feature,
          quantity: agg.total_quantity,
          priceId: agg.stripe_price_id,
        })
        result.recordsSynced++
        continue
      }

      // Call Stripe Edge Function
      const { error: stripeError } = await this.supabase.functions.invoke('stripe-usage-record', {
        body: {
          subscription_item_id: agg.subscription_item_id || subscriptionItemId,
          feature: agg.feature,
          usage_records: [
            {
              subscription_item: subscriptionItemId,
              quantity: agg.total_quantity,
              timestamp: Math.floor(new Date(agg.period_start).getTime() / 1000),
              action: 'set',
              idempotency_key: `stripe_sync_${agg.id}`,
            },
          ],
        },
      })

      if (stripeError) {
        console.error('[UsageAggregator] Stripe sync failed:', stripeError)
        result.recordsFailed++
        result.errors.push({
          aggregationId: agg.id,
          error: stripeError.message,
        })
        result.success = false
        continue
      }

      // Mark as synced
      await this.supabase
        .from('usage_aggregations')
        .update({
          is_synced_to_stripe: true,
          synced_at: new Date().toISOString(),
        })
        .eq('id', agg.id)

      result.recordsSynced++
    }

    console.log('[UsageAggregator] Stripe sync complete:', {
      recordsSynced: result.recordsSynced,
      recordsFailed: result.recordsFailed,
    })

    return result
  }

  /**
   * Get aggregation status for a license
   */
  async getAggregationStatus(licenseId: string, options?: { dateStart?: string; dateEnd?: string }): Promise<{
    totalAggregations: number
    syncedToStripe: number
    pendingSync: number
    totalQuantity: number
  }> {
    let query = this.supabase
      .from('usage_aggregations')
      .select('id, total_quantity, is_synced_to_stripe')
      .eq('license_id', licenseId)

    if (options?.dateStart) {
      query = query.gte('period_start', options.dateStart)
    }
    if (options?.dateEnd) {
      query = query.lt('period_end', options.dateEnd)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch aggregation status: ${error.message}`)
    }

    const totalAggregations = data?.length || 0
    const syncedToStripe = data?.filter(a => a.is_synced_to_stripe).length || 0
    const pendingSync = totalAggregations - syncedToStripe
    const totalQuantity = data?.reduce((sum, a) => sum + a.total_quantity, 0) || 0

    return {
      totalAggregations,
      syncedToStripe,
      pendingSync,
      totalQuantity,
    }
  }

  /**
   * Get Stripe price ID for a feature
   */
  private getStripePriceId(feature: string): string | undefined {
    const featureKey = feature as keyof StripePriceMapping
    return STRIPE_PRICE_IDS[featureKey] || STRIPE_PRICE_IDS.api_call
  }

  /**
   * Cleanup old aggregations (retention policy)
   */
  async cleanupOldAggregations(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const { data, error } = await this.supabase
      .from('usage_aggregations')
      .delete()
      .lt('period_end', cutoffDate.toISOString())
      .eq('is_synced_to_stripe', true)
      .select('id')

    if (error) {
      throw new Error(`Failed to cleanup old aggregations: ${error.message}`)
    }

    const deletedCount = data?.length || 0
    console.log('[UsageAggregator] Cleanup complete:', { deletedCount, olderThanDays })
    return deletedCount
  }

  /**
   * Set aggregation period
   */
  setPeriod(period: 'hourly' | 'daily' | 'monthly'): void {
    this.period = period
  }

  private period: 'hourly' | 'daily' | 'monthly' = 'daily'
}

export default UsageAggregator
