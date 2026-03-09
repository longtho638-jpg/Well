/**
 * Quota Progress Bar Component - Phase 6
 *
 * Displays quota usage as a progress bar with color coding.
 * - Green: < 50% (low)
 * - Yellow: 50-79% (medium)
 * - Orange: 80-89% (high)
 * - Red: 90%+ (critical)
 *
 * Usage:
 *   <QuotaProgressBar
 *     metricType="api_calls"
 *     currentUsage={8500}
 *     quotaLimit={10000}
 *     percentage={85}
 *   />
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { getQuotaSeverity, getQuotaColor } from '@/lib/usage-analytics'

export interface QuotaProgressBarProps {
  metricType: string
  currentUsage: number
  quotaLimit: number
  percentage: number
  showDetails?: boolean
  showWarning?: boolean
  className?: string
}

export const QuotaProgressBar: React.FC<QuotaProgressBarProps> = ({
  metricType,
  currentUsage,
  quotaLimit,
  percentage,
  showDetails = true,
  showWarning = true,
  className = '',
}) => {
  const { t } = useTranslation()
  const severity = getQuotaSeverity(percentage)
  const color = getQuotaColor(severity)
  const remaining = Math.max(0, quotaLimit - currentUsage)
  const isUnlimited = quotaLimit === -1

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getWarningMessage = () => {
    if (isUnlimited) return null
    if (percentage >= 100) return 'Quota exhausted - Upgrade to continue'
    if (percentage >= 90) return 'Critical: Near quota limit'
    if (percentage >= 80) return 'Warning: Approaching quota limit'
    return null
  }

  const warningMessage = getWarningMessage()

  return (
    <div className={`quota-progress-bar ${className}`}>
      {/* Header */}
      <div className="quota-header flex justify-between items-center mb-2">
        <span className="metric-name font-medium text-gray-700 dark:text-gray-300">
          {metricType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
        <span
          className="quota-percentage font-bold"
          style={{ color }}
        >
          {isUnlimited ? '∞' : `${percentage}%`}
        </span>
      </div>

      {/* Progress Track */}
      <div className="progress-track w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="progress-fill h-full transition-all duration-500 ease-out rounded-full"
          style={{
            width: isUnlimited ? '0%' : `${Math.min(percentage, 100)}%`,
            backgroundColor: isUnlimited ? '#10b981' : color,
          }}
        />
      </div>

      {/* Details */}
      {showDetails && (
        <div className="quota-details flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span>
            {formatNumber(currentUsage)} / {isUnlimited ? '∞' : formatNumber(quotaLimit)}
          </span>
          {!isUnlimited && (
            <span className="remaining">
              {remaining.toLocaleString()} remaining
            </span>
          )}
        </div>
      )}

      {/* Warning Message */}
      {showWarning && warningMessage && (
        <div className={`warning-message mt-3 p-3 rounded-lg ${
          severity === 'critical'
            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {percentage >= 100 ? '🚫' : percentage >= 90 ? '⚠️' : '⚡'}
            </span>
            <span className="font-medium">{warningMessage}</span>
          </div>
          {percentage >= 80 && percentage < 100 && (
            <button
              className="mt-2 text-sm underline hover:text-orange-600 dark:hover:text-orange-400"
              onClick={() => window.location.href = '/dashboard/subscription'}
            >
              {t('quotaTracker.upgradePrompt')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default QuotaProgressBar
