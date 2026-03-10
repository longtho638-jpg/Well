/**
 * Usage Notification Service - Phase 6
 *
 * Orchestrates multi-channel notifications for usage threshold alerts.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import type { NotificationConfig, NotificationResult } from './usage-notification-types'
import {
  canSendAlert,
  getNotificationChannels,
  sendViaEmail,
  sendViaSMS,
  sendViaWebhook,
  logNotificationEvent,
} from './usage-notification-helpers'

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
      userId, orgId, licenseId, metricType, thresholdPercentage,
      currentUsage, quotaLimit, locale = 'vi', skipCooldown = false,
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
        const canSend = await canSendAlert(this.supabase, userId, metricType, thresholdPercentage)
        if (!canSend) {
          return { success: true, emailSent: false, smsSent: false, webhookSent: false }
        }
      }

      const channels = await getNotificationChannels(this.supabase, userId, orgId)
      const promises: Promise<void>[] = []

      if (channels.email.enabled && channels.email.address) {
        promises.push(
          sendViaEmail(this.supabase, {
            userId, orgId, metricType, thresholdPercentage, currentUsage, quotaLimit, locale, to: channels.email.address,
          }).then(sent => { result.emailSent = sent }).catch(err => { result.errors?.push(`Email: ${err.message}`) })
        )
      }

      if (channels.sms.enabled && channels.sms.phoneNumber) {
        promises.push(
          sendViaSMS(this.supabase, {
            userId, orgId, metricType, thresholdPercentage, currentUsage, quotaLimit, locale, to: channels.sms.phoneNumber,
          }).then(sent => { result.smsSent = sent }).catch(err => { result.errors?.push(`SMS: ${err.message}`) })
        )
      }

      if (channels.webhook.enabled) {
        promises.push(
          sendViaWebhook(this.supabase, {
            userId, orgId, licenseId, metricType, thresholdPercentage, currentUsage, quotaLimit, locale,
          }).then(sent => { result.webhookSent = sent }).catch(err => { result.errors?.push(`Webhook: ${err.message}`) })
        )
      }

      await Promise.allSettled(promises)

      if (result.emailSent || result.smsSent || result.webhookSent) {
        result.notificationId = await logNotificationEvent(this.supabase, {
          userId, orgId,
          channels: { email: result.emailSent, sms: result.smsSent, webhook: result.webhookSent },
          metricType, thresholdPercentage, currentUsage, quotaLimit,
        }, this.cooldownMs)
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

  async canSendAlert(userId: string, metricType: string, threshold: number): Promise<boolean> {
    return canSendAlert(this.supabase, userId, metricType as any, threshold as any)
  }

  async getNotificationChannels(userId: string, orgId?: string) {
    return getNotificationChannels(this.supabase, userId, orgId)
  }
}

export default UsageNotificationService
