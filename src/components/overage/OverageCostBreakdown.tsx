/**
 * Overage Cost Breakdown Component - Phase 6
 *
 * Displays breakdown of overage costs by metric type.
 * Shows transaction history and total costs.
 *
 * Usage:
 *   <OverageCostBreakdown overages={overages} totalCost={totalCost} />
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import type { OverageTransaction } from '@/lib/overage-tracking-client'

export interface OverageCostBreakdownProps {
  overages: OverageTransaction[]
  totalCost?: number
  className?: string
}

export const OverageCostBreakdown: React.FC<OverageCostBreakdownProps> = ({
  overages,
  totalCost,
  className = '',
}) => {
  const { t } = useTranslation()

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatMetricName = (metricType: string): string => {
    return t(`quotaTracker.metricTypes.${metricType}`) || metricType.replace(/_/g, ' ')
  }

  const formatSyncStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: t('quotaTracker.syncStatus.pending'),
      synced: t('quotaTracker.syncStatus.synced'),
      failed: t('quotaTracker.syncStatus.failed'),
    }
    return statusMap[status] || status
  }

  const getSyncStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: '#f59e0b',    // amber-500
      synced: '#10b981',     // emerald-500
      failed: '#ef4444',     // red-500
    }
    return colors[status] || '#6b7280'
  }

  // Group by metric type
  const groupedByMetric = overages.reduce((acc, tx) => {
    acc[tx.metricType] = (acc[tx.metricType] || 0) + tx.totalCost
    return acc
  }, {} as Record<string, number>)

  const sortedMetrics = Object.entries(groupedByMetric)
    .sort((a, b) => b[1] - a[1])

  return (
    <div className={`overage-cost-breakdown ${className}`}>
      {/* Summary Card */}
      {totalCost !== undefined && (
        <div className="summary-card bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {t('quotaTracker.totalOverageCost')}
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalCost)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('quotaTracker.billingPeriod')}: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* Breakdown by Metric */}
      {sortedMetrics.length > 0 && (
        <div className="breakdown-section mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('quotaTracker.breakdownByMetric')}
          </h3>
          <div className="space-y-3">
            {sortedMetrics.map(([metric, cost]) => (
              <div
                key={metric}
                className="breakdown-item flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatMetricName(metric)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('quotaTracker.overageUnits', {
                        units: overages.filter(tx => tx.metricType === metric).reduce((sum, tx) => sum + tx.overageUnits, 0),
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(cost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      {overages.length > 0 && (
        <div className="transaction-history">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('quotaTracker.transactionHistory')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    {t('quotaTracker.metric')}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    {t('quotaTracker.usage')}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    {t('quotaTracker.overage')}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    {t('quotaTracker.cost')}
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    {t('quotaTracker.syncStatus.label')}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    {t('quotaTracker.date')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {overages.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {formatMetricName(tx.metricType)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                      {tx.totalUsage.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                      {tx.overageUnits.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-purple-600 dark:text-purple-400">
                      {formatCurrency(tx.totalCost)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${getSyncStatusColor(tx.stripeSyncStatus)}20`,
                          color: getSyncStatusColor(tx.stripeSyncStatus),
                        }}
                      >
                        {formatSyncStatus(tx.stripeSyncStatus)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500 dark:text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {overages.length === 0 && (
        <div className="empty-state text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('quotaTracker.noOverage')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('quotaTracker.noOverageDescription')}
          </p>
        </div>
      )}
    </div>
  )
}

export default OverageCostBreakdown
