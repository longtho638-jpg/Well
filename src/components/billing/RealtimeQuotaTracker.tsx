/**
 * Real-time Quota Tracker Component - Phase 7
 *
 * Displays live usage vs quota with threshold indicators (80%/90%/100%).
 * Uses Supabase Realtime for instant updates when usage changes.
 *
 * Features:
 * - Real-time updates via Supabase Realtime
 * - Visual threshold indicators (80%/90%/100%)
 * - Animations with Framer Motion
 * - Multi-metric support
 * - Overage cost display
 *
 * Usage:
 *   <RealtimeQuotaTracker
 *     userId={userId}
 *     metrics={['api_calls', 'tokens', 'compute_minutes']}
 *     thresholds={[80, 90, 100]}
 *   />
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { analyticsLogger } from '@/utils/logger'

export type AlertMetricType = 'api_calls' | 'ai_calls' | 'tokens' | 'compute_minutes' | 'storage_gb' | 'emails' | 'model_inferences' | 'agent_executions'

export interface UsageMetric {
  used: number
  limit: number
  remaining: number
  percentage: number
  isOverLimit: boolean
  overageUnits?: number
  overageCost?: number
}

export interface RealtimeQuotaTrackerProps {
  userId: string
  orgId?: string
  metrics?: AlertMetricType[]
  thresholds?: number[]
  showOverageCost?: boolean
  compact?: boolean
}

const DEFAULT_THRESHOLDS = [80, 90, 100]
const DEFAULT_METRICS: AlertMetricType[] = [
  'api_calls',
  'tokens',
  'compute_minutes',
  'model_inferences',
  'agent_executions',
]

const METRIC_LABELS: Record<AlertMetricType, { vi: string; en: string }> = {
  api_calls: { vi: 'API calls', en: 'API Calls' },
  ai_calls: { vi: 'AI calls', en: 'AI Calls' },
  tokens: { vi: 'Tokens', en: 'Tokens' },
  compute_minutes: { vi: 'Compute', en: 'Compute' },
  storage_gb: { vi: 'Storage', en: 'Storage' },
  emails: { vi: 'Emails', en: 'Emails' },
  model_inferences: { vi: 'Inferences', en: 'Inferences' },
  agent_executions: { vi: 'Agents', en: 'Agents' },
}

const METRIC_UNITS: Record<AlertMetricType, string> = {
  api_calls: 'calls',
  ai_calls: 'calls',
  tokens: 'tokens',
  compute_minutes: 'min',
  storage_gb: 'GB',
  emails: 'emails',
  model_inferences: 'inferences',
  agent_executions: 'executions',
}

export const RealtimeQuotaTracker: React.FC<RealtimeQuotaTrackerProps> = ({
  userId,
  orgId,
  metrics = DEFAULT_METRICS,
  thresholds = DEFAULT_THRESHOLDS,
  showOverageCost = true,
  compact = false,
}) => {
  const [usageData, setUsageData] = useState<Record<AlertMetricType, UsageMetric>>({} as Record<AlertMetricType, UsageMetric>)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch initial usage data
  const fetchUsage = useCallback(async () => {
    try {
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL!,
        import.meta.env.VITE_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase
        .from('usage_records')
        .select('feature, quantity, recorded_at')
        .eq('user_id', userId)
        .gte('recorded_at', new Date().setHours(0, 0, 0, 0).toString())
        .order('recorded_at', { ascending: false })

      if (error) throw error

      // Aggregate usage by metric
      const aggregated: Record<string, number> = {}
      data?.forEach((record) => {
        const metric = mapFeatureToMetric(record.feature)
        if (metric) {
          aggregated[metric] = (aggregated[metric] || 0) + record.quantity
        }
      })

      // Get limits from subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_slug, metadata')
        .eq(orgId ? 'org_id' : 'user_id', orgId || userId)
        .eq('status', 'active')
        .single()

      const tier = subscription?.plan_slug || 'free'
      const limits = getTierLimits(tier)

      // Build usage data
      const newUsageData: Record<AlertMetricType, UsageMetric> = {} as any

      metrics.forEach((metric) => {
        const used = aggregated[metric] || 0
        const limit = limits[`${metric}_per_day`] || -1
        const isOverLimit = limit !== -1 && used > limit
        const remaining = limit === -1 ? Infinity : Math.max(0, limit - used)
        const percentage = limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100))
        const overageUnits = isOverLimit ? used - limit : 0
        const overageRate = getOverageRate(metric, tier)
        const overageCost = overageUnits * overageRate

        newUsageData[metric] = {
          used,
          limit,
          remaining,
          percentage,
          isOverLimit,
          overageUnits,
          overageCost,
        }
      })

      setUsageData(newUsageData)
      setLastUpdated(new Date())
    } catch (error) {
      analyticsLogger.error('[RealtimeQuotaTracker] Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, orgId, metrics])

  // Initial fetch
  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('usage_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usage_records',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Debounce updates to avoid spam
          setTimeout(fetchUsage, 1000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchUsage])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {metrics.map((metric) => (
          <div key={metric} className="h-20 bg-zinc-800/50 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Sử dụng theo thời gian thực
        </h3>
        {lastUpdated && (
          <span className="text-xs text-zinc-500">
            Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric) => {
          const data = usageData[metric]
          if (!data) return null

          return (
            <MetricCard
              key={metric}
              metric={metric}
              data={data}
              thresholds={thresholds}
              showOverageCost={showOverageCost}
              compact={compact}
            />
          )
        })}
      </div>

      {/* Summary */}
      <SummaryCard usageData={usageData} showOverageCost={showOverageCost} />
    </div>
  )
}

