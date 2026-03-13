/**
 * UsageWidget - Dashboard Widget for Usage vs Plan Limits
 *
 * Displays 4 progress bars showing usage vs plan limits:
 * - API calls, Bookings, Reports, Email sends
 *
 * Features:
 * - Color coding: Green (<80%), Amber (80-99%), Red (100%+)
 * - Hover tooltips with exact numbers
 * - "Pay Overages" button when over limit
 * - Alert banner at 80% threshold
 * - Glassmorphism design with Framer Motion animations
 *
 * @module components/metering
 */

'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, TrendingUp, Mail, FileText, ClipboardList } from 'lucide-react'
import type { UsageSummary } from '@/types/usage'

// ============================================================
// Types
// ============================================================

export interface UsageWidgetProps {
  orgId: string
  usageData: UsageSummary[]
  onUpgrade: () => void
  onPayOverages: () => void
}

interface MetricCardProps {
  label: string
  used: number
  limit: number
  percentage: number
  unit: string
  icon: React.ElementType
}

// ============================================================
// Constants
// ============================================================

const METRIC_CONFIG: Record<string, { label: string; unit: string; icon: React.ElementType }> = {
  apiCalls: { label: 'API Calls', unit: 'calls', icon: TrendingUp },
  bookings: { label: 'Bookings', unit: 'bookings', icon: ClipboardList },
  reports: { label: 'Reports', unit: 'reports', icon: FileText },
  emails: { label: 'Email Sends', unit: 'emails', icon: Mail },
}

const getColorByPercentage = (percentage: number): string => {
  if (percentage >= 100) return 'from-red-500 to-red-600'
  if (percentage >= 80) return 'from-amber-500 to-amber-600'
  return 'from-emerald-500 to-emerald-600'
}

const getTextColorByPercentage = (percentage: number): string => {
  if (percentage >= 100) return 'text-red-400'
  if (percentage >= 80) return 'text-amber-400'
  return 'text-emerald-400'
}

const getBorderColorByPercentage = (percentage: number): string => {
  if (percentage >= 100) return 'border-red-500/30'
  if (percentage >= 80) return 'border-amber-500/30'
  return 'border-emerald-500/30'
}

// ============================================================
// Metric Card Component
// ============================================================

