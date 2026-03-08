/**
 * Usage Alert Banner - Phase 6 Real-time Alerts
 *
 * Displays warning banner when usage exceeds threshold (80%, 90%, 100%).
 * Supports dismissal and click-through to usage dashboard.
 */

import React from 'react'
import { AlertBannerProps, getAlertColor, getAlertSeverity, formatAlertMessage, ALERT_METRIC_INFO } from '@/types/usage-alerts'

export const UsageAlertBanner: React.FC<AlertBannerProps> = ({
  metricType,
  thresholdPercentage,
  usagePercentage,
  currentUsage,
  quotaLimit,
  onDismiss,
  onViewDetails,
}) => {
  const metricInfo = ALERT_METRIC_INFO[metricType]
  const alertColor = getAlertColor(thresholdPercentage)
  const severity = getAlertSeverity(thresholdPercentage)
  const message = formatAlertMessage(metricType, thresholdPercentage, usagePercentage)

  const handleViewDetails = () => {
    onViewDetails?.()
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border ${alertColor} p-4 transition-all duration-300`}
      role="alert"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        {/* Icon and message */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{metricInfo.icon}</span>
            <span className={`font-semibold ${alertColor.split(' ')[0]}`}>
              {severity === 'warning' && 'Cảnh báo sử dụng'}
              {severity === 'critical' && 'Sắp hết giới hạn'}
              {severity === 'exhausted' && 'Đã vượt giới hạn'}
            </span>
          </div>

          <p className="text-sm opacity-90 mb-3">{message}</p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                severity === 'warning' ? 'bg-amber-400' :
                severity === 'critical' ? 'bg-orange-400' :
                'bg-red-400'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>

          {/* Usage details */}
          <div className="flex items-center justify-between mt-2 text-xs opacity-75">
            <span>
              {currentUsage.toLocaleString()} / {quotaLimit.toLocaleString()} {metricInfo.unit}
            </span>
            <span>{usagePercentage}%</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleViewDetails}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                alertColor.split(' ')[0]} bg-white/10 hover:bg-white/20`}
            >
              Xem chi tiết
            </button>
            {severity !== 'exhausted' && (
              <button
                onClick={() => window.location.href = '/dashboard/subscription'}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  severity === 'critical' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                } text-white`}
              >
                {severity === 'critical' ? 'Nâng cấp ngay' : 'Nâng cấp gói'}
              </button>
            )}
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Dismiss alert"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default UsageAlertBanner
