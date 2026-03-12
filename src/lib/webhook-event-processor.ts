/**
 * Polar.sh Webhook Event Processor
 *
 * Processes verified Polar webhook events and updates application state.
 * Handles subscription lifecycle, payment events, and usage tracking.
 *
 * Supported Events:
 * - subscription.activated: Provision license
 * - subscription.canceled: Schedule grace period
 * - subscription.expired: Revoke license
 * - payment.succeeded: Update payment records
 * - payment.failed: Mark subscription past_due
 * - usage.*: Overage billing events
 *
 * Usage:
 *   const processor = new WebhookEventProcessor(supabaseClient)
 *   await processor.processEvent(event)
 */

import { createLogger } from '@/utils/logger'

const logger = createLogger('WebhookProcessor')

/**
 * Polar webhook event types
 */
export type PolarEventType =
  | 'subscription.activated'
  | 'subscription.canceled'
  | 'subscription.expired'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'usage.billing_sync'
  | 'usage.overage_detected'
  | 'usage.quota_exhausted'
  | 'usage.threshold_warning'

/**
 * Polar webhook event payload
 */
export interface PolarWebhookEvent {
  type: PolarEventType
  data: Record<string, unknown>
}

/**
 * Event processing result
 */
export interface ProcessingResult {
  success: boolean
  eventType: string
  processedAt: string
  error?: string
  metadata?: Record<string, unknown>
}

/**
 * Supabase client type (using any to avoid schema type issues)
 */
 
type SupabaseClient = any

/**
 * Webhook Event Processor for Polar.sh events
 */
