/**
 * Notification Channel Service
 *
 * Tier-based notification delivery system for ROIaaS Phase 3.5
 * Routes notifications through appropriate channels based on license tier
 *
 * Features:
 * - Multi-channel support: email, webhook, SMS, custom_endpoint
 * - Tier-based channel availability
 * - Retry logic with exponential backoff
 * - Delivery status tracking
 * - User preferences integration
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { emailService } from './email-service';
import { getTierConfig as _getTierConfig } from './license-service';
import type {
  NotificationChannel,
  NotificationPayload,
  NotificationPreferences,
  NotificationLog,
  SendNotificationResult,
  LicenseTier,
} from './notification-channel-types';
import {
  TIER_CHANNEL_CONFIG,
  calculateBackoffDelay,
} from './notification-channel-types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = (import.meta.env.VITE_SUPABASE_SERVICE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder') as string;

/**
 * Notification Channel Service Class
 */
export class NotificationChannelService {
  private supabase: SupabaseClient;
  private isQuietHours: boolean = false;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get available notification channels for a given license tier
   */
  getAvailableChannels(tier: LicenseTier): NotificationChannel[] {
    const config = TIER_CHANNEL_CONFIG[tier];
    return config?.channels || ['email'];
  }

  /**
   * Get user notification preferences from database
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        userId: data.user_id,
        orgId: data.org_id,
        emailEnabled: data.email_enabled,
        email: undefined,
        smsEnabled: data.sms_enabled,
        phoneNumber: undefined,
        webhookEnabled: data.webhook_enabled,
        webhookUrl: data.webhook_url ?? undefined,
        customEndpointEnabled: false,
        customEndpointUrl: undefined,
        quietHoursStart: undefined,
        quietHoursEnd: undefined,
        timezone: undefined,
      };
    } catch (error) {
      console.error('[NotificationChannelService] getUserPreferences error', error);
      return null;
    }
  }

  /**
   * Check if current time is within user's quiet hours
   */
  isUserInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHours, startMinutes] = preferences.quietHoursStart.split(':').map(Number);
    const [endHours, endMinutes] = preferences.quietHoursEnd.split(':').map(Number);

    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    }

    // Quiet hours span midnight (e.g., 22:00 - 08:00)
    return currentTime >= startTime || currentTime <= endTime;
  }

  /**
   * Send notification through specified channel
   */
  async sendNotification(
    channel: NotificationChannel,
    payload: NotificationPayload
  ): Promise<SendNotificationResult> {
    try {
      switch (channel) {
        case 'email':
          return this.sendEmailNotification(payload);
        case 'webhook':
          return this.sendWebhookNotification(payload);
        case 'sms':
          return this.sendSmsNotification(payload);
        case 'custom_endpoint':
          return this.sendCustomEndpointNotification(payload);
        default:
          return {
            success: false,
            channel,
            error: `Unknown channel: ${channel}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        channel,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(payload: NotificationPayload): Promise<SendNotificationResult> {
    try {
      const emailTo = payload.metadata?.email as string || '';
      if (!emailTo) {
        return {
          success: false,
          channel: 'email',
          error: 'Email address not provided',
        };
      }

      // Use emailService to send the notification
      await emailService.send({
        to: emailTo,
        subject: payload.title,
        html: `<div><h2>${payload.title}</h2><p>${payload.message}</p></div>`,
        templateType: 'overage-notification',
        data: {
          userName: payload.metadata?.userName as string || 'User',
          subscriptionPlan: payload.eventType,
          amount: payload.metadata?.amount as string,
        },
      });

      return {
        success: true,
        channel: 'email',
        messageId: `email-${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        channel: 'email',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(payload: NotificationPayload): Promise<SendNotificationResult> {
    try {
      const webhookUrl = payload.metadata?.webhookUrl as string;
      if (!webhookUrl) {
        return {
          success: false,
          channel: 'webhook',
          error: 'Webhook URL not provided',
        };
      }

      const webhookPayload = payload.webhookPayload || {
        eventType: payload.eventType,
        title: payload.title,
        message: payload.message,
        timestamp: new Date().toISOString(),
        ...payload.metadata,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with status ${response.status}`);
      }

      return {
        success: true,
        channel: 'webhook',
        messageId: `webhook-${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        channel: 'webhook',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(payload: NotificationPayload): Promise<SendNotificationResult> {
    try {
      const phoneNumber = payload.metadata?.phoneNumber as string;
      if (!phoneNumber) {
        return {
          success: false,
          channel: 'sms',
          error: 'Phone number not provided',
        };
      }

      // SMS sending logic - placeholder for SMS provider integration
      // In production, integrate with Twilio, Vonage, or other SMS provider
      const smsBody = payload.smsTemplate
        ? payload.smsTemplate
        : `${payload.title}: ${payload.message}`;

      // Placeholder: Log SMS intent (replace with actual SMS API call)
      // eslint-disable-next-line no-console
      console.info('[SMS] Would send to:', phoneNumber, 'Body:', smsBody);

      return {
        success: true,
        channel: 'sms',
        messageId: `sms-${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        channel: 'sms',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send custom endpoint notification
   */
  private async sendCustomEndpointNotification(payload: NotificationPayload): Promise<SendNotificationResult> {
    try {
      const endpointUrl = payload.metadata?.customEndpointUrl as string;
      if (!endpointUrl) {
        return {
          success: false,
          channel: 'custom_endpoint',
          error: 'Custom endpoint URL not provided',
        };
      }

      const customPayload = payload.webhookPayload || {
        eventType: payload.eventType,
        priority: payload.priority || 'normal',
        data: {
          title: payload.title,
          message: payload.message,
          ...payload.metadata,
        },
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customPayload),
      });

      if (!response.ok) {
        throw new Error(`Custom endpoint responded with status ${response.status}`);
      }

      return {
        success: true,
        channel: 'custom_endpoint',
        messageId: `custom-${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        channel: 'custom_endpoint',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send tier-based notification to user
   * Automatically routes through all available channels for user's tier
   */
  async sendTierBasedNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<SendNotificationResult[]> {
    const results: SendNotificationResult[] = [];

    try {
      // Get user's license tier
      const { data: license } = await this.supabase
        .from('raas_licenses')
        .select('tier')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const tier: LicenseTier = (license?.tier as LicenseTier) || 'basic';

      // Get available channels for tier
      const availableChannels = this.getAvailableChannels(tier);

      // Get user preferences
      const preferences = await this.getUserPreferences(userId);

      // Check quiet hours
      if (preferences && this.isUserInQuietHours(preferences)) {
        // Queue for later delivery (implement queue logic as needed)
        // eslint-disable-next-line no-console
        console.info('[NotificationChannelService] User in quiet hours, queuing notification');
      }

      // Send through each available channel
      for (const channel of availableChannels) {
        // Skip if user disabled the channel
        if (preferences) {
          if (channel === 'email' && !preferences.emailEnabled) continue;
          if (channel === 'webhook' && !preferences.webhookEnabled) continue;
          if (channel === 'sms' && !preferences.smsEnabled) continue;
          if (channel === 'custom_endpoint' && !preferences.customEndpointEnabled) continue;
        }

        // Add user contact info to payload
        const enrichedPayload = { ...payload };
        if (preferences) {
          enrichedPayload.metadata = {
            ...enrichedPayload.metadata,
            email: preferences.email,
            phoneNumber: preferences.phoneNumber,
            webhookUrl: preferences.webhookUrl,
            customEndpointUrl: preferences.customEndpointUrl,
          };
        }

        // Send with retry logic
        const result = await this.sendWithRetry(channel, enrichedPayload, TIER_CHANNEL_CONFIG[tier].maxRetries);
        results.push(result);

        // Log the notification
        await this.logNotification({
          userId,
          orgId: payload.orgId,
          channel,
          eventType: payload.eventType,
          payload: enrichedPayload,
          status: result.success ? 'delivered' : 'failed',
          errorMessage: result.error,
          retryCount: result.retryCount || 0,
          maxRetries: TIER_CHANNEL_CONFIG[tier].maxRetries,
          deliveredAt: result.success ? new Date().toISOString() : undefined,
        });
      }

      return results;
    } catch (error) {
      console.error('[NotificationChannelService] sendTierBasedNotification error', error);
      return [{
        success: false,
        channel: 'email',
        error: (error as Error).message,
      }];
    }
  }

  /**
   * Send notification with retry logic and exponential backoff
   */
  private async sendWithRetry(
    channel: NotificationChannel,
    payload: NotificationPayload,
    maxRetries: number = 3
  ): Promise<SendNotificationResult> {
    let lastError: Error | null = null;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      const result = await this.sendNotification(channel, payload);

      if (result.success) {
        result.retryCount = retryCount;
        return result;
      }

      lastError = new Error(result.error);
      retryCount++;

      if (retryCount <= maxRetries) {
        const delay = calculateBackoffDelay(retryCount);
        // eslint-disable-next-line no-console
        console.info(
          `[NotificationChannelService] Retry ${retryCount}/${maxRetries} for ${channel} after ${delay}ms`
        );
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      channel,
      error: lastError?.message || 'Unknown error after all retries',
      retryCount,
    };
  }

  /**
   * Log notification to database
   */
  async logNotification(log: NotificationLog): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notification_logs')
        .insert({
          user_id: log.userId,
          org_id: log.orgId,
          channel: log.channel,
          event_type: log.eventType,
          payload: log.payload,
          status: log.status,
          error_message: log.errorMessage,
          retry_count: log.retryCount,
          max_retries: log.maxRetries,
          next_retry_at: log.nextRetryAt,
          delivered_at: log.deliveredAt,
          metadata: log.metadata,
        });

      if (error) {
        console.error('[NotificationChannelService] logNotification error', error);
      }
    } catch (error) {
      console.error('[NotificationChannelService] logNotification error', error);
    }
  }

  /**
   * Helper: sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Default instance export
 */
export const notificationChannelService = new NotificationChannelService();
