/**
 * Usage Notification Service - Phase 6
 *
 * Orchestrates multi-channel notifications (email/SMS/webhook) for usage threshold alerts.
 *
 * Features:
 * - Multi-channel notifications (email via Resend, SMS via Twilio, webhook to AgencyOS)
 * - Idempotency with 1-hour cooldown period
 * - Per-user, per-metric, per-threshold tracking
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'

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

export class UsageNotificationService {
  private supabase: SupabaseClient
  private cooldownMs: number
  private readonly DEFAULT_COOLDOWN_MS = 60 * 60 * 1000

  constructor(supabase: SupabaseClient, cooldownMs?: number) {
    this.supabase = supabase
    this.cooldownMs = cooldownMs ?? this.DEFAULT_COOLDOWN_MS
  }

  async sendNotification(config: NotificationConfig): Promise<NotificationResult> {
    const {
      userId,
      orgId,
      licenseId,
      metricType,
      thresholdPercentage,
      currentUsage,
      quotaLimit,
      locale = 'vi',
      skipCooldown = false,
    } = config

    const result: NotificationResult = {
      success: true,
      emailSent: false,
      smsSent: false,
      webhookSent: false,
      errors: [],
    }

    try {
      if (!skipCooldown) {
        const canSend = await this.canSendAlert(userId, metricType, thresholdPercentage)
        if (!canSend) {
          return { success: true, emailSent: false, smsSent: false, webhookSent: false }
        }
      }

      const channels = await this.getNotificationChannels(userId, orgId)
      const promises: Promise<void>[] = []

      if (channels.email.enabled && channels.email.address) {
        promises.push(
          this.sendViaEmail({ userId, orgId, metricType, thresholdPercentage, currentUsage, quotaLimit, locale, to: channels.email.address })
            .then((sent) => { result.emailSent = sent })
            .catch((err) => { result.errors?.push(`Email: ${err.message}`) })
        )
      }

      if (channels.sms.enabled && channels.sms.phoneNumber) {
        promises.push(
          this.sendViaSMS({ userId, orgId, metricType, thresholdPercentage, currentUsage, quotaLimit, locale, to: channels.sms.phoneNumber })
            .then((sent) => { result.smsSent = sent })
            .catch((err) => { result.errors?.push(`SMS: ${err.message}`) })
        )
      }

      if (channels.webhook.enabled) {
        promises.push(
          this.sendViaWebhook({ userId, orgId, licenseId, metricType, thresholdPercentage, currentUsage, quotaLimit, locale })
            .then((sent) => { result.webhookSent = sent })
            .catch((err) => { result.errors?.push(`Webhook: ${err.message}`) })
        )
      }

      await Promise.allSettled(promises)

      if (result.emailSent || result.smsSent || result.webhookSent) {
        result.notificationId = await this.logNotificationEvent({
          userId, orgId,
          channels: { email: result.emailSent, sms: result.smsSent, webhook: result.webhookSent },
          metricType, thresholdPercentage, currentUsage, quotaLimit,
        })
      }

      result.success = result.emailSent || result.smsSent || result.webhookSent
      if (result.errors && result.errors.length > 0 && !result.success) {
        result.success = false
      }

      return result
    } catch (error) {
      analyticsLogger.error('[UsageNotification] sendNotification error:', error)
      result.success = false
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error')
      return result
    }
  }

  async canSendAlert(userId: string, metricType: AlertMetricType, threshold: AlertThreshold): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .from('usage_alert_events')
        .select('cooldown_until')
        .eq('user_id', userId)
        .eq('metric_type', metricType)
        .eq('threshold_percentage', threshold)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data?.cooldown_until) {
        return Date.now() >= new Date(data.cooldown_until).getTime()
      }
      return true
    } catch (error) {
      return true
    }
  }

  async getNotificationChannels(userId: string, orgId?: string): Promise<NotificationChannels> {
    const defaults: NotificationChannels = {
      email: { enabled: true },
      sms: { enabled: false },
      webhook: { enabled: false },
    }

    try {
      const { data: userPrefs } = await this.supabase
        .from('user_notification_preferences')
        .select('email_enabled, sms_enabled, phone_number, email_address')
        .eq('user_id', userId)
        .single()

      if (userPrefs) {
        defaults.email.enabled = userPrefs.email_enabled ?? true
        defaults.email.address = userPrefs.email_address
        defaults.sms.enabled = userPrefs.sms_enabled ?? false
        defaults.sms.phoneNumber = userPrefs.phone_number
      }

      if (orgId) {
        const { data: orgData } = await this.supabase
          .from('organizations')
          .select('metadata')
          .eq('id', orgId)
          .single()

        if (orgData?.metadata) {
          const metadata = orgData.metadata as Record<string, unknown>
          if (metadata.webhook_url) {
            defaults.webhook.enabled = true
            defaults.webhook.url = metadata.webhook_url as string
          }
        }
      }
    } catch (error) {
      analyticsLogger.error('[UsageNotification] getNotificationChannels error:', error)
    }

    return defaults
  }

  private async sendViaEmail(params: { userId: string; orgId?: string; metricType: AlertMetricType; thresholdPercentage: AlertThreshold; currentUsage: number; quotaLimit: number; locale: 'vi' | 'en'; to: string }): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.functions.invoke('send-overage-alert', {
        body: { type: 'email', to: params.to, user_id: params.userId, org_id: params.orgId, metric_type: params.metricType, threshold_percentage: params.thresholdPercentage, current_usage: params.currentUsage, quota_limit: params.quotaLimit, locale: params.locale },
      })
      return !error && data?.success
    } catch (error) {
      analyticsLogger.error('[UsageNotification] sendViaEmail error:', error)
      return false
    }
  }

  private async sendViaSMS(params: { userId: string; orgId?: string; metricType: AlertMetricType; thresholdPercentage: AlertThreshold; currentUsage: number; quotaLimit: number; locale: 'vi' | 'en'; to: string }): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.functions.invoke('send-overage-alert', {
        body: { type: 'sms', to: params.to, user_id: params.userId, org_id: params.orgId, metric_type: params.metricType, threshold_percentage: params.thresholdPercentage, current_usage: params.currentUsage, quota_limit: params.quotaLimit, locale: params.locale },
      })
      return !error && data?.success
    } catch (error) {
      analyticsLogger.error('[UsageNotification] sendViaSMS error:', error)
      return false
    }
  }

  private async sendViaWebhook(params: { userId: string; orgId?: string; licenseId?: string; metricType: AlertMetricType; thresholdPercentage: AlertThreshold; currentUsage: number; quotaLimit: number; locale: 'vi' | 'en' }): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.functions.invoke('send-overage-alert', {
        body: { type: 'webhook', to: '', user_id: params.userId, org_id: params.orgId, license_id: params.licenseId, metric_type: params.metricType, threshold_percentage: params.thresholdPercentage, current_usage: params.currentUsage, quota_limit: params.quotaLimit, locale: params.locale },
      })
      return !error && data?.success
    } catch (error) {
      analyticsLogger.error('[UsageNotification] sendViaWebhook error:', error)
      return false
    }
  }

  private async logNotificationEvent(params: { userId: string; orgId?: string; channels: { email: boolean; sms: boolean; webhook: boolean }; metricType: AlertMetricType; thresholdPercentage: AlertThreshold; currentUsage: number; quotaLimit: number }): Promise<string> {
    try {
      const channelsSent = [params.channels.email && 'email', params.channels.sms && 'sms', params.channels.webhook && 'webhook'].filter(Boolean) as string[]
      const cooldownUntil = new Date(Date.now() + this.cooldownMs).toISOString()

      const { data, error } = await this.supabase
        .from('usage_alert_events')
        .insert({ user_id: params.userId, org_id: params.orgId, metric_type: params.metricType, threshold_percentage: params.thresholdPercentage, current_usage: params.currentUsage, quota_limit: params.quotaLimit, channels_sent: channelsSent, cooldown_until: cooldownUntil })
        .select('id')
        .single()

      return error ? '' : data.id
    } catch (error) {
      analyticsLogger.error('[UsageNotification] logNotificationEvent error:', error)
      return ''
    }
  }
}

export default UsageNotificationService
