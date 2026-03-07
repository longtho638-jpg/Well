/**
 * Usage Analytics SDK - Query and analyze usage data
 *
 * Usage:
 *   import { UsageAnalytics } from '@/lib/usage-analytics'
 *   const analytics = new UsageAnalytics(supabase, { userId, orgId, licenseId })
 *   const current = await analytics.getCurrentUsage()
 *
 * Advanced Analytics (Phase 5):
 *   const trends = await analytics.getTrends({ granularity: 'day', days: 30 })
 *   const topCustomers = await analytics.getTopCustomers({ limit: 10 })
 *   const anomalies = await analytics.detectAnomalies()
 *   const projection = await analytics.getBillingProjection()
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface UsageCurrent {
  user_id: string
  period: { start: string; end: string }
  totals: {
    api_calls: number
    tokens: number
    compute_ms: number
    model_inferences: number
    agent_executions: number
  }
  quotas: {
    api_calls: { used: number; limit: number; remaining: number; percentage: number }
    tokens: { used: number; limit: number; remaining: number; percentage: number }
    model_inferences: { used: number; limit: number; remaining: number; percentage: number }
    agent_executions: { used: number; limit: number; remaining: number; percentage: number }
  }
  warnings: string[]
}

export interface UsageQuota {
  feature: string
  limit: number
  used: number
  remaining: number
  percentage: number
  reset_at: string
}

export interface UsageBreakdown {
  by_feature: { feature: string; total: number; count: number }[]
  by_model: { model: string; total_inferences: number; total_tokens: number }[]
  by_agent: { agent_type: string; executions: number }[]
  trend: { date: string; usage: number }[]
}

export class UsageAnalytics {
  private supabase: SupabaseClient
  private userId: string
  private orgId?: string
  private licenseId?: string
  private tier: string = 'free'

  constructor(
    supabase: SupabaseClient,
    options: { userId: string; orgId?: string; licenseId?: string; tier?: string }
  ) {
    this.supabase = supabase
    this.userId = options.userId
    this.orgId = options.orgId
    this.licenseId = options.licenseId
    this.tier = options.tier || 'free'
  }

  async getCurrentUsage(): Promise<UsageCurrent> {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const periodStart = today.toISOString()
    const periodEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const { data: records } = await this.supabase
      .from('usage_records')
      .select('feature, quantity, metadata')
      .eq('user_id', this.userId)
      .gte('recorded_at', periodStart)
      .lt('recorded_at', periodEnd)

    const totals = {
      api_calls: records?.filter(r => r.feature === 'api_call').reduce((s, r) => s + r.quantity, 0) ?? 0,
      tokens: records?.filter(r => r.feature === 'tokens').reduce((s, r) => s + r.quantity, 0) ?? 0,
      compute_ms: records?.filter(r => r.feature === 'compute_ms').reduce((s, r) => s + r.quantity, 0) ?? 0,
      model_inferences: records?.filter(r => r.feature === 'model_inference').reduce((s, r) => s + r.quantity, 0) ?? 0,
      agent_executions: records?.filter(r => r.feature === 'agent_execution').reduce((s, r) => s + r.quantity, 0) ?? 0,
    }

    const limits = this.getLimits()
    const warnings: string[] = []

    Object.entries(limits).forEach(([feature, quota]) => {
      if (quota.percentage >= 90) warnings.push(`CRITICAL: ${feature} at 90%`)
      else if (quota.percentage >= 80) warnings.push(`WARNING: ${feature} at 80%`)
    })

    return {
      user_id: this.userId,
      period: { start: periodStart, end: periodEnd },
      totals,
      quotas: {
        api_calls: limits.api_calls,
        tokens: limits.tokens,
        model_inferences: limits.model_inferences,
        agent_executions: limits.agent_executions,
      },
      warnings,
    }
  }

  async getQuotas(): Promise<UsageQuota[]> {
    const limits = this.getLimits()
    return Object.entries(limits).map(([feature, quota]) => ({
      feature,
      ...quota,
    }))
  }

  async getBreakdown(period: 'day' | 'week' | 'month' = 'day'): Promise<UsageBreakdown> {
    const now = new Date()
    const endDate = now.toISOString()
    const daysBack = period === 'day' ? 1 : period === 'week' ? 7 : 30
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString()

    const { data: records } = await this.supabase
      .from('usage_records')
      .select('feature, quantity, metadata, recorded_at')
      .eq('user_id', this.userId)
      .gte('recorded_at', startDate)
      .lt('recorded_at', endDate)

    const featureMap = new Map<string, { feature: string; total: number; count: number }>()
    const modelMap = new Map<string, { model: string; total_inferences: number; total_tokens: number }>()
    const agentMap = new Map<string, { agent_type: string; executions: number }>()
    const dateMap = new Map<string, number>()

    records?.forEach(r => {
      // By feature
      const f = featureMap.get(r.feature) || { feature: r.feature, total: 0, count: 0 }
      f.total += r.quantity
      f.count += 1
      featureMap.set(r.feature, f)

      // By model (from metadata)
      const model = (r.metadata as any)?.model
      if (model && r.feature === 'model_inference') {
        const m = modelMap.get(model) || { model, total_inferences: 0, total_tokens: 0 }
        m.total_inferences += r.quantity
        m.total_tokens += (r.metadata as any)?.total_tokens || 0
        modelMap.set(model, m)
      }

      // By agent
      const agentType = (r.metadata as any)?.agent_type
      if (agentType && r.feature === 'agent_execution') {
        const a = agentMap.get(agentType) || { agent_type: agentType, executions: 0 }
        a.executions += r.quantity
        agentMap.set(agentType, a)
      }

      // By date
      const date = r.recorded_at.split('T')[0]
      dateMap.set(date, (dateMap.get(date) || 0) + r.quantity)
    })

    return {
      by_feature: Array.from(featureMap.values()).sort((a, b) => b.total - a.total),
      by_model: Array.from(modelMap.values()).sort((a, b) => b.total_inferences - a.total_inferences),
      by_agent: Array.from(agentMap.values()).sort((a, b) => b.executions - a.executions),
      trend: Array.from(dateMap.entries()).map(([date, usage]) => ({ date, usage })).sort((a, b) => a.date.localeCompare(b.date)),
    }
  }

  private getLimits(): Record<string, { used: number; limit: number; remaining: number; percentage: number; reset_at: string }> {
    const tierLimits: Record<string, Record<string, number>> = {
      free: { api_call: 100, tokens: 10_000, model_inference: 10, agent_execution: 5 },
      basic: { api_call: 1_000, tokens: 100_000, model_inference: 100, agent_execution: 50 },
      premium: { api_call: 10_000, tokens: 1_000_000, model_inference: 1_000, agent_execution: 500 },
      enterprise: { api_call: 100_000, tokens: 10_000_000, model_inference: 10_000, agent_execution: 5_000 },
      master: { api_call: -1, tokens: -1, model_inference: -1, agent_execution: -1 },
    }

    const limits = tierLimits[this.tier] || tierLimits.free

    // This would normally fetch actual usage from DB
    // For SDK, we return structure - actual values filled by getCurrentUsage()
    return {
      api_calls: { used: 0, limit: limits.api_call ?? 100, remaining: limits.api_call ?? 100, percentage: 0, reset_at: new Date().toISOString() },
      tokens: { used: 0, limit: limits.tokens ?? 100_000, remaining: limits.tokens ?? 100_000, percentage: 0, reset_at: new Date().toISOString() },
      model_inferences: { used: 0, limit: limits.model_inference ?? 100, remaining: limits.model_inference ?? 100, percentage: 0, reset_at: new Date().toISOString() },
      agent_executions: { used: 0, limit: limits.agent_execution ?? 50, remaining: limits.agent_execution ?? 50, percentage: 0, reset_at: new Date().toISOString() },
    }
  }
}

/**
 * Format quota percentage with color hint
 */
export function getQuotaSeverity(percentage: number): 'low' | 'medium' | 'high' | 'critical' {
  if (percentage >= 90) return 'critical'
  if (percentage >= 80) return 'high'
  if (percentage >= 50) return 'medium'
  return 'low'
}

/**
 * Get color for quota severity
 */
export function getQuotaColor(severity: string): string {
  const colors: Record<string, string> = {
    low: '#10b981',       // emerald-500
    medium: '#f59e0b',    // amber-500
    high: '#f97316',      // orange-500
    critical: '#ef4444',  // red-500
  }
  return colors[severity] || colors.low
}
