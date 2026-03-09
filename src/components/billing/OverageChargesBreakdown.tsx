/**
 * Overage Charges Breakdown Component
 * Displays detailed overage charges by metric type with cost breakdown
 */

import React from 'react'
import { TrendingUp, AlertCircle, CheckCircle, DollarSign } from 'lucide-react'

interface OverageMetric {
  metricType: string
  totalUsage: number
  includedQuota: number
  overageUnits: number
  ratePerUnit: number
  totalCost: number
  percentageUsed: number
  isOverQuota: boolean
}

interface OverageChargesBreakdownProps {
  metrics: OverageMetric[]
  billingPeriod: string
  totalCost: number
  onManageUsage?: () => void
  onViewHistory?: () => void
}

export const OverageChargesBreakdown: React.FC<OverageChargesBreakdownProps> = ({
  metrics,
  billingPeriod,
  totalCost,
  onManageUsage,
  onViewHistory,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatNumber = (num: number, metricType: string): string => {
    // Format based on metric type for readability
    if (metricType.includes('tokens')) {
      return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(num)
    }
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getMetricDisplayName = (metricType: string): string => {
    const displayNames: Record<string, string> = {
      api_calls: 'API Calls',
      ai_calls: 'AI Inferences',
      tokens: 'Tokens',
      compute_minutes: 'Compute Minutes',
      storage_gb: 'Storage (GB)',
      emails: 'Emails',
      model_inferences: 'Model Inferences',
      agent_executions: 'Agent Executions',
    }
    return displayNames[metricType] || metricType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getMetricIcon = (metricType: string) => {
    if (metricType.includes('api')) return TrendingUp
    if (metricType.includes('ai') || metricType.includes('model')) return CheckCircle
    if (metricType.includes('token')) return TrendingUp
    if (metricType.includes('compute')) return TrendingUp
    if (metricType.includes('storage')) return TrendingUp
    if (metricType.includes('email')) return TrendingUp
    if (metricType.includes('agent')) return CheckCircle
    return TrendingUp
  }

  const getProgressColor = (percentage: number, isOverQuota: boolean): string => {
    if (isOverQuota) return 'bg-red-500'
    if (percentage >= 90) return 'bg-amber-500'
    if (percentage >= 75) return 'bg-amber-500/70'
    if (percentage >= 50) return 'bg-blue-500'
    return 'bg-emerald-500'
  }

  const hasOverage = metrics.some(m => m.isOverQuota)

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-800/30 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${hasOverage ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
            {hasOverage ? (
              <AlertCircle className="w-6 h-6 text-amber-400" />
            ) : (
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Phí Overage</h3>
            <p className="text-sm text-zinc-400">Kỳ: {billingPeriod}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400">Tổng cộng</p>
          <p className={`text-2xl font-bold ${hasOverage ? 'text-amber-400' : 'text-emerald-400'}`}>
            {formatCurrency(totalCost)}
          </p>
        </div>
      </div>

      {/* Metrics Breakdown */}
      <div className="space-y-4">
        {metrics.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
            <p>Không có phí overage kỳ này</p>
            <p className="text-sm mt-1">Tất cả usage trong định mức</p>
          </div>
        ) : (
          metrics.map((metric) => {
            const Icon = getMetricIcon(metric.metricType)
            const progressColor = getProgressColor(metric.percentageUsed, metric.isOverQuota)

            return (
              <div
                key={metric.metricType}
                className={`p-4 rounded-xl border ${
                  metric.isOverQuota
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-zinc-800/50 border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${metric.isOverQuota ? 'bg-red-500/10' : 'bg-zinc-700'}`}>
                      <Icon className={`w-4 h-4 ${metric.isOverQuota ? 'text-red-400' : 'text-zinc-400'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{getMetricDisplayName(metric.metricType)}</h4>
                      <p className="text-xs text-zinc-500">
                        {formatNumber(metric.totalUsage, metric.metricType)} / {formatNumber(metric.includedQuota, metric.metricType)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{metric.percentageUsed}%</p>
                    {metric.isOverQuota && (
                      <p className="text-xs text-red-400">Vượt {formatNumber(metric.overageUnits, metric.metricType)}</p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all ${progressColor}`}
                    style={{ width: `${Math.min(metric.percentageUsed, 100)}%` }}
                  />
                </div>

                {/* Cost Details */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3 text-zinc-500" />
                    <span className="text-zinc-400">Rate: ${metric.ratePerUnit.toFixed(6)}/{metric.metricType.includes('per_') ? '' : ''}unit</span>
                  </div>
                  {metric.isOverQuota && (
                    <div className="text-red-400 font-medium">
                      +{formatCurrency(metric.totalCost)} overage
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Action Buttons */}
      {(onManageUsage || onViewHistory) && (
        <div className="flex gap-2 mt-6 pt-4 border-t border-zinc-700">
          {onManageUsage && (
            <button
              onClick={onManageUsage}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-medium transition-colors"
            >
              Quản lý Usage
            </button>
          )}
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="flex-1 py-2.5 rounded-xl border border-zinc-600 hover:bg-zinc-700 text-white font-medium transition-colors"
            >
              Lịch sử
            </button>
          )}
        </div>
      )}
    </div>
  )
}
