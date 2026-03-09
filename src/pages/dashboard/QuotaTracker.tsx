/**
 * Quota Tracker Dashboard Page - Phase 6
 *
 * Main dashboard page for tracking quota usage and overage costs.
 * Integrates with useOverageStatus hook for real-time updates.
 *
 * Features:
 * - Real-time quota progress bars
 * - Overage cost breakdown
 * - Transaction history
 * - Upgrade prompts when near limit
 *
 * Usage:
 *   <QuotaTracker />
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOverageStatus } from '@/lib/overage-tracking-client'
import { QuotaProgressBar } from '@/components/overage/QuotaProgressBar'
import { OverageCostBreakdown } from '@/components/overage/OverageCostBreakdown'
import { UsageAnalytics, getQuotaSeverity, getQuotaColor } from '@/lib/usage-analytics'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export const QuotaTracker: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch overage status with 30s polling
  const { overages, summary, loading, error, refresh } = useOverageStatus({
    enabled: true,
    refreshInterval: 30000,
  })

  // Fetch current quota status
  const [quotaStatus, setQuotaStatus] = useState<any>(null)
  const [quotaLoading, setQuotaLoading] = useState(true)

  React.useEffect(() => {
    const fetchQuotaStatus = async () => {
      if (!user) return

      try {
        const analytics = new UsageAnalytics(supabase, { userId: user.id })
        const current = await analytics.getCurrentUsage()
        setQuotaStatus(current)
      } catch (err) {
        console.error('[QuotaTracker] Failed to fetch quota status:', err)
      } finally {
        setQuotaLoading(false)
      }
    }

    fetchQuotaStatus()
  }, [user, refreshKey])

  const handleRefresh = () => {
    refresh()
    setRefreshKey(prev => prev + 1)
  }

  if (loading || quotaLoading) {
    return (
      <div className="quota-tracker-page min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="quota-tracker-page min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              {t('quotaTracker.error', { error })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="quota-tracker-page min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('quotaTracker.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('quotaTracker.subtitle')}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.refresh')}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="summary-card bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t('quotaTracker.totalOverageCost')}
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              ${summary?.totalCost?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="summary-card bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t('quotaTracker.transactions')}
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summary?.totalTransactions || 0}
            </p>
          </div>
          <div className="summary-card bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t('quotaTracker.metricsTracked')}
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {Object.keys(summary?.breakdownByMetric || {}).length}
            </p>
          </div>
        </div>

        {/* Quota Progress Bars */}
        <div className="quota-progress-section mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('quotaTracker.currentUsage')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotaStatus?.quotas && Object.entries(quotaStatus.quotas).map(([metric, quota]: [string, any]) => (
              <QuotaProgressBar
                key={metric}
                metricType={metric}
                currentUsage={quota.used}
                quotaLimit={quota.limit}
                percentage={quota.percentage}
                showDetails={true}
                showWarning={true}
              />
            ))}
          </div>
        </div>

        {/* Overage Cost Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <OverageCostBreakdown
            overages={overages}
            totalCost={summary?.totalCost}
          />
        </div>
      </div>
    </div>
  )
}

export default QuotaTracker