const MetricCard: React.FC<MetricCardProps> = ({ label, used, limit, percentage, unit, icon: Icon }) => {
  const isOverLimit = percentage >= 100
  const isNearLimit = percentage >= 80 && percentage < 100
  const isNormal = percentage < 80

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border ${getBorderColorByPercentage(percentage)} shadow-lg group overflow-hidden`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${getColorByPercentage(percentage)} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{label}</h4>
            <p className={`text-xs font-medium ${getTextColorByPercentage(percentage)}`}>
              {isOverLimit ? 'Vượt giới hạn' : isNearLimit ? 'Sắp hết' : 'Trong giới hạn'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${getTextColorByPercentage(percentage)}`}>{percentage.toFixed(0)}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${getColorByPercentage(percentage)} rounded-full`}
        />
        {/* Threshold markers */}
        <div className="absolute top-0 left-[80%] w-px h-full bg-amber-400/30" />
        <div className="absolute top-0 left-full w-px h-full bg-red-400/30" />
      </div>

      {/* Stats with Tooltip */}
      <div className="flex items-center justify-between text-xs relative z-10">
        <div className="group/stat relative">
          <span className="text-zinc-500">Đã dùng: </span>
          <span className="text-white font-semibold">{used.toLocaleString()} {unit}</span>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover/stat:opacity-100 transition-opacity pointer-events-none z-50">
            <p>Usage: {used.toLocaleString()} {unit}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-zinc-800 border-b border-r border-zinc-700 rotate-45" />
          </div>
        </div>
        <div>
          <span className="text-zinc-500">Giới hạn: </span>
          <span className="text-white font-semibold">{limit === -1 ? 'Unlimited' : limit.toLocaleString()} {unit}</span>
        </div>
      </div>

      {/* Warning badge for over limit */}
      {isOverLimit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 text-xs text-red-400"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Vượt {used - limit > 0 ? (used - limit).toLocaleString() : 0} {unit}</span>
        </motion.div>
      )}
    </motion.div>
  )
}

// ============================================================
// Alert Banner Component
// ============================================================

const AlertBanner: React.FC<{ message: string; severity: 'warning' | 'danger' }> = ({ message, severity }) => {
  const styles = {
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    danger: 'bg-red-500/10 border-red-500/20 text-red-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`flex items-center gap-3 p-4 rounded-xl border ${styles[severity]}`}
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </motion.div>
  )
}

// ============================================================
// Main UsageWidget Component
// ============================================================

export const UsageWidget: React.FC<UsageWidgetProps> = ({
  usageData,
  onUpgrade,
  onPayOverages,
}) => {
  // Aggregate usage data from all entries
  const aggregatedUsage = useMemo(() => {
    if (!usageData || usageData.length === 0) return null

    return usageData.reduce(
      (acc, summary) => ({
        apiCalls: {
          used: (acc.apiCalls?.used || 0) + summary.apiCalls.used,
          limit: summary.apiCalls.limit,
          percentage: Math.min(100, ((acc.apiCalls?.used || 0) + summary.apiCalls.used) / (summary.apiCalls.limit || 1) * 100),
        },
        tokens: {
          used: (acc.tokens?.used || 0) + summary.tokens.used,
          limit: summary.tokens.limit,
          percentage: Math.min(100, ((acc.tokens?.used || 0) + summary.tokens.used) / (summary.tokens.limit || 1) * 100),
        },
        computeMinutes: {
          used: (acc.computeMinutes?.used || 0) + summary.computeMinutes.used,
          limit: summary.computeMinutes.limit,
          percentage: Math.min(100, ((acc.computeMinutes?.used || 0) + summary.computeMinutes.used) / (summary.computeMinutes.limit || 1) * 100),
        },
        modelInferences: {
          used: (acc.modelInferences?.used || 0) + summary.modelInferences.used,
          limit: summary.modelInferences.limit,
          percentage: Math.min(100, ((acc.modelInferences?.used || 0) + summary.modelInferences.used) / (summary.modelInferences.limit || 1) * 100),
        },
        agentExecutions: {
          used: (acc.agentExecutions?.used || 0) + summary.agentExecutions.used,
          limit: summary.agentExecutions.limit,
          percentage: Math.min(100, ((acc.agentExecutions?.used || 0) + summary.agentExecutions.used) / (summary.agentExecutions.limit || 1) * 100),
        },
        isLimited: acc.isLimited || summary.isLimited,
        tier: summary.tier,
        resetAt: summary.resetAt,
      }),
      {} as UsageSummary
    )
  }, [usageData])

  // Map aggregated data to widget metrics
  const widgetMetrics = useMemo(() => {
    if (!aggregatedUsage) return []

    return [
      {
        key: 'apiCalls',
        label: METRIC_CONFIG.apiCalls.label,
        used: aggregatedUsage.apiCalls.used,
        limit: aggregatedUsage.apiCalls.limit,
        percentage: aggregatedUsage.apiCalls.percentage,
        unit: METRIC_CONFIG.apiCalls.unit,
        icon: METRIC_CONFIG.apiCalls.icon,
      },
      {
        key: 'agentExecutions',
        label: METRIC_CONFIG.bookings.label,
        used: aggregatedUsage.agentExecutions.used,
        limit: aggregatedUsage.agentExecutions.limit,
        percentage: aggregatedUsage.agentExecutions.percentage,
        unit: METRIC_CONFIG.bookings.unit,
        icon: METRIC_CONFIG.bookings.icon,
      },
      {
        key: 'modelInferences',
        label: METRIC_CONFIG.reports.label,
        used: aggregatedUsage.modelInferences.used,
        limit: aggregatedUsage.modelInferences.limit,
        percentage: aggregatedUsage.modelInferences.percentage,
        unit: METRIC_CONFIG.reports.unit,
        icon: METRIC_CONFIG.reports.icon,
      },
      {
        key: 'computeMinutes',
        label: METRIC_CONFIG.emails.label,
        used: aggregatedUsage.computeMinutes.used,
        limit: aggregatedUsage.computeMinutes.limit,
        percentage: aggregatedUsage.computeMinutes.percentage,
        unit: METRIC_CONFIG.emails.unit,
        icon: METRIC_CONFIG.emails.icon,
      },
    ]
  }, [aggregatedUsage])

  // Determine if any metric is over or near limit
  const overLimitMetrics = widgetMetrics.filter(m => m.percentage >= 100)
  const nearLimitMetrics = widgetMetrics.filter(m => m.percentage >= 80 && m.percentage < 100)

  if (!aggregatedUsage) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <p>Không có dữ liệu sử dụng</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-3xl bg-zinc-950/80 backdrop-blur-2xl border border-white/5 shadow-2xl space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-bold text-white">Sử dụng tài nguyên</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Theo dõi giới hạn theo gói {aggregatedUsage.tier}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-zinc-900/80 border border-white/5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      {overLimitMetrics.length > 0 && (
        <AlertBanner
          message={`Bạn đã vượt giới hạn ${overLimitMetrics.length} chỉ số. Vui lòng thanh toán phí vượt mức.`}
          severity="danger"
        />
      )}
      {nearLimitMetrics.length > 0 && overLimitMetrics.length === 0 && (
        <AlertBanner
          message={`Cảnh báo: Bạn đã sử dụng trên 80% giới hạn của ${nearLimitMetrics.length} chỉ số.`}
          severity="warning"
        />
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgetMetrics.map((metric, index) => (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {overLimitMetrics.length > 0 ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPayOverages}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-red-500/25 transition-all flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Thanh toán phí vượt mức
          </motion.button>
        ) : nearLimitMetrics.length > 0 ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUpgrade}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Nâng cấp gói
          </motion.button>
        ) : (
          <div className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-400 font-semibold rounded-xl border border-emerald-500/20 text-center">
            Tất cả chỉ số trong giới hạn
          </div>
        )}

        {nearLimitMetrics.length > 0 && overLimitMetrics.length === 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUpgrade}
            className="py-3 px-4 bg-zinc-800 text-white font-medium rounded-xl border border-white/10 hover:bg-zinc-700 transition-all"
          >
            Xem gói
          </motion.button>
        )}
      </div>

      {/* Reset Info */}
      {aggregatedUsage.resetAt && (
        <p className="text-xs text-center text-zinc-600 pt-2">
          Giới hạn sẽ đặt lại vào: {new Date(aggregatedUsage.resetAt).toLocaleString('vi-VN')}
        </p>
      )}
    </motion.div>
  )
}

export default UsageWidget
