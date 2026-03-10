/**
 * Usage Notification Service - Helper Functions
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import type {
  NotificationChannels,
  SendNotificationParams,
  SendWebhookParams,
  LogNotificationParams,
  AlertMetricType,
  AlertThreshold,
} from './usage-notification-types'

export async function canSendAlert(
  supabase: SupabaseClient,
  userId: string,
  metricType: AlertMetricType,
  threshold: AlertThreshold
): Promise<boolean> {
  try {
    const { data } = await supabase
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
  } catch {
    return true
  }
}

export async function getNotificationChannels(
  supabase: SupabaseClient,
  userId: string,
  orgId?: string
): Promise<NotificationChannels> {
  const defaults: NotificationChannels = {
    email: { enabled: true },
    sms: { enabled: false },
    webhook: { enabled: false },
  }

  try {
    const { data: userPrefs } = await supabase
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
      const { data: orgData } = await supabase
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

export async function sendViaEmail(
  supabase: SupabaseClient,
  params: SendNotificationParams
): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-overage-alert', {
      body: {
        type: 'email',
        to: params.to,
        user_id: params.userId,
        org_id: params.orgId,
        metric_type: params.metricType,
        threshold_percentage: params.thresholdPercentage,
        current_usage: params.currentUsage,
        quota_limit: params.quotaLimit,
        locale: params.locale,
      },
    })
    return !error && data?.success
  } catch (error) {
    analyticsLogger.error('[UsageNotification] sendViaEmail error:', error)
    return false
  }
}

export async function sendViaSMS(
  supabase: SupabaseClient,
  params: SendNotificationParams
): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-overage-alert', {
      body: {
        type: 'sms',
        to: params.to,
        user_id: params.userId,
        org_id: params.orgId,
        metric_type: params.metricType,
        threshold_percentage: params.thresholdPercentage,
        current_usage: params.currentUsage,
        quota_limit: params.quotaLimit,
        locale: params.locale,
      },
    })
    return !error && data?.success
  } catch (error) {
    analyticsLogger.error('[UsageNotification] sendViaSMS error:', error)
    return false
  }
}

export async function sendViaWebhook(
  supabase: SupabaseClient,
  params: SendWebhookParams
): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-overage-alert', {
      body: {
        type: 'webhook',
        to: '',
        user_id: params.userId,
        org_id: params.orgId,
        license_id: params.licenseId,
        metric_type: params.metricType,
        threshold_percentage: params.thresholdPercentage,
        current_usage: params.currentUsage,
        quota_limit: params.quotaLimit,
        locale: params.locale,
      },
    })
    return !error && data?.success
  } catch (error) {
    analyticsLogger.error('[UsageNotification] sendViaWebhook error:', error)
    return false
  }
}

export async function logNotificationEvent(
  supabase: SupabaseClient,
  params: LogNotificationParams,
  cooldownMs: number
): Promise<string> {
  try {
    const channelsSent = [
      params.channels.email && 'email',
      params.channels.sms && 'sms',
      params.channels.webhook && 'webhook',
    ].filter(Boolean) as string[]
    const cooldownUntil = new Date(Date.now() + cooldownMs).toISOString()

    const { data, error } = await supabase
      .from('usage_alert_events')
      .insert({
        user_id: params.userId,
        org_id: params.orgId,
        metric_type: params.metricType,
        threshold_percentage: params.thresholdPercentage,
        current_usage: params.currentUsage,
        quota_limit: params.quotaLimit,
        channels_sent: channelsSent,
        cooldown_until: cooldownUntil,
      })
      .select('id')
      .single()

    return error ? '' : data.id
  } catch (error) {
    analyticsLogger.error('[UsageNotification] logNotificationEvent error:', error)
    return ''
  }
}