// ============================================================
// Metric Card Component
// ============================================================

interface MetricCardProps {
  metric: AlertMetricType
  data: UsageMetric
  thresholds: number[]
  showOverageCost?: boolean
  compact?: boolean
}

const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  data,
  thresholds,
  showOverageCost = true,
  compact = false,
}) => {
  const { used, limit, percentage, isOverLimit, overageCost } = data

  // Determine color based on threshold
  const getThresholdColor = () => {
    if (isOverLimit) return 'text-red-400'
    if (percentage >= 90) return 'text-red-400'
    if (percentage >= 80) return 'text-amber-400'
    return 'text-emerald-400'
  }

  const getBarColor = () => {
    if (isOverLimit) return 'bg-red-500'
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 80) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getThresholdIndicator = () => {
    const activeThreshold = thresholds.find((t) => percentage >= t)
    if (!activeThreshold) return null

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
          activeThreshold === 100
            ? 'bg-red-500/20 text-red-400'
            : activeThreshold === 90
            ? 'bg-red-500/20 text-red-400'
            : 'bg-amber-500/20 text-amber-400'
        }`}
      >
        {activeThreshold}%
      </motion.div>
    )
  }

  // Default to Vietnamese locale
  const locale = 'vi'

  if (compact) {
    return (
      <div className="p-3 rounded-lg bg-zinc-800/50 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">
            {METRIC_LABELS[metric][locale]}
          </span>
          <span className={`text-xs font-medium ${getThresholdColor()}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${getBarColor()}`}
          />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-4 rounded-xl bg-zinc-800/50 border border-white/10"
    >
      {getThresholdIndicator()}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white">
          {METRIC_LABELS[metric][locale]}
        </h4>
        <span className={`text-xs font-medium ${getThresholdColor()}`}>
          {isOverLimit ? 'Vượt giới hạn' : `${percentage.toFixed(0)}%`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-zinc-700 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${getBarColor()}`}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-zinc-400">Đã dùng: </span>
          <span className="text-white font-medium">
            {used.toLocaleString()} {METRIC_UNITS[metric]}
          </span>
        </div>
        <div className="text-right">
          <span className="text-zinc-400">Giới hạn: </span>
          <span className="text-white font-medium">
            {limit === -1 ? '∞' : limit.toLocaleString()} {METRIC_UNITS[metric]}
          </span>
        </div>
      </div>

      {/* Overage Cost */}
      {showOverageCost && isOverLimit && overageCost && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <p className="text-xs text-red-400">
            Phí vượt mức: ${(overageCost / 100).toFixed(2)}
          </p>
        </motion.div>
      )}

      {/* Remaining */}
      {!isOverLimit && limit !== -1 && (
        <div className="mt-2 text-xs text-zinc-500">
          Còn lại: {(limit - used).toLocaleString()} {METRIC_UNITS[metric]}
        </div>
      )}
    </motion.div>
  )
}