export class WebhookEventProcessor {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Process a Polar webhook event
   */
  async processEvent(event: PolarWebhookEvent): Promise<ProcessingResult> {
    logger.info('Processing webhook event', { type: event.type })

    try {
      // Store event for analytics first
      await this.storeWebhookEvent(event)

      // Route to specific handler
      switch (event.type) {
        case 'subscription.activated':
          return await this.handleSubscriptionActivated(event.data)
        case 'subscription.canceled':
          return await this.handleSubscriptionCanceled(event.data)
        case 'subscription.expired':
          return await this.handleSubscriptionExpired(event.data)
        case 'payment.succeeded':
          return await this.handlePaymentSucceeded(event.data)
        case 'payment.failed':
          return await this.handlePaymentFailed(event.data)
        case 'usage.billing_sync':
          return await this.handleUsageBillingSync(event.data)
        case 'usage.overage_detected':
          return await this.handleOverageDetected(event.data)
        case 'usage.quota_exhausted':
          return await this.handleQuotaExhausted(event.data)
        case 'usage.threshold_warning':
          return await this.handleThresholdWarning(event.data)
        default:
          logger.warn('Unhandled event type', { type: event.type })
          return {
            success: true,
            eventType: event.type,
            processedAt: new Date().toISOString(),
            metadata: { unhandled: true },
          }
      }
    } catch (error) {
      logger.error('Event processing failed', {
        type: event.type,
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        success: false,
        eventType: event.type,
        processedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Store webhook event for analytics
   */
  private async storeWebhookEvent(event: PolarWebhookEvent): Promise<void> {
    try {
      const eventData = this.extractEventData(event.data)

      await this.supabase.from('polar_webhook_events').insert({
        event_id: crypto.randomUUID(),
        event_type: event.type,
        customer_id: eventData.customerId,
        subscription_id: eventData.subscriptionId,
        amount_cents: eventData.amount,
        currency: eventData.currency,
        product_name: eventData.productName,
        tier: this.mapPlanToTier(eventData.tier),
        payload: event.data,
        processed: true,
        processed_at: new Date().toISOString(),
      })
    } catch (error) {
      logger.error('Failed to store webhook event', { error })
    }
  }

  /**
   * Extract event data from payload
   */
  private extractEventData(data: Record<string, unknown>) {
    return {
      customerId: (data.user_id as string) || (data.customer_id as string),
      subscriptionId: data.subscription_id as string,
      amount: (data.amount as number) || 0,
      currency: (data.currency as string) || 'USD',
      productName: (data.plan_name as string) || (data.product_name as string) || '',
      tier: data.plan_name as string | undefined,
    }
  }

  /**
   * Map plan name to tier
   */
  private mapPlanToTier(planName: string | undefined): string {
    if (!planName) return 'free'
    const name = planName.toLowerCase()
    if (name.includes('master')) return 'master'
    if (name.includes('enterprise')) return 'enterprise'
    if (name.includes('premium')) return 'premium'
    if (name.includes('basic') || name.includes('starter')) return 'basic'
    return 'free'
  }

  /**
   * Handle subscription.activated event
   */
  private async handleSubscriptionActivated(
    data: Record<string, unknown>
  ): Promise<ProcessingResult> {
    const subscriptionData = data as {
      user_id?: string
      plan_id?: string
      billing_cycle?: 'monthly' | 'yearly'
      org_id?: string
      subscription_id?: string
    }

    const user_id = subscriptionData.user_id
    const plan_id = subscriptionData.plan_id

    if (!user_id || !plan_id) {
      return {
        success: false,
        eventType: 'subscription.activated',
        processedAt: new Date().toISOString(),
        error: 'Missing user_id or plan_id',
      }
    }

    // Import and call license provisioning
    const { provisionLicenseOnPayment } = await import('@/lib/raas-license-provision')

    const result = await provisionLicenseOnPayment(
      {
        userId: user_id,
        planId: plan_id,
        billingCycle: subscriptionData.billing_cycle || 'monthly',
        paymentAmount: 0,
        paymentId: subscriptionData.subscription_id || '',
        orgId: subscriptionData.org_id,
      },
      this.supabase
    )

    logger.info('License provisioned', { userId: user_id, success: result.success })

    return {
      success: result.success,
      eventType: 'subscription.activated',
      processedAt: new Date().toISOString(),
      metadata: { userId: user_id, licenseId: result.license?.id },
    }
  }

  /**
   * Handle subscription.canceled event
   */
  private async handleSubscriptionCanceled(
    data: Record<string, unknown>
  ): Promise<ProcessingResult> {
    const subscriptionData = data as {
      user_id?: string
      subscription_id?: string
    }

    const user_id = subscriptionData.user_id
    const subscription_id = subscriptionData.subscription_id

    if (!user_id) {
      return {
        success: false,
        eventType: 'subscription.canceled',
        processedAt: new Date().toISOString(),
        error: 'Missing user_id',
      }
    }

    // Mark for grace period (don't revoke immediately)
    const { error } = await this.supabase
      .from('user_subscriptions')
      .update({
        status: 'pending_revocation',
        canceled_at: new Date().toISOString(),
      })
      .eq('polar_subscription_id', subscription_id)

    if (error) {
      logger.error('Failed to update subscription status', { error })
      return {
        success: false,
        eventType: 'subscription.canceled',
        processedAt: new Date().toISOString(),
        error: error.message,
      }
    }

    return {
      success: true,
      eventType: 'subscription.canceled',
      processedAt: new Date().toISOString(),
      metadata: { userId: user_id, subscriptionId: subscription_id },
    }
  }

  /**
   * Handle subscription.expired event
   */
  private async handleSubscriptionExpired(
    data: Record<string, unknown>
  ): Promise<ProcessingResult> {
    const subscriptionData = data as {
      user_id?: string
    }

    const user_id = subscriptionData.user_id

    if (!user_id) {
      return {
        success: false,
        eventType: 'subscription.expired',
        processedAt: new Date().toISOString(),
        error: 'Missing user_id',
      }
    }

    // Revoke license immediately on expiry
    const { revokeLicenseOnCancel } = await import('@/lib/raas-license-provision')

    const result = await revokeLicenseOnCancel(user_id, this.supabase)

    return {
      success: result.success,
      eventType: 'subscription.expired',
      processedAt: new Date().toISOString(),
      metadata: { userId: user_id, revokedCount: result.revokedCount },
    }
  }

  /**
   * Handle payment.succeeded event
   */
  private async handlePaymentSucceeded(
    data: Record<string, unknown>
  ): Promise<ProcessingResult> {
    const paymentData = data as {
      user_id?: string
      subscription_id?: string
    }

    const user_id = paymentData.user_id
    const subscription_id = paymentData.subscription_id

    if (!user_id || !subscription_id) {
      return {
        success: false,
        eventType: 'payment.succeeded',
        processedAt: new Date().toISOString(),
        error: 'Missing user_id or subscription_id',
      }
    }

    // Update subscription with payment info
    const { error } = await this.supabase
      .from('user_subscriptions')
      .update({
        last_payment_at: new Date().toISOString(),
        next_payment_at: this.calculateNextPaymentDate('monthly'),
      })
      .eq('polar_subscription_id', subscription_id)

    if (error) {
      return {
        success: false,
        eventType: 'payment.succeeded',
        processedAt: new Date().toISOString(),
        error: error.message,
      }
    }

    return {
      success: true,
      eventType: 'payment.succeeded',
      processedAt: new Date().toISOString(),
      metadata: { userId: user_id, subscriptionId: subscription_id },
    }
  }

  /**
   * Handle payment.failed event
   */
  private async handlePaymentFailed(
    data: Record<string, unknown>
  ): Promise<ProcessingResult> {
    const paymentData = data as {
      user_id?: string
      subscription_id?: string
    }

    const subscription_id = paymentData.subscription_id

    if (!subscription_id) {
      return {
        success: false,
        eventType: 'payment.failed',
        processedAt: new Date().toISOString(),
        error: 'Missing subscription_id',
      }
    }

    // Mark subscription as past_due
    const { error } = await this.supabase
      .from('user_subscriptions')
      .update({ status: 'past_due' })
      .eq('polar_subscription_id', subscription_id)

    if (error) {
      return {
        success: false,
        eventType: 'payment.failed',
        processedAt: new Date().toISOString(),
        error: error.message,
      }
    }

    return {
      success: true,
      eventType: 'payment.failed',
      processedAt: new Date().toISOString(),
      metadata: { userId: paymentData.user_id, subscriptionId: subscription_id },
    }
  }

  /**
   * Handle usage.billing_sync event
   */
  private async handleUsageBillingSync(
    data: Record<string, unknown>
  ): Promise<ProcessingResult> {
    const usageData = data as {
      overage_transaction_id?: string
      polar_transaction_id?: string
      customer_id?: string
    }

    const overage_transaction_id = usageData.overage_transaction_id

    if (!overage_transaction_id) {
      return {
        success: false,
        eventType: 'usage.billing_sync',
        processedAt: new Date().toISOString(),
        error: 'Missing overage_transaction_id',
      }
    }

    // Update overage transaction with Polar transaction ID
    const { error } = await this.supabase
      .from('overage_transactions')
      .update({
        polar_transaction_id: usageData.polar_transaction_id,
        stripe_sync_status: 'synced',
        polar_synced_at: new Date().toISOString(),
      })
      .eq('id', overage_transaction_id)

    if (error) {
      return {
        success: false,
        eventType: 'usage.billing_sync',
        processedAt: new Date().toISOString(),
        error: error.message,
      }
    }

    return {
      success: true,
      eventType: 'usage.billing_sync',
      processedAt: new Date().toISOString(),
      metadata: { transactionId: overage_transaction_id },
    }
  }

  /**
   * Handle usage.overage_detected event
   */
  private async handleOverageDetected(
    data: Record<string, unknown>
  ): Promise<ProcessingResult> {
    const usageData = data as {
      customer_id?: string
      org_id?: string
      metric_type?: string
    }

    const customer_id = usageData.customer_id
    const metric_type = usageData.metric_type

    if (!customer_id || !metric_type) {
      return {
        success: false,
        eventType: 'usage.overage_detected',
        processedAt: new Date().toISOString(),
        error: 'Missing customer_id or metric_type',
      }
    }

    // Log overage detection for analytics
    await this.supabase.from('alert_events').insert({
      event_type: 'overage_detected',
      customer_id,
      org_id: usageData.org_id,
      metric_type,
      payload: data,
    })

    return {
      success: true,
      eventType: 'usage.overage_detected',
      processedAt: new Date().toISOString(),
      metadata: { customerId: customer_id, metricType: metric_type },
    }
  }

  /**
   * Handle usage.quota_exhausted event
   */
  private async handleQuotaExhausted(
    data: Record<string, unknown>
  ): Promise<ProcessingResult> {
    const usageData = data as {
      customer_id?: string
      org_id?: string
      metric_type?: string
      current_usage?: number
      quota_limit?: number
      percentage?: number
    }

    const org_id = usageData.org_id
    const metric_type = usageData.metric_type

    if (!org_id || !metric_type) {
      return {
        success: false,
        eventType: 'usage.quota_exhausted',
        processedAt: new Date().toISOString(),
        error: 'Missing org_id or metric_type',
      }
    }

    // Update billing state
    try {
      await this.supabase.from('billing_state').upsert(
        {
          org_id,
          metric_type,
          current_usage: usageData.current_usage || 0,
          quota_limit: usageData.quota_limit || 0,
          percentage_used: Math.round(usageData.percentage || 100),
          is_exhausted: true,
          last_sync: new Date().toISOString(),
        },
        { onConflict: 'org_id,metric_type' }
      )
    } catch (error) {
      logger.error('Failed to update billing_state', { error })
    }

    // Log critical alert
    await this.supabase.from('alert_events').insert({
      event_type: 'quota_exhausted',
      customer_id: usageData.customer_id || 'unknown',
      org_id,
      metric_type,
      severity: 'critical',
      payload: data,
    })

    return {
      success: true,
      eventType: 'usage.quota_exhausted',
      processedAt: new Date().toISOString(),
      metadata: { orgId: org_id, metricType: metric_type },
    }
  }

  /**
   * Handle usage.threshold_warning event
   */
  private async handleThresholdWarning(
    data: Record<string, unknown>
  ): Promise<ProcessingResult> {
    const usageData = data as {
      customer_id?: string
      org_id?: string
      metric_type?: string
      percentage?: number
      threshold?: number
    }

    const org_id = usageData.org_id
    const metric_type = usageData.metric_type

    if (!org_id || !metric_type) {
      return {
        success: false,
        eventType: 'usage.threshold_warning',
        processedAt: new Date().toISOString(),
        error: 'Missing org_id or metric_type',
      }
    }

    // Log warning alert
    await this.supabase.from('alert_events').insert({
      event_type: 'threshold_warning',
      customer_id: usageData.customer_id || 'unknown',
      org_id,
      metric_type,
      severity: (usageData.percentage || 0) >= 90 ? 'critical' : 'warning',
      payload: data,
    })

    return {
      success: true,
      eventType: 'usage.threshold_warning',
      processedAt: new Date().toISOString(),
      metadata: { orgId: org_id, threshold: usageData.threshold, percentage: usageData.percentage },
    }
  }

  /**
   * Calculate next payment date
   */
  private calculateNextPaymentDate(billingCycle: 'monthly' | 'yearly'): string {
    const now = new Date()
    if (billingCycle === 'monthly') {
      now.setMonth(now.getMonth() + 1)
    } else {
      now.setFullYear(now.getFullYear() + 1)
    }
    return now.toISOString()
  }
}

/**
 * Factory function for creating processor instance
 */
export function createWebhookEventProcessor(supabase: SupabaseClient): WebhookEventProcessor {
  return new WebhookEventProcessor(supabase)
}

/**
 * Export as namespace
 */
export const WebhookEventProcessorLib = {
  WebhookEventProcessor,
  createWebhookEventProcessor,
}

export default WebhookEventProcessorLib
