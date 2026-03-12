/**
 * Webhook Event Processor Service
 *
 * Processes webhook events from Polar.sh and PayOS payment providers.
 * Handles event routing, idempotency, analytics tracking, and audit logging.
 *
 * @module services/webhook-event-processor
 */

import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Supported webhook event types
 */
export type WebhookEventType =
  | 'subscription.activated'
  | 'subscription.canceled'
  | 'subscription.expired'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'usage.billing_sync'
  | 'usage.overage_detected'
  | 'usage.quota_exhausted';

/**
 * Webhook provider identifier
 */
export type WebhookProvider = 'polar' | 'payos';

/**
 * Incoming webhook event structure
 */
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  provider: WebhookProvider;
  timestamp: string;
  payload: Record<string, unknown>;
  signature?: string;
}

/**
 * Result of processing a webhook event
 */
export interface ProcessEventResult {
  success: boolean;
  eventId: string;
  eventType: WebhookEventType;
  wasDuplicate: boolean;
  error?: string;
  metadata?: {
    customerId?: string;
    subscriptionId?: string;
    amount?: number;
    currency?: string;
  };
}

/**
 * Stored webhook event record for analytics
 */
export interface StoredWebhookEvent {
  event_id: string;
  event_type: string;
  customer_id?: string;
  subscription_id?: string;
  order_id?: string;
  product_id?: string;
  license_id?: string;
  amount_cents?: number;
  currency?: string;
  customer_email?: string;
  customer_name?: string;
  product_name?: string;
  tier?: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at?: string;
  processing_error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map plan/product name to tier
 */
function mapPlanToTier(planName: string | undefined): string {
  if (!planName) return 'free';
  const name = planName.toLowerCase();
  if (name.includes('master')) return 'master';
  if (name.includes('enterprise')) return 'enterprise';
  if (name.includes('premium')) return 'premium';
  if (name.includes('basic') || name.includes('starter')) return 'basic';
  return 'free';
}

/**
 * Extract customer ID from event payload
 */
function extractCustomerId(payload: Record<string, unknown>): string | undefined {
  return (
    (payload.customer_id as string) ||
    (payload.user_id as string) ||
    (payload.org_id as string)
  );
}

/**
 * Extract subscription ID from event payload
 */
function extractSubscriptionId(payload: Record<string, unknown>): string | undefined {
  return (
    (payload.subscription_id as string) ||
    (payload.order_id as string)
  );
}

/**
 * Extract amount from event payload (convert to cents if needed)
 */
function extractAmountCents(payload: Record<string, unknown>): number | undefined {
  const amount = payload.amount as number;
  if (amount === undefined) return undefined;

  // Check if already in cents (integer) or needs conversion
  if (Number.isInteger(amount)) {
    return amount;
  }
  // Assume decimal, convert to cents
  return Math.round(amount * 100);
}

// ============================================================================
// WEBHOOK EVENT PROCESSOR CLASS
// ============================================================================

/**
 * Webhook Event Processor
 *
 * Processes incoming webhook events from payment providers,
 * ensuring idempotency, analytics tracking, and proper routing.
 */
export class WebhookEventProcessor {
  /**
   * Check if an event has already been processed (idempotency check)
   */
  async isDuplicate(eventId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('polar_webhook_events')
        .select('id')
        .eq('event_id', eventId)
        .single();

      if (error) {
        // psql:unique_violation or not found = not duplicate
        if (error.code === 'PGRST116') {
          return false;
        }
        uiLogger.error('[WebhookEventProcessor] Error checking duplicate:', error);
        return false; // Fail open - process if we can't verify
      }

      return !!data;
    } catch (error) {
      uiLogger.error('[WebhookEventProcessor] Unexpected error in isDuplicate:', error);
      return false; // Fail open
    }
  }

