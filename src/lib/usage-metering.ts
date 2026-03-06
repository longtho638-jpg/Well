/**
 * Usage Metering SDK - Track API calls, tokens, compute units per user/org/license
 * Usage: import { UsageMeter } from '@/lib/usage-metering';
 *   const meter = new UsageMeter({ userId, orgId, licenseId });
 *   await meter.track('api_call', { tokens: 1000, computeMs: 250 });
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { apiRateLimiter } from './rate-limiter'

export type UsageMetric = 'api_call' | 'tokens' | 'compute_ms' | 'storage_mb' | 'bandwidth_mb'

export interface UsageEvent {
  metric: UsageMetric
  quantity: number
  metadata?: Record<string, unknown>
  timestamp?: string
}

export interface UsageRecord {
  id: string
  org_id: string
  user_id: string
  license_id?: string
  feature: string
  quantity: number
  metadata: Record<string, unknown>
  recorded_at: string
}

export interface TierLimits {
  api_calls_per_minute: number
  api_calls_per_day: number
  tokens_per_day: number
  compute_minutes_per_day: number
  storage_mb: number
  bandwidth_mb_per_day: number
}

export interface UsageStatus {
  api_calls: { used: number; limit: number; remaining: number; percentage: number }
  tokens: { used: number; limit: number; remaining: number; percentage: number }
  compute: { used: number; limit: number; remaining: number; percentage: number }
  isLimited: boolean
  resetAt?: string
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: { api_calls_per_minute: 5, api_calls_per_day: 100, tokens_per_day: 10_000, compute_minutes_per_day: 10, storage_mb: 100, bandwidth_mb_per_day: 50 },
  basic: { api_calls_per_minute: 20, api_calls_per_day: 1_000, tokens_per_day: 100_000, compute_minutes_per_day: 60, storage_mb: 1_000, bandwidth_mb_per_day: 500 },
  premium: { api_calls_per_minute: 60, api_calls_per_day: 10_000, tokens_per_day: 1_000_000, compute_minutes_per_day: 300, storage_mb: 10_000, bandwidth_mb_per_day: 5_000 },
  enterprise: { api_calls_per_minute: 200, api_calls_per_day: 100_000, tokens_per_day: 10_000_000, compute_minutes_per_day: 1_440, storage_mb: 100_000, bandwidth_mb_per_day: 50_000 },
  master: { api_calls_per_minute: 1000, api_calls_per_day: -1, tokens_per_day: -1, compute_minutes_per_day: -1, storage_mb: 1_000_000, bandwidth_mb_per_day: -1 },
}

export class UsageMeter {
  private supabase: SupabaseClient
  private userId: string
  private orgId?: string
  private licenseId?: string
  private tier: string = 'free'

  constructor(supabase: SupabaseClient, options: { userId: string; orgId?: string; licenseId?: string; tier?: string }) {
    this.supabase = supabase
    this.userId = options.userId
    this.orgId = options.orgId
    this.licenseId = options.licenseId
    this.tier = options.tier || 'free'
  }

  async track(metric: UsageMetric, data: { quantity?: number; tokens?: number; computeMs?: number; metadata?: Record<string, unknown> }): Promise<UsageRecord> {
    const quantity = data.quantity ?? data.tokens ?? data.computeMs ?? 1
    const timestamp = new Date().toISOString()
    const { data: record, error } = await this.supabase.from('usage_records').insert({
      org_id: this.orgId, user_id: this.userId, license_id: this.licenseId, feature: metric,
      quantity, metadata: { ...data.metadata, tier: this.tier }, recorded_at: timestamp,
    }).select().single()
    if (error) throw new Error(`Failed to track usage: ${error.message}`)
    return record as UsageRecord
  }

  async trackBatch(events: UsageEvent[]): Promise<number> {
    const rows = events.map(e => ({ org_id: this.orgId, user_id: this.userId, license_id: this.licenseId,
      feature: e.metric, quantity: e.quantity, metadata: { ...e.metadata, tier: this.tier },
      recorded_at: e.timestamp || new Date().toISOString() }))
    const { count, error } = await this.supabase.from('usage_records').insert(rows, { count: 'exact' })
    if (error) throw new Error(`Failed to batch track: ${error.message}`)
    return count ?? rows.length
  }

  async getUsageStatus(periodStart?: string, periodEnd?: string): Promise<UsageStatus> {
    const now = new Date()
    const start = periodStart || new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const end = periodEnd || new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    const limits = TIER_LIMITS[this.tier] || TIER_LIMITS.free
    const { data: usage } = await this.supabase.from('usage_records').select('feature, quantity')
      .eq('user_id', this.userId).gte('recorded_at', start).lt('recorded_at', end)
    const apiCalls = usage?.filter(u => u.feature === 'api_call').reduce((s, u) => s + u.quantity, 0) || 0
    const tokens = usage?.filter(u => u.feature === 'tokens').reduce((s, u) => s + u.quantity, 0) || 0
    const computeMs = usage?.filter(u => u.feature === 'compute_ms').reduce((s, u) => s + u.quantity, 0) || 0
    const makeStatus = (used: number, limit: number) => ({ used, limit,
      remaining: limit === -1 ? Infinity : Math.max(0, limit - used),
      percentage: limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100)) })
    return {
      api_calls: makeStatus(apiCalls, limits.api_calls_per_day),
      tokens: makeStatus(tokens, limits.tokens_per_day),
      compute: makeStatus(Math.floor(computeMs / 60000), limits.compute_minutes_per_day),
      isLimited: apiCalls >= limits.api_calls_per_day || tokens >= limits.tokens_per_day || Math.floor(computeMs / 60000) >= limits.compute_minutes_per_day,
      resetAt: new Date(end).toISOString(),
    }
  }

  isRateLimited(): { allowed: boolean; remaining?: number; resetAt?: string } {
    const key = this.licenseId || this.userId
    const limits = TIER_LIMITS[this.tier] || TIER_LIMITS.free
    const remaining = apiRateLimiter.getRemaining(key)
    const resetMs = apiRateLimiter.getResetTime(key)
    return { allowed: remaining > 0, remaining: Math.min(remaining, limits.api_calls_per_minute),
      resetAt: resetMs > 0 ? new Date(Date.now() + resetMs).toISOString() : undefined }
  }

  async trackApiCall(endpoint: string, method: string = 'GET', metadata?: Record<string, unknown>): Promise<{ allowed: boolean; remaining?: number; error?: string }> {
    const rateStatus = this.isRateLimited()
    if (!rateStatus.allowed) return { allowed: false, error: `Rate limit exceeded. Try again at ${rateStatus.resetAt}` }
    await this.track('api_call', { quantity: 1, metadata: { endpoint, method, ...metadata } })
    return { allowed: true, remaining: rateStatus.remaining }
  }

  async trackTokens(count: number, metadata?: { model?: string; provider?: string; direction?: 'input' | 'output' }): Promise<UsageRecord> {
    return this.track('tokens', { tokens: count, metadata: metadata as Record<string, unknown> })
  }

  async trackCompute(milliseconds: number, metadata?: { operation?: string; gpu?: boolean }): Promise<UsageRecord> {
    return this.track('compute_ms', { computeMs: milliseconds, metadata: metadata as Record<string, unknown> })
  }
}

export { TIER_LIMITS }
export default UsageMeter
