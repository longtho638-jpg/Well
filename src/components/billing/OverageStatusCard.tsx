/**
 * Overage Status Card - Phase 6
 *
 * Dashboard UI component showing current overage status.
 * Displays usage metrics, overage costs, and forecast warnings.
 *
 * Usage:
 *   <OverageStatusCard orgId={orgId} showForecast={true} />
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useOverageBilling } from '@/hooks/use-overage-billing'
import { AlertTriangle, TrendingUp, DollarSign, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface OverageStatusCardProps {
  orgId: string
  showForecast?: boolean
  compact?: boolean
  className?: string
}

export const OverageStatusCard: React.FC<OverageStatusCardProps> = ({
  orgId,
  showForecast = true,
  compact = false,
  className,
}) => {
  const { t, i18n } = useTranslation()
  const { overageEvents, totalOverageCost, forecast, isLoading, error, payOverage } = useOverageBilling(orgId)

  if (isLoading) {
    return (
      <div className={cn('rounded-2xl border border-zinc-700/50 bg-zinc-900 p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-700 rounded w-1/3" />
          <div className="h-20 bg-zinc-800 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('rounded-2xl border border-red-500/30 bg-red-500/10 p-6', className)}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="text-sm font-semibold text-red-400">
              {i18n.language === 'vi' ? 'Lỗi tải dữ liệu' : 'Error loading data'}
            </h3>
            <p className="text-xs text-red-300 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  const hasOverage = totalOverageCost > 0
  const atRiskMetrics = forecast ? Object.entries(forecast).filter(([_, f]) => f.projectedOverageUnits > 0) : []

  if (!hasOverage && atRiskMetrics.length === 0) {
    return (
      <div className={cn('rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6', className)}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-400">
              {i18n.language === 'vi' ? 'Sử dụng trong giới hạn' : 'Usage within limits'}
            </h3>
            <p className="text-xs text-emerald-300 mt-1">
              {i18n.language === 'vi'
                ? 'Không có phí vượt mức kỳ này'
                : 'No overage charges this period'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {t('billing.overage.title', 'Phí vượt mức')}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {i18n.language === 'vi' ? 'Kỳ hiện tại' : 'Current period'}
            </p>
          </div>
        </div>
        {hasOverage && (
          <Button variant="outline" size="sm" onClick={() => payOverage()}>
            {t('billing.overage.pay_now', 'Thanh toán ngay')}
          </Button>
        )}
      </div>

      {/* Overage Summary */}
      {hasOverage && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-400">
                {t('billing.overage.current_charges', 'Phí hiện tại')}
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              ${totalOverageCost.toFixed(2)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-400">
                {i18n.language === 'vi' ? 'Sự kiện' : 'Events'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {overageEvents.length}
            </p>
          </div>
        </div>
      )}

      {/* Forecast Warning */}
      {showForecast && atRiskMetrics.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">
              {i18n.language === 'vi' ? 'Cảnh báo dự kiến' : 'Forecast Warning'}
            </span>
          </div>
          <div className="space-y-2">
            {atRiskMetrics.slice(0, 3).map(([metricType, forecast]) => (
              <div key={metricType} className="flex items-center justify-between text-sm">
                <span className="text-zinc-300">
                  {t(`billing.overage.metrics.${metricType}`, metricType)}
                </span>
                <span className="text-red-400 font-medium">
                  {i18n.language === 'vi'
                    ? `+${forecast.projectedOverageUnits.toLocaleString()} (${(forecast.confidence * 100).toFixed(0)}%)`
                    : `+${forecast.projectedOverageUnits.toLocaleString()} (${(forecast.confidence * 100).toFixed(0)}%)`}
                </span>
              </div>
            ))}
          </div>
          {atRiskMetrics.length > 3 && (
            <p className="text-xs text-zinc-500 mt-2">
              + {atRiskMetrics.length - 3} {i18n.language === 'vi' ? 'metrics khác' : 'more metrics'}
            </p>
          )}
        </div>
      )}

      {/* Compact Mode - Minimal Display */}
      {compact && (
        <div className="mt-4 pt-4 border-t border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              {t('billing.overage.tracker.total_overage', 'Tổng phí vượt mức')}
            </span>
            <span className="text-lg font-bold text-amber-400">
              ${totalOverageCost.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default OverageStatusCard
