/**
 * Notification Channel Service Types
 *
 * Tier-based notification delivery system for ROIaaS Phase 3.5
 * Supports: email, webhook, sms, custom_endpoint channels
 */

import type { LicenseTier as BaseLicenseTier } from '../types/raas-license';

// Re-export LicenseTier for convenience
export type LicenseTier = BaseLicenseTier;

/**
 * Supported notification channels
 */
export type NotificationChannel = 'email' | 'webhook' | 'sms' | 'custom_endpoint';

/**
 * Notification event types
 */
export type NotificationEventType =
  | 'license_activated'
  | 'license_expiring'
  | 'license_expired'
  | 'usage_threshold'
  | 'payment_success'
  | 'payment_failed'
  | 'payment_retry'
  | 'subscription_renewed'
  | 'subscription_cancelled'
  | 'overage_detected'
  | 'quota_exceeded'
  | 'webhook_delivery'
  | 'system_alert';

/**
 * Notification priority levels
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Delivery status for notifications
 */
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'retrying';

/**
 * Tier-to-channel mapping configuration
 */
export interface TierChannelConfig {
  channels: NotificationChannel[];
  maxRetries: number;
  priority: NotificationPriority;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  userId: string;
  orgId?: string;
  emailEnabled: boolean;
  email?: string;
  smsEnabled: boolean;
  phoneNumber?: string;
  webhookEnabled: boolean;
  webhookUrl?: string;
  customEndpointEnabled: boolean;
  customEndpointUrl?: string;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format;
  timezone?: string;
}

/**
 * Notification payload structure
 */
export interface NotificationPayload {
  eventType: NotificationEventType;
  title: string;
  message: string;
  userId: string;
  orgId?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
  // Webhook-specific
  webhookPayload?: Record<string, unknown>;
  // Email-specific
  emailTemplate?: string;
  // SMS-specific
  smsTemplate?: string;
}

/**
 * Notification log entry for database
 */
export interface NotificationLog {
  id?: string;
  userId: string;
  orgId?: string;
  channel: NotificationChannel;
  eventType: NotificationEventType;
  payload: NotificationPayload;
  status: DeliveryStatus;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  deliveredAt?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

/**
 * Result of sending a notification
 */
export interface SendNotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
  retryCount?: number;
}

/**
 * Channel availability by tier
 * - basic: email only
 * - premium: email + webhook
 * - enterprise: email + webhook + sms
 * - master: all channels + priority
 */
export const TIER_CHANNEL_CONFIG: Record<LicenseTier, TierChannelConfig> = {
  basic: {
    channels: ['email'],
    maxRetries: 2,
    priority: 'low',
  },
  premium: {
    channels: ['email', 'webhook'],
    maxRetries: 3,
    priority: 'normal',
  },
  enterprise: {
    channels: ['email', 'webhook', 'sms'],
    maxRetries: 4,
    priority: 'high',
  },
  master: {
    channels: ['email', 'webhook', 'sms', 'custom_endpoint'],
    maxRetries: 5,
    priority: 'critical',
  },
};

/**
 * Channel display names
 */
export const CHANNEL_DISPLAY_NAMES: Record<NotificationChannel, string> = {
  email: 'Email',
  webhook: 'Webhook',
  sms: 'SMS',
  custom_endpoint: 'Custom Endpoint',
};

/**
 * Exponential backoff delay calculator
 * Formula: baseDelay * 2^retryCount + random jitter
 */
export function calculateBackoffDelay(
  retryCount: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 30000
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, retryCount);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}