// ============================================================
// Summary Card Component
// ============================================================

interface SummaryCardProps {
  usageData: Record<AlertMetricType, UsageMetric>
  showOverageCost?: boolean
}

const SummaryCard: React.FC<SummaryCardProps> = ({ usageData, showOverageCost = true }) => {
  const locale = 'vi'
  const metrics = Object.entries(usageData)
  const overLimitCount = metrics.filter(([_, data]) => data.isOverLimit).length
  const totalOverageCost = metrics.reduce((sum, [_, data]) => sum + (data.overageCost || 0), 0)

  if (overLimitCount === 0 && totalOverageCost === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${
        overLimitCount > 0
          ? 'bg-red-500/10 border-red-500/20'
          : 'bg-amber-500/10 border-amber-500/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-white">
            {overLimitCount > 0
              ? `⚠️ ${overLimitCount} metric vượt giới hạn`
              : '⚠️ Sắp vượt giới hạn'}
          </h4>
          {showOverageCost && totalOverageCost > 0 && (
            <p className="text-sm text-zinc-400 mt-1">
              Tổng phí vượt mức: ${(totalOverageCost / 100).toFixed(2)}
            </p>
          )}
        </div>
        <a
          href="/dashboard/billing"
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Quản lý →
        </a>
      </div>
    </motion.div>
  )
}

// ============================================================
// Helper Functions
// ============================================================

function mapFeatureToMetric(feature: string): AlertMetricType | null {
  const mapping: Record<string, AlertMetricType> = {
    api_call: 'api_calls',
    tokens: 'tokens',
    compute_ms: 'compute_minutes',
    compute_minutes: 'compute_minutes',
    model_inference: 'model_inferences',
    agent_execution: 'agent_executions',
  }
  return mapping[feature] || null
}

function getTierLimits(tier: string): Record<string, number> {
  const limits: Record<string, Record<string, number>> = {
    free: {
      api_calls_per_day: 100,
      tokens_per_day: 10000,
      compute_minutes_per_day: 10,
      model_inferences_per_day: 10,
      agent_executions_per_day: 5,
    },
    basic: {
      api_calls_per_day: 1000,
      tokens_per_day: 100000,
      compute_minutes_per_day: 60,
      model_inferences_per_day: 100,
      agent_executions_per_day: 50,
    },
    pro: {
      api_calls_per_day: 10000,
      tokens_per_day: 1000000,
      compute_minutes_per_day: 300,
      model_inferences_per_day: 1000,
      agent_executions_per_day: 500,
    },
    enterprise: {
      api_calls_per_day: 100000,
      tokens_per_day: 10000000,
      compute_minutes_per_day: 1440,
      model_inferences_per_day: 10000,
      agent_executions_per_day: 5000,
    },
    master: {
      api_calls_per_day: -1,
      tokens_per_day: -1,
      compute_minutes_per_day: -1,
      model_inferences_per_day: -1,
      agent_executions_per_day: -1,
    },
  }
  return limits[tier] || limits.free
}

function getOverageRate(metric: AlertMetricType, tier: string): number {
  const rates: Record<AlertMetricType, Record<string, number>> = {
    api_calls: { free: 0.001, basic: 0.0008, pro: 0.0005, enterprise: 0.0003, master: 0.0001 },
    ai_calls: { free: 0.05, basic: 0.04, pro: 0.03, enterprise: 0.02, master: 0.01 },
    tokens: { free: 0.000004, basic: 0.000003, pro: 0.000002, enterprise: 0.000001, master: 0.0000005 },
    compute_minutes: { free: 0.01, basic: 0.008, pro: 0.005, enterprise: 0.003, master: 0.001 },
    storage_gb: { free: 0.5, basic: 0.4, pro: 0.3, enterprise: 0.2, master: 0.1 },
    emails: { free: 0.002, basic: 0.0015, pro: 0.001, enterprise: 0.0005, master: 0.0002 },
    model_inferences: { free: 0.02, basic: 0.015, pro: 0.01, enterprise: 0.005, master: 0.0025 },
    agent_executions: { free: 0.1, basic: 0.08, pro: 0.05, enterprise: 0.03, master: 0.015 },
  }

  return rates[metric]?.[tier.toLowerCase()] || rates[metric]?.basic || 0
}

export default RealtimeQuotaTracker
