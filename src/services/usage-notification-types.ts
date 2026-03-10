/**
 * Usage Notification Service - Type Definitions
 */

export type AlertMetricType =
  | 'api_calls'
  | 'tokens'
  | 'compute_minutes'
  | 'model_inferences'
  | 'agent_executions'

export type AlertThreshold = 80 | 90 | 100

export type NotificationChannel = 'email' | 'sms' | 'webhook'

export interface NotificationConfig {
  userId: string
  orgId?: string
  licenseId?: string
  metricType: AlertMetricType
  thresholdPercentage: AlertThreshold
  currentUsage: number
  quotaLimit: number
  locale?: 'vi' | 'en'
  skipCooldown?: boolean
}

export interface NotificationResult {
  success: boolean
  emailSent: boolean
  smsSent: boolean
  webhookSent: boolean
  errors?: string[]
  notificationId?: string
}

export interface NotificationChannels {
  email: { enabled: boolean; address?: string }
  sms: { enabled: boolean; phoneNumber?: string }
  webhook: { enabled: boolean; url?: string }
}

export interface SendNotificationParams {
  userId: string
  orgId?: string
  metricType: AlertMetricType
  thresholdPercentage: AlertThreshold
  currentUsage: number
  quotaLimit: number
  locale: 'vi' | 'en'
  to: string
}

export interface SendWebhookParams {
  userId: string
  orgId?: string
  licenseId?: string
  metricType: AlertMetricType
  thresholdPercentage: AlertThreshold
  currentUsage: number
  quotaLimit: number
  locale: 'vi' | 'en'
}

export interface LogNotificationParams {
  userId: string
  orgId?: string
  channels: { email: boolean; sms: boolean; webhook: boolean }
  metricType: AlertMetricType
  thresholdPercentage: AlertThreshold
  currentUsage: number
  quotaLimit: number
}