  /**
   * Store webhook event for analytics
   */
  private async storeEvent(
    event: WebhookEvent,
    processed: boolean = true,
    processingError?: string
  ): Promise<void> {
    const payload = event.payload;
    const tier = mapPlanToTier(
      (payload.plan_name as string) ||
      (payload.product_name as string) ||
      (payload.tier as string)
    );

    const eventData: Partial<StoredWebhookEvent> = {
      event_id: event.id,
      event_type: event.type,
      customer_id: extractCustomerId(payload),
      subscription_id: extractSubscriptionId(payload),
      amount_cents: extractAmountCents(payload),
      currency: (payload.currency as string) || 'USD',
      customer_email: payload.customer_email as string,
      customer_name: payload.customer_name as string,
      product_name: payload.product_name as string,
      tier,
      payload,
      processed,
      processed_at: processed ? new Date().toISOString() : undefined,
      processing_error: processingError,
    };

    const { error } = await supabase
      .from('polar_webhook_events')
      .insert(eventData as StoredWebhookEvent);

    if (error) {
      uiLogger.error('[WebhookEventProcessor] Failed to store event:', error);
      throw error;
    }
  }

  /**
   * Log event to audit trail
   */
  private async logAudit(
    userId: string,
    action: string,
    payload: Record<string, unknown>,
    severity: 'success' | 'failure' | 'warning' = 'success'
  ): Promise<void> {
    try {
      const { error } = await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        payload: { ...payload, severity, provider: 'webhook-processor' },
        user_agent: 'WebhookEventProcessor',
        ip_address: '0.0.0.0',
      });

