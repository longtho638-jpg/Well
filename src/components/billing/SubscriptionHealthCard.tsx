/**
 * Subscription Health Card Component
 * Displays comprehensive subscription health status with score, usage, and alerts
 */

import React from 'react'
import { Activity, AlertTriangle, CheckCircle, TrendingUp, DollarSign } from 'lucide-react'
import type { SubscriptionHealthStatus, HealthScore } from '@/lib/subscription-health'
import { getHealthScoreColor, getHealthScoreBg, getHealthScoreBorder } from '@/lib/subscription-health'

interface SubscriptionHealthCardProps {
  health: SubscriptionHealthStatus
  onUpgrade?: () => void
  onViewDetails?: () => void
}

export const SubscriptionHealthCard: React.FC<SubscriptionHealthCardProps> = ({
  health,
  onUpgrade,
  onViewDetails,
}) => {
  const scoreColor = getHealthScoreColor(health.healthScore)
  const scoreBg = getHealthScoreBg(health.healthScore)
  const scoreBorder = getHealthScoreBorder(health.healthScore)

  const ScoreIcon = health.healthScore === 'critical' || health.healthScore === 'warning'
    ? AlertTriangle
    : health.healthScore === 'excellent' || health.healthScore === 'good'
    ? CheckCircle
    : Activity

  const getHealthLabel = (score: HealthScore) => {
    switch (score) {
      case 'excellent': return 'Tuyệt vời'
      case 'good': return 'Tốt'
      case 'warning': return 'Cảnh báo'
      case 'critical': return 'Nguy kịch'
      default: return 'Không rõ'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'trialing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'past_due': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'unpaid':
      case 'canceled': return 'bg-red-500/10 text-red-400 border-red-500/20'
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  return (
    <div className={`rounded-2xl border p-6 ${scoreBg} ${scoreBorder}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${scoreBg}`}>
            <ScoreIcon className={`w-6 h-6 ${scoreColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Tình trạng Subscription</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-medium ${scoreColor}`}>
                {getHealthLabel(health.healthScore)}
              </span>
              <span className="text-xs text-zinc-400">
                {health.healthPercentage}% health
              </span>
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(health.subscriptionStatus)}`}>
          {health.subscriptionStatus.toUpperCase()}
        </div>
      </div>

      {/* Health Score Progress */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Health Score</span>
          <span className={`font-medium ${scoreColor}`}>{health.healthPercentage}%</span>
        </div>
        <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              health.healthScore === 'critical' ? 'bg-red-500' :
              health.healthScore === 'warning' ? 'bg-amber-500' :
              health.healthScore === 'good' ? 'bg-blue-500' :
              'bg-emerald-500'
            }`}
            style={{ width: `${health.healthPercentage}%` }}
          />
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Quota Usage */}
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-zinc-400">Usage</span>
          </div>
          <div className={`text-lg font-bold ${health.isNearQuota ? 'text-amber-400' : 'text-white'}`}>
            {health.quotaUsagePercentage}%
          </div>
          <div className="text-xs text-zinc-500">
            {health.isNearQuota ? 'Gần hết quota' : 'Trong định mức'}
          </div>
        </div>

        {/* Overage Cost */}
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-400">Overage</span>
          </div>
          <div className={`text-lg font-bold ${health.hasOverage ? 'text-amber-400' : 'text-white'}`}>
            {formatCurrency(health.totalOverageCost)}
          </div>
          <div className="text-xs text-zinc-500">
            {health.hasOverage ? 'Phí vượt mức' : 'Không có phí'}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(health.hasDunningEvents || health.hasOverage || health.paymentMethodStatus === 'failed') && (
        <div className="space-y-2 mb-6">
          {health.hasDunningEvents && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400">
                  Thanh toán thất bại - {health.dunningStage}
                </span>
              </div>
              <div className="text-xs text-amber-300/70 mt-1">
                Số tiền: {formatCurrency(health.amountAtRisk)}
              </div>
            </div>
          )}

          {health.hasOverage && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">
                  Có phí overage kỳ này
                </span>
              </div>
              <div className="text-xs text-blue-300/70 mt-1">
                Tổng: {formatCurrency(health.totalOverageCost)}
              </div>
            </div>
          )}

          {health.paymentMethodStatus === 'failed' && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">
                  Phương thức thanh toán thất bại
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-zinc-700">
        <div>
          <span className="text-zinc-400">Gia hạn:</span> {formatDate(health.currentPeriodEnd)}
        </div>
        <div>
          <span className="text-zinc-400">Sync:</span> {health.lastSyncAt ? new Date(health.lastSyncAt).toLocaleString('vi-VN') : 'N/A'}
        </div>
      </div>

      {/* Action Buttons */}
      {(onUpgrade || onViewDetails) && (
        <div className="flex gap-2 mt-4">
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-medium transition-colors"
            >
              Upgrade Plan
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 py-2.5 rounded-xl border border-zinc-600 hover:bg-zinc-700 text-white font-medium transition-colors"
            >
              Chi tiết
            </button>
          )}
        </div>
      )}
    </div>
  )
}
