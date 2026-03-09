/**
 * Dunning Service - Phase 7
 *
 * Manages payment failure recovery, dunning email sequences, and subscription suspension.
 * Handles Stripe webhook events and orchestrates dunning stage progression.
 *
 * Usage:
 *   import { dunningService } from '@/lib/dunning-service'
 *
 *   // On payment failure
 *   await dunningService.handlePaymentFailed({ orgId, userId, subscriptionId, amount, stripeInvoiceId })
 *
 *   // Send dunning email
 *   await dunningService.sendDunningEmail(dunningId, 'reminder')
 *
 *   // Resolve dunning
 *   await dunningService.resolveDunning(dunningId, 'payment_success')
 */

import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/database.types'

export interface DunningEvent {
  id: string
  orgId: string
  userId: string | null
  subscriptionId: string | null
  stripeInvoiceId: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  amountOwed: number
  currency: string
  attemptCount: number
  dunningStage: 'initial' | 'reminder' | 'final' | 'cancel_notice'
  daysSinceFailure: number
  emailSent: boolean
  emailTemplate: string | null
  emailSentAt: string | null
  emailOpened: boolean
  emailClicked: boolean
  paymentUrl: string | null
  paymentLinkExpiresAt: string | null
  resolved: boolean
  resolvedAt: string | null
  resolutionMethod: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface DunningConfig {
  id: string
  orgId: string
  enabled: boolean
  maxRetryDays: number
  retryIntervalDays: number
  gracePeriodDays: number
  autoSendEmails: boolean
  emailSequence: Array<{
    stage: string
    day: number
    template: string
  }>
  autoSuspend: boolean
  suspendAfterDays: number
  createdAt: string
  updatedAt: string
}

export interface PaymentFailedEvent {
  orgId: string
  userId: string | null
  subscriptionId: string | null
  stripeInvoiceId: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  amount: number
  currency?: string
  paymentUrl?: string | null
}

export interface DunningEmailResult {
  success: boolean
  emailId?: string
  error?: string
}

export interface DunningResolutionResult {
  success: boolean
  dunningId: string
  subscriptionStatus?: string
  error?: string
}

/**
 * Log payment failure and create dunning event
 */
export async function handlePaymentFailed(
  event: PaymentFailedEvent
): Promise<{ success: boolean; dunningId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('log_dunning_event', {
      p_org_id: event.orgId,
      p_user_id: event.userId,
      p_subscription_id: event.subscriptionId,
      p_stripe_invoice_id: event.stripeInvoiceId,
      p_stripe_subscription_id: event.stripeSubscriptionId,
      p_stripe_customer_id: event.stripeCustomerId,
      p_amount_owed: event.amount,
      p_currency: event.currency || 'USD',
      p_payment_url: event.paymentUrl || null,
    })

    if (error) {
      console.error('[DunningService] Error logging dunning event:', error)
      return { success: false, error: error.message }
    }

    return { success: true, dunningId: data }
  } catch (err) {
    console.error('[DunningService] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get dunning config for organization
 */
export async function getDunningConfig(orgId: string): Promise<DunningConfig> {
  try {
    const { data, error } = await supabase.rpc('get_dunning_config', {
      p_org_id: orgId,
    })

    if (error || !data) {
      // Return default config
      return {
        id: '',
        orgId,
        enabled: true,
        maxRetryDays: 14,
        retryIntervalDays: 2,
        gracePeriodDays: 5,
        autoSendEmails: true,
        emailSequence: [
          { stage: 'initial', day: 0, template: 'dunning-initial' },
          { stage: 'reminder', day: 2, template: 'dunning-reminder' },
          { stage: 'final', day: 5, template: 'dunning-final' },
          { stage: 'cancel_notice', day: 10, template: 'dunning-cancel' },
        ],
        autoSuspend: true,
        suspendAfterDays: 14,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    return {
      ...data,
      orgId: data.org_id,
      emailSequence: (data.email_sequence as Json)?.map((s: any) => ({
        stage: s.stage,
        day: s.day,
        template: s.template,
      })) || [],
      autoSendEmails: data.auto_send_emails,
      autoSuspend: data.auto_suspend,
      suspendAfterDays: data.suspend_after_days,
      maxRetryDays: data.max_retry_days,
      retryIntervalDays: data.retry_interval_days,
      gracePeriodDays: data.grace_period_days,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (err) {
    console.error('[DunningService] Error fetching config:', err)
    // Return default config on error
    return {
      id: '',
      orgId,
      enabled: true,
      maxRetryDays: 14,
      retryIntervalDays: 2,
      gracePeriodDays: 5,
      autoSendEmails: true,
      emailSequence: [],
      autoSuspend: true,
      suspendAfterDays: 14,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

/**
 * Get pending dunning emails to send
 */
export async function getPendingDunningEmails(): Promise<
  Array<{
    dunningId: string
    orgId: string
    userId: string | null
    emailTemplate: string
    amountOwed: number
    paymentUrl: string | null
    daysSinceFailure: number
  }>
> {
  try {
    const { data, error } = await supabase.rpc('get_pending_dunning_emails')

    if (error) {
      console.error('[DunningService] Error getting pending emails:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      dunningId: item.dunning_id,
      orgId: item.org_id,
      userId: item.user_id,
      emailTemplate: item.email_template,
      amountOwed: parseFloat(item.amount_owed),
      paymentUrl: item.payment_url,
      daysSinceFailure: item.days_since_failure,
    }))
  } catch (err) {
    console.error('[DunningService] Error:', err)
    return []
  }
}

/**
 * Send dunning email via Edge Function
 */
export async function sendDunningEmail(
  dunningId: string,
  template: string,
  options?: {
    orgId?: string
    userId?: string
    amountOwed?: number
    paymentUrl?: string
  }
): Promise<DunningEmailResult> {
  try {
    // Call email edge function
    const { data, error } = await supabase.functions.invoke('send-dunning-email', {
      body: {
        dunning_id: dunningId,
        template,
        org_id: options?.orgId,
        user_id: options?.userId,
        amount_owed: options?.amountOwed,
        payment_url: options?.paymentUrl,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Mark email as sent in database
    await supabase.rpc('advance_dunning_stage', {
      p_dunning_id: dunningId,
      p_new_stage: template.includes('reminder') ? 'reminder' :
                   template.includes('final') ? 'final' :
                   template.includes('cancel') ? 'cancel_notice' : 'initial',
      p_email_template: template,
      p_email_sent: true,
    })

    return { success: true, emailId: data?.email_id }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Resolve dunning event after payment success
 */
export async function resolveDunning(
  dunningId: string,
  resolutionMethod: 'payment_success' | 'manual_override' | 'subscription_canceled'
): Promise<DunningResolutionResult> {
  try {
    const { error } = await supabase.rpc('resolve_dunning_event', {
      p_dunning_id: dunningId,
      p_resolution_method: resolutionMethod,
    })

    if (error) {
      console.error('[DunningService] Error resolving dunning:', error)
      return { success: false, dunningId, error: error.message }
    }

    // Get updated subscription status
    const { data: dunningData } = await supabase
      .from('dunning_events')
      .select('subscription_id')
      .eq('id', dunningId)
      .single()

    let subscriptionStatus: string | undefined

    if (dunningData?.subscription_id) {
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('id', dunningData.subscription_id)
        .single()

      subscriptionStatus = subData?.status
    }

    return { success: true, dunningId, subscriptionStatus }
  } catch (err) {
    return {
      success: false,
      dunningId,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Process dunning stage advancement (cron job)
 */
export async function processDunningStages(): Promise<{
  success: boolean
  updatedCount: number
  error?: string
}> {
  try {
    const { data, error } = await supabase.rpc('process_dunning_stages')

    if (error) {
      console.error('[DunningService] Error processing stages:', error)
      return { success: false, updatedCount: 0, error: error.message }
    }

    return { success: true, updatedCount: data || 0 }
  } catch (err) {
    return {
      success: false,
      updatedCount: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get active dunning events for dashboard
 */
export async function getActiveDunningEvents(orgId?: string): Promise<DunningEvent[]> {
  try {
    let query = supabase
      .from('dunning_events')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })

    if (orgId) {
      query = query.eq('org_id', orgId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[DunningService] Error fetching active events:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      orgId: item.org_id,
      userId: item.user_id,
      subscriptionId: item.subscription_id,
      stripeInvoiceId: item.stripe_invoice_id,
      stripeSubscriptionId: item.stripe_subscription_id,
      stripeCustomerId: item.stripe_customer_id,
      amountOwed: parseFloat(item.amount_owed),
      currency: item.currency,
      attemptCount: item.attempt_count,
      dunningStage: item.dunning_stage,
      daysSinceFailure: item.days_since_failure,
      emailSent: item.email_sent,
      emailTemplate: item.email_template,
      emailSentAt: item.email_sent_at,
      emailOpened: item.email_opened,
      emailClicked: item.email_clicked,
      paymentUrl: item.payment_url,
      paymentLinkExpiresAt: item.payment_link_expires_at,
      resolved: item.resolved,
      resolvedAt: item.resolved_at,
      resolutionMethod: item.resolution_method,
      metadata: item.metadata as Record<string, unknown>,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))
  } catch (err) {
    console.error('[DunningService] Error:', err)
    return []
  }
}

/**
 * Get dunning statistics for dashboard
 */
export async function getDunningStatistics(): Promise<{
  activeDunningCount: number
  resolvedCount: number
  initialStageCount: number
  reminderStageCount: number
  finalStageCount: number
  cancelNoticeCount: number
  totalAmountAtRisk: number
  avgResolvedAmount: number
  paymentRecoveryCount: number
  cancellationCount: number
}> {
  try {
    const { data, error } = await supabase.from('dunning_statistics').select('*').single()

    if (error || !data) {
      return {
        activeDunningCount: 0,
        resolvedCount: 0,
        initialStageCount: 0,
        reminderStageCount: 0,
        finalStageCount: 0,
        cancelNoticeCount: 0,
        totalAmountAtRisk: 0,
        avgResolvedAmount: 0,
        paymentRecoveryCount: 0,
        cancellationCount: 0,
      }
    }

    return {
      activeDunningCount: data.active_dunning_count || 0,
      resolvedCount: data.resolved_count || 0,
      initialStageCount: data.initial_stage_count || 0,
      reminderStageCount: data.reminder_stage_count || 0,
      finalStageCount: data.final_stage_count || 0,
      cancelNoticeCount: data.cancel_notice_count || 0,
      totalAmountAtRisk: parseFloat(data.total_amount_at_risk) || 0,
      avgResolvedAmount: parseFloat(data.avg_resolved_amount) || 0,
      paymentRecoveryCount: data.payment_recovery_count || 0,
      cancellationCount: data.cancellation_count || 0,
    }
  } catch (err) {
    console.error('[DunningService] Error fetching statistics:', err)
    return {
      activeDunningCount: 0,
      resolvedCount: 0,
      initialStageCount: 0,
      reminderStageCount: 0,
      finalStageCount: 0,
      cancelNoticeCount: 0,
      totalAmountAtRisk: 0,
      avgResolvedAmount: 0,
      paymentRecoveryCount: 0,
      cancellationCount: 0,
    }
  }
}

/**
 * Log failed webhook for retry
 */
export async function logFailedWebhook(options: {
  webhookId: string
  eventType: string
  payload: Record<string, unknown>
  errorMessage: string
  retryCount?: number
  nextRetryAt?: Date
}): Promise<{ success: boolean; recordId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('failed_webhooks')
      .insert({
        webhook_id: options.webhookId,
        event_type: options.eventType,
        payload: options.payload,
        error_message: options.errorMessage,
        retry_count: options.retryCount || 0,
        next_retry_at: options.nextRetryAt?.toISOString() || null,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, recordId: data.id }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get failed webhooks ready for retry
 */
export async function getFailedWebhooksForRetry(): Promise<
  Array<{
    id: string
    webhookId: string
    eventType: string
    payload: Record<string, unknown>
    errorMessage: string
    retryCount: number
  }>
> {
  try {
    const { data, error } = await supabase
      .from('failed_webhooks')
      .select('*')
      .eq('resolved', false)
      .lte('next_retry_at', new Date().toISOString())
      .lt('retry_count', 5) // Max 5 retries
      .order('next_retry_at', { ascending: true })
      .limit(50)

    if (error) {
      console.error('[DunningService] Error getting failed webhooks:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      webhookId: item.webhook_id,
      eventType: item.event_type,
      payload: item.payload as Record<string, unknown>,
      errorMessage: item.error_message,
      retryCount: item.retry_count,
    }))
  } catch (err) {
    console.error('[DunningService] Error:', err)
    return []
  }
}

/**
 * Mark webhook as resolved
 */
export async function resolveFailedWebhook(
  webhookId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('failed_webhooks')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq('webhook_id', webhookId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Suspend subscription after max dunning days
 */
export async function suspendOverdueSubscriptions(): Promise<{
  success: boolean
  suspendedCount: number
  error?: string
}> {
  try {
    // Get subscriptions past suspend threshold
    const { data: overdueDunning } = await supabase
      .from('dunning_events')
      .select('subscription_id, org_id')
      .eq('resolved', false)
      .gte('days_since_failure', 14) // Default suspend threshold

    if (!overdueDunning || overdueDunning.length === 0) {
      return { success: true, suspendedCount: 0 }
    }

    let suspendedCount = 0

    for (const dunning of overdueDunning) {
      // Check if config allows auto-suspend
      const config = await getDunningConfig(dunning.org_id)

      if (config.autoSuspend && dunning.subscription_id) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            metadata: {
              canceled_for: 'non_payment',
              canceled_at: new Date().toISOString(),
            },
          })
          .eq('id', dunning.subscription_id)
          .eq('status', 'past_due') // Only suspend if past_due

        if (!error) {
          suspendedCount++
        }
      }
    }

    return { success: true, suspendedCount }
  } catch (err) {
    return {
      success: false,
      suspendedCount: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Dunning Service
 */
export const dunningService = {
  handlePaymentFailed,
  getDunningConfig,
  getPendingDunningEmails,
  sendDunningEmail,
  resolveDunning,
  processDunningStages,
  getActiveDunningEvents,
  getDunningStatistics,
  logFailedWebhook,
  getFailedWebhooksForRetry,
  resolveFailedWebhook,
  suspendOverdueSubscriptions,
}

export default dunningService