      if (error) {
        uiLogger.error('[WebhookEventProcessor] Audit log failed:', error);
      }
    } catch (error) {
      uiLogger.error('[WebhookEventProcessor] Unexpected error in audit logging:', error);
      // Silent failure - audit logging should not break main flow
    }
  }

  /**
   * Process subscription.activated event
   */
  private async processSubscriptionActivated(event: WebhookEvent): Promise<void> {
    const payload = event.payload;
    const customerId = extractCustomerId(payload);

    if (!customerId) {
      uiLogger.warn('[WebhookEventProcessor] Missing customer_id in subscription.activated');
      return;
    }

    // Log activation
    await this.logAudit(customerId, 'SUBSCRIPTION_ACTIVATED', {
      subscription_id: extractSubscriptionId(payload),
      provider: event.provider,
      source: event.type,
    }, 'success');
  }

  /**
   * Process subscription.canceled event
   */
  private async processSubscriptionCanceled(event: WebhookEvent): Promise<void> {
    const payload = event.payload;
    const customerId = extractCustomerId(payload);

    if (!customerId) {
      uiLogger.warn('[WebhookEventProcessor] Missing customer_id in subscription.canceled');
      return;
    }

    // Mark subscription for grace period (pending revocation)
    const subscriptionId = extractSubscriptionId(payload);
    if (subscriptionId) {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'pending_revocation',
          canceled_at: new Date().toISOString(),
        })
        .eq('polar_subscription_id', subscriptionId);

      if (error) {
        uiLogger.error('[WebhookEventProcessor] Failed to update subscription status:', error);
        await this.logAudit(customerId, 'SUBSCRIPTION_CANCEL_UPDATE_FAILED', {
          error: error.message,
        }, 'failure');
      } else {
        await this.logAudit(customerId, 'SUBSCRIPTION_CANCELED', {
          source: event.provider,
        }, 'success');
      }
    }
  }

  /**
   * Process subscription.expired event
   */
  private async processSubscriptionExpired(event: WebhookEvent): Promise<void> {
    const payload = event.payload;
    const customerId = extractCustomerId(payload);

    if (!customerId) {
      uiLogger.warn('[WebhookEventProcessor] Missing customer_id in subscription.expired');
      return;
    }

    // Revoke license on expiry
    await this.logAudit(customerId, 'LICENSE_EXPIRED', {
      reason: 'subscription_expired',
      source: event.provider,
    }, 'success');
  }

  /**
   * Process payment.succeeded event
   */
  private async processPaymentSucceeded(event: WebhookEvent): Promise<void> {
    const payload = event.payload;
    const customerId = extractCustomerId(payload);

    if (!customerId) {
      uiLogger.warn('[WebhookEventProcessor] Missing customer_id in payment.succeeded');
      return;
    }

    const subscriptionId = extractSubscriptionId(payload);
    if (subscriptionId) {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          last_payment_at: new Date().toISOString(),
          next_payment_at: this.calculateNextPaymentDate(
            (payload.billing_cycle as 'monthly' | 'yearly') || 'monthly'
          ),
        })
        .eq('polar_subscription_id', subscriptionId);

      if (error) {
        uiLogger.error('[WebhookEventProcessor] Failed to update payment info:', error);
        await this.logAudit(customerId, 'PAYMENT_UPDATE_FAILED', {
          error: error.message,
        }, 'failure');
      } else {
        await this.logAudit(customerId, 'PAYMENT_SUCCEEDED', {
          amount: extractAmountCents(payload),
          currency: payload.currency as string,
          source: event.provider,
        }, 'success');
      }
    }
  }

  /**
   * Process payment.failed event
   */
  private async processPaymentFailed(event: WebhookEvent): Promise<void> {
    const payload = event.payload;
    const customerId = extractCustomerId(payload);

    if (!customerId) {
      uiLogger.warn('[WebhookEventProcessor] Missing customer_id in payment.failed');
      return;
    }

    const subscriptionId = extractSubscriptionId(payload);
    if (subscriptionId) {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'past_due' })
        .eq('polar_subscription_id', subscriptionId);

      if (error) {
        uiLogger.error('[WebhookEventProcessor] Failed to update past_due status:', error);
      }

      await this.logAudit(customerId, 'PAYMENT_FAILED', {
        source: event.provider,
      }, 'failure');
    }
  }

  /**
   * Process usage.billing_sync event
   */
  private async processUsageBillingSync(event: WebhookEvent): Promise<void> {
    const payload = event.payload;
    const overageTransactionId = payload.overage_transaction_id as string;
    const customerId = extractCustomerId(payload);

    if (!overageTransactionId) {
      uiLogger.warn('[WebhookEventProcessor] Missing overage_transaction_id in billing_sync');
      return;
    }

    const { error } = await supabase
      .from('overage_transactions')
      .update({
        polar_transaction_id: payload.polar_transaction_id as string,
        stripe_sync_status: 'synced',
        polar_synced_at: new Date().toISOString(),
      })
      .eq('id', overageTransactionId);

    if (error) {
      uiLogger.error('[WebhookEventProcessor] Failed to sync overage transaction:', error);
      if (customerId) {
        await this.logAudit(customerId, 'OVERAGE_SYNC_FAILED', {
          overage_transaction_id: overageTransactionId,
          error: error.message,
        }, 'failure');
      }
    } else {
      uiLogger.info('[WebhookEventProcessor] Overage transaction synced:', overageTransactionId);
      if (customerId) {
        await this.logAudit(customerId, 'OVERAGE_SYNCED', {
          overage_transaction_id: overageTransactionId,
          polar_transaction_id: payload.polar_transaction_id,
        }, 'success');
      }
    }
  }

  /**
   * Process usage.overage_detected event
   */
  private async processUsageOverageDetected(event: WebhookEvent): Promise<void> {
    const payload = event.payload;
    const customerId = extractCustomerId(payload);
    const metricType = payload.metric_type as string;

    if (!customerId || !metricType) {
      uiLogger.warn('[WebhookEventProcessor] Missing customer_id or metric_type in overage_detected');
      return;
    }

    // Log to alert_events
    const { error } = await supabase.from('alert_events').insert({
      event_type: 'overage_detected',
      customer_id: customerId,
      org_id: payload.org_id as string,
      metric_type: metricType,
      payload: payload as Record<string, unknown>,
    });

    if (error) {
      uiLogger.error('[WebhookEventProcessor] Failed to log overage alert:', error);
    } else {
      uiLogger.info('[WebhookEventProcessor] Overage detected:', { customerId, metricType });
    }
  }

  /**
   * Process usage.quota_exhausted event
   */
  private async processUsageQuotaExhausted(event: WebhookEvent): Promise<void> {
    const payload = event.payload;
    const orgId = payload.org_id as string;
    const metricType = payload.metric_type as string;
    const customerId = extractCustomerId(payload);

    if (!orgId || !metricType) {
      uiLogger.warn('[WebhookEventProcessor] Missing org_id or metric_type in quota_exhausted');
      return;
    }

    // Update billing state
    try {
      const { error } = await supabase.from('billing_state').upsert({
        org_id: orgId,
        metric_type: metricType,
        current_usage: (payload.current_usage as number) || 0,
        quota_limit: (payload.quota_limit as number) || 0,
        percentage_used: (payload.percentage as number) || 100,
        is_exhausted: true,
        last_sync: new Date().toISOString(),
      }, {
        onConflict: 'org_id,metric_type',
      });

      if (error) {
        uiLogger.error('[WebhookEventProcessor] Failed to update billing_state:', error);
      }
    } catch (err) {
      uiLogger.error('[WebhookEventProcessor] Error updating billing state:', err);
    }

    // Log critical alert
    const { error } = await supabase.from('alert_events').insert({
      event_type: 'quota_exhausted',
      customer_id: customerId || 'unknown',
      org_id: orgId,
      metric_type: metricType,
      severity: 'critical',
      payload: payload as Record<string, unknown>,
    });

    if (error) {
      uiLogger.error('[WebhookEventProcessor] Failed to log quota exhausted alert:', error);
    } else {
      uiLogger.info('[WebhookEventProcessor] Quota exhausted:', { orgId, metricType });
    }
  }

  /**
   * Helper: Calculate next payment date based on billing cycle
   */
  private calculateNextPaymentDate(billingCycle: 'monthly' | 'yearly'): string {
    const now = new Date();
    if (billingCycle === 'monthly') {
      now.setMonth(now.getMonth() + 1);
    } else {
      now.setFullYear(now.getFullYear() + 1);
    }
    return now.toISOString();
  }

  /**
   * Route event to appropriate handler based on type
   */
  private async routeEvent(event: WebhookEvent): Promise<void> {
    switch (event.type) {
      case 'subscription.activated':
        return this.processSubscriptionActivated(event);
      case 'subscription.canceled':
        return this.processSubscriptionCanceled(event);
      case 'subscription.expired':
        return this.processSubscriptionExpired(event);
      case 'payment.succeeded':
        return this.processPaymentSucceeded(event);
      case 'payment.failed':
        return this.processPaymentFailed(event);
      case 'usage.billing_sync':
        return this.processUsageBillingSync(event);
      case 'usage.overage_detected':
        return this.processUsageOverageDetected(event);
      case 'usage.quota_exhausted':
        return this.processUsageQuotaExhausted(event);
      default:
        uiLogger.warn('[WebhookEventProcessor] Unhandled event type:', event.type);
    }
  }

  /**
   * Main entry point: Process a webhook event
   *
   * @param event - The incoming webhook event
   * @returns ProcessEventResult with success status and metadata
   */
  async processEvent(event: WebhookEvent): Promise<ProcessEventResult> {
    const startTime = Date.now();

    try {
      // Step 1: Check for duplicate (idempotency)
      const isDuplicate = await this.isDuplicate(event.id);
      if (isDuplicate) {
        uiLogger.info('[WebhookEventProcessor] Duplicate event detected, skipping:', event.id);
        return {
          success: true,
          eventId: event.id,
          eventType: event.type,
          wasDuplicate: true,
        };
      }

      // Step 2: Store event for analytics (before processing)
      await this.storeEvent(event, false);

      // Step 3: Route to appropriate handler
      await this.routeEvent(event);

      // Step 4: Mark as processed
      await this.storeEvent(event, true);

      const duration = Date.now() - startTime;
      uiLogger.info('[WebhookEventProcessor] Event processed successfully:', {
        eventId: event.id,
        type: event.type,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        wasDuplicate: false,
        metadata: {
          customerId: extractCustomerId(event.payload),
          subscriptionId: extractSubscriptionId(event.payload),
          amount: extractAmountCents(event.payload),
          currency: event.payload.currency as string,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      uiLogger.error('[WebhookEventProcessor] Event processing failed:', {
        eventId: event.id,
        error: errorMessage,
      });

      // Attempt to store error state
      try {
        await this.storeEvent(event, false, errorMessage);
      } catch (storeError) {
        uiLogger.error('[WebhookEventProcessor] Failed to store error state:', storeError);
      }

      return {
        success: false,
        eventId: event.id,
        eventType: event.type,
        wasDuplicate: false,
        error: errorMessage,
      };
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Default instance for convenience
export const webhookEventProcessor = new WebhookEventProcessor();
