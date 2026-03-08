/**
 * Usage Alerts Types - Phase 6
 */

import type { AlertMetricType, AlertThreshold } from '@/lib/usage-alert-engine'

/**
 * Alert Event for real-time subscription
 */
export interface AlertEvent {
  eventId: string
  eventType: 'usage.threshold_exceeded' | 'usage.quota_exhausted'
  userId: string
  licenseId?: string
  metricType: AlertMetricType
  thresholdPercentage: AlertThreshold
  currentUsage: number
  quotaLimit: number
  usagePercentage: number
  createdAt: string
  webhookStatus: 'pending' | 'sent' | 'failed'
}

/**
 * Alert Settings for user preferences
 */
export interface AlertSettings {
  emailEnabled: boolean
  webhookEnabled: boolean
  smsEnabled?: boolean
  thresholds: AlertThreshold[]
  metrics: AlertMetricType[]
  cooldownMinutes?: number
}

/**
 * Alert History for dashboard display
 */
export interface AlertHistoryItem {
  id: string
  eventId: string
  eventType: string
  metricType: AlertMetricType
  thresholdPercentage: AlertThreshold
  usagePercentage: number
  webhookStatus: 'pending' | 'sent' | 'failed'
  createdAt: string
  processedAt?: string
}

/**
 * Alert Banner Props for UI component
 */
export interface AlertBannerProps {
  metricType: AlertMetricType
  thresholdPercentage: AlertThreshold
  usagePercentage: number
  currentUsage: number
  quotaLimit: number
  onDismiss?: () => void
  onViewDetails?: () => void
}

/**
 * Alert metric display info
 */
export interface AlertMetricInfo {
  label: string
  unit: string
  icon: string
  color: string
}

export const ALERT_METRIC_INFO: Record<AlertMetricType, AlertMetricInfo> = {
  api_calls: { label: 'API Calls', unit: 'calls', icon: '📡', color: 'text-blue-400' },
  tokens: { label: 'Tokens', unit: 'tokens', icon: '🔑', color: 'text-purple-400' },
  compute_minutes: { label: 'Compute Time', unit: 'minutes', icon: '⚡', color: 'text-yellow-400' },
  model_inferences: { label: 'AI Inferences', unit: 'inferences', icon: '🤖', color: 'text-pink-400' },
  agent_executions: { label: 'Agent Executions', unit: 'executions', icon: '🚀', color: 'text-emerald-400' },
}

/**
 * Get alert severity based on threshold
 */
export function getAlertSeverity(threshold: AlertThreshold): 'warning' | 'critical' | 'exhausted' {
  if (threshold === 80) return 'warning'
  if (threshold === 90) return 'critical'
  return 'exhausted'
}

/**
 * Get alert color based on severity
 */
export function getAlertColor(threshold: AlertThreshold): string {
  if (threshold === 80) return 'text-amber-400 border-amber-400/30 bg-amber-500/10'
  if (threshold === 90) return 'text-orange-400 border-orange-400/30 bg-orange-500/10'
  return 'text-red-400 border-red-400/30 bg-red-500/10'
}

/**
 * Format alert message for display
 */
export function formatAlertMessage(
  metricType: AlertMetricType,
  threshold: AlertThreshold,
  usagePercentage: number
): string {
  const metricInfo = ALERT_METRIC_INFO[metricType]
  const severity = getAlertSeverity(threshold)

  const messages = {
    warning: `${metricInfo.icon} Bạn đã sử dụng ${usagePercentage}% ${metricInfo.label} của giới hạn`,
    critical: `${metricInfo.icon} Cảnh báo: ${usagePercentage}% ${metricInfo.label} - Sắp hết giới hạn!`,
    exhausted: `${metricInfo.icon} Đã hết: ${metricInfo.label} vượt quá giới hạn!`,
  }

  return messages[severity]
}
