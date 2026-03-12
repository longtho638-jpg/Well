/**
 * Model Usage Breakdown - Phase 2.3
 * Stacked area chart showing token usage by AI model
 * Falls back to aggregate data if model-specific data unavailable
 */

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useLicenseAnalytics } from '@/hooks/use-license-analytics'
import { Cpu } from 'lucide-react'

const MODEL_COLORS: Record<string, string> = {
  'gpt-4': '#8b5cf6',
  'gpt-3.5-turbo': '#3b82f6',
  'claude-3': '#10b981',
  'claude-2': '#059669',
  'aggregate': '#f59e0b',
  'other': '#6b7280',
}

interface ModelUsageBreakdownProps {
  className?: string
}

export function ModelUsageBreakdown({ className }: ModelUsageBreakdownProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  const { modelUsage, loading } = useLicenseAnalytics({ days })

  const chartData = useMemo(() => {
    if (!modelUsage || modelUsage.length === 0) return []

    // For area chart, we need time-series data
    // Since we only have aggregates, create a simple representation
    return modelUsage.map((model) => ({
      name: model.model_name === 'Aggregate' ? 'All Models' : model.model_name,
      tokens: model.total_tokens,
      requests: model.total_requests,
      avgTokens: model.avg_tokens_per_request,
      percentage: model.percentage_of_total,
      color: MODEL_COLORS[model.model_name.toLowerCase()] || MODEL_COLORS.other,
    }))
  }, [modelUsage])

  const totalTokens = useMemo(() => {
    return modelUsage.reduce((sum, m) => sum + m.total_tokens, 0)
  }, [modelUsage])

  const totalRequests = useMemo(() => {
    return modelUsage.reduce((sum, m) => sum + m.total_requests, 0)
  }, [modelUsage])

  if (loading) {
    return (
      <div className={cn('p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50', className)}>
        <div className="h-64 animate-pulse bg-gray-700/30 rounded-xl" />
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className={cn('p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50', className)}>
        <p className="text-gray-400 text-center py-8">No model usage data available</p>
      </div>
    )
  }

  return (
    <div className={cn('p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            AI Model Usage Breakdown
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Token consumption by model ({days} days)
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1 border border-white/10">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                dateRange === range
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white border border-transparent'
              )}
            >
              {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <p className="text-xs text-purple-300 mb-1">Total Tokens</p>
          <p className="text-xl font-bold text-purple-400">
            {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalTokens)}
          </p>
        </div>
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-xs text-blue-300 mb-1">Total Requests</p>
          <p className="text-xl font-bold text-blue-400">
            {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalRequests)}
          </p>
        </div>
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-xs text-emerald-300 mb-1">Avg Tokens/Request</p>
          <p className="text-xl font-bold text-emerald-400">
            {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(
              totalRequests > 0 ? totalTokens / totalRequests : 0
            )}
          </p>
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chartData.map((model) => (
          <div
            key={model.name}
            className="p-4 bg-gray-800/30 rounded-xl border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: model.color }}
              />
              <span className="text-sm font-medium text-white">{model.name}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Tokens</span>
                <span className="text-sm font-bold text-white">
                  {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(model.tokens)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Requests</span>
                <span className="text-sm text-gray-300">
                  {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(model.requests)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Share</span>
                <span className="text-sm font-semibold text-white">{model.percentage.toFixed(1)}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${model.percentage}%`,
                  backgroundColor: model.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ModelUsageBreakdown
