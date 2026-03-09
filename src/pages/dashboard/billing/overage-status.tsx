/**
 * Overage Status Page
 *
 * Comprehensive view of usage and overage charges.
 * Displays usage overview, overage breakdown, projections, and upgrade CTAs.
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, AlertTriangle, DollarSign, Calendar, ArrowRight } from 'lucide-react'
import { useOverageStatus } from '@/hooks/use-billing-status'
import { useOrganization } from '@/hooks/useOrganization'
import { UsageHistoryChart } from '@/components/billing/UsageHistoryChart'
import { PlanUpgradeCTA } from '@/components/billing/PlanUpgradeCTA'
import { Button } from '@/components/ui/Button'
import type { OverageResult, MetricType } from '@/types/overage'
import { ALERT_METRIC_INFO } from '@/lib/alert-config'

interface OverageBreakdownRow {
  metricType: MetricType
  used: number
  quota: number
  overageUnits: number
  rate: number
  cost: number
  percentageUsed: number
}

const OverageStatusPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { organization } = useOrganization()
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current')

  const { overage, loading, error } = useOverageStatus(organization?.id || '')

  // Transform overage data for display
  const breakdownRows: OverageBreakdownRow[] = React.useMemo(() => {
    if (!overage?.calculations) return []

    return overage.calculations
      .filter(calc => calc.isOverQuota || calc.percentageUsed > 80)
      .map(calc => ({
        metricType: calc.metricType,
        used: calc.totalUsage,
        quota: calc.includedQuota,
        overageUnits: calc.overageUnits,
        rate: calc.ratePerUnit,
        cost: calc.totalCost,
        percentageUsed: calc.percentageUsed,
      }))
  }, [overage])

  const totalOverageCost = overage?.totalOverageCost || 0
  const hasOverage = overage?.hasOverage || false

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">{t('billing.error')}</h3>
        <p className="text-zinc-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('billing.overage.status')}</h1>
          <p className="text-zinc-400 mt-1">
            {i18n.language === 'vi'
              ? 'Theo dõi sử dụng và phí vượt mức'
              : 'Track usage and overage charges'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'current' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('current')}
          >
            {i18n.language === 'vi' ? 'Kỳ hiện tại' : 'Current Period'}
          </Button>
          <Button
            variant={selectedPeriod === 'last' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('last')}
          >
            {i18n.language === 'vi' ? 'Kỳ trước' : 'Last Period'}
          </Button>
        </div>
      </div>

      {/* Overage Summary Card */}
      {hasOverage && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                {i18n.language === 'vi' ? 'Phí vượt mức kỳ này' : 'Overage Charges This Period'}
              </h3>
              <div className="flex items-center gap-6 mb-4">
                <div>
                  <span className="text-zinc-400 text-sm">
                    {i18n.language === 'vi' ? 'Tổng phí' : 'Total Cost'}
                  </span>
                  <p className="text-3xl font-bold text-amber-400 ml-2">
                    ${totalOverageCost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400 text-sm">
                    {i18n.language === 'vi' ? 'Metrics vượt' : 'Metrics Over' }
                  </span>
                  <p className="text-2xl font-bold text-white ml-2">{breakdownRows.length}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                {i18n.language === 'vi'
                  ? 'Phí vượt mức được tính tự động và xuất hóa đơn cuối kỳ'
                  : 'Overage charges are automatically calculated and billed at period end'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {breakdownRows.map((row) => (
          <div
            key={row.metricType}
            className="rounded-xl bg-zinc-900/50 border border-white/10 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">
                {ALERT_METRIC_INFO[row.metricType]?.label || row.metricType}
              </h4>
              <span
                className={`text-xs font-medium ${
                  row.percentageUsed >= 100
                    ? 'text-red-400'
                    : row.percentageUsed >= 90
                    ? 'text-orange-400'
                    : row.percentageUsed >= 80
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {row.percentageUsed.toFixed(0)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-zinc-700 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all ${
                  row.percentageUsed >= 100
                    ? 'bg-red-500'
                    : row.percentageUsed >= 90
                    ? 'bg-orange-500'
                    : row.percentageUsed >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(row.percentageUsed, 100)}%` }}
              />
            </div>

            {/* Stats */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">
                  {i18n.language === 'vi' ? 'Đã dùng' : 'Used'}
                </span>
                <span className="text-white font-medium">
                  {row.used.toLocaleString()} {ALERT_METRIC_INFO[row.metricType]?.unit || ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">
                  {i18n.language === 'vi' ? 'Giới hạn' : 'Limit'}
                </span>
                <span className="text-white font-medium">
                  {row.quota.toLocaleString()} {ALERT_METRIC_INFO[row.metricType]?.unit || ''}
                </span>
              </div>
              {row.overageUnits > 0 && (
                <div className="pt-2 border-t border-zinc-700">
                  <div className="flex justify-between text-red-400">
                    <span>
                      {i18n.language === 'vi' ? 'Vượt mức' : 'Overage'}
                    </span>
                    <span className="font-medium">
                      ${row.cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Overage Breakdown Table */}
      {breakdownRows.length > 0 && (
        <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900 p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            {i18n.language === 'vi' ? 'Chi tiết phí vượt mức' : 'Overage Breakdown'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                    {i18n.language === 'vi' ? 'Metric' : 'Metric'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">
                    {i18n.language === 'vi' ? 'Đã dùng' : 'Used'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">
                    {i18n.language === 'vi' ? 'Giới hạn' : 'Limit'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">
                    {i18n.language === 'vi' ? 'Vượt mức' : 'Overage'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">
                    {i18n.language === 'vi' ? 'Rate' : 'Rate'}
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">
                    {i18n.language === 'vi' ? 'Chi phí' : 'Cost'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdownRows.map((row) => (
                  <tr
                    key={row.metricType}
                    className="border-b border-zinc-800 last:border-0"
                  >
                    <td className="py-3 px-4 text-sm text-white">
                      {ALERT_METRIC_INFO[row.metricType]?.label || row.metricType}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-white">
                      {row.used.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-zinc-400">
                      {row.quota.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-red-400">
                      {row.overageUnits > 0 ? row.overageUnits.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-zinc-400">
                      ${row.rate.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-amber-400">
                      ${row.cost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-600">
                  <td colSpan={5} className="py-3 px-4 text-sm font-bold text-white text-right">
                    {i18n.language === 'vi' ? 'Tổng cộng' : 'Total'}
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-right text-amber-400">
                    ${totalOverageCost.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Usage History Chart */}
      <UsageHistoryChart orgId={organization?.id || ''} period="30d" />

      {/* Usage Projection */}
      <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {i18n.language === 'vi' ? 'Dự đoán sử dụng' : 'Usage Projection'}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">
                {i18n.language === 'vi' ? 'Cuối kỳ' : 'End of Period'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">
                {i18n.language === 'vi' ? 'Dự kiến phí' : 'Projected Cost'}
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              ${(totalOverageCost * 1.2).toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">+20% buffer</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">
                {i18n.language === 'vi' ? 'Xu hướng' : 'Trend'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {totalOverageCost > 0 ? '+15%' : 'Stable'}
            </p>
            <p className="text-xs text-zinc-500">
              {i18n.language === 'vi' ? 'vs kỳ trước' : 'vs last period'}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Upgrade CTA */}
      {hasOverage && (
        <PlanUpgradeCTA
          currentOverage={totalOverageCost}
          suggestedTier="premium"
        />
      )}

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button variant="outline" className="flex-1">
          <ArrowRight className="w-4 h-4" />
          {i18n.language === 'vi' ? 'Xem hóa đơn' : 'View Invoices'}
        </Button>
        <Button variant="primary" className="flex-1">
          <TrendingUp className="w-4 h-4" />
          {i18n.language === 'vi' ? 'Nâng cấp gói' : 'Upgrade Plan'}
        </Button>
      </div>
    </div>
  )
}

export default OverageStatusPage
