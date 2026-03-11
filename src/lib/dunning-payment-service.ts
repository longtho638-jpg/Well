/**
 * Dunning Payment Service
 *
 * Handles payment recovery operations and dunning event retrieval.
 */

import { supabase } from '@/lib/supabase'
import { analyticsLogger } from '@/utils/logger'
import type { DunningEvent } from './dunning-types'

/**
 * Raw database row type for dunning events
 */
interface DunningEventRow {
  id: string
  org_id: string
  user_id: string | null
  subscription_id: string | null
  stripe_invoice_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  amount_owed: string
  currency: string
  attempt_count: number
  dunning_stage: 'initial' | 'reminder' | 'final' | 'cancel_notice'
  days_since_failure: number
  email_sent: boolean
  email_template: string | null
  email_sent_at: string | null
  email_opened: boolean
  email_clicked: boolean
  payment_url: string | null
  payment_link_expires_at: string | null
  resolved: boolean
  resolved_at: string | null
  resolution_method: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

/**
 * Log payment failure and create dunning event
 */
export async function handlePaymentFailed(
  event: {
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
      analyticsLogger.error('[DunningPaymentService] Error logging dunning event:', error)
      return { success: false, error: error.message }
    }

    return { success: true, dunningId: data }
  } catch (err) {
    analyticsLogger.error('[DunningPaymentService] Error:', err)
    return {
      success: false,
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
      analyticsLogger.error('[DunningPaymentService] Error fetching active events:', error)
      return []
    }

    return (data || []).map((item: DunningEventRow) => ({
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
    analyticsLogger.error('[DunningPaymentService] Error:', err)
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
      return getDefaultStats()
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
    analyticsLogger.error('[DunningPaymentService] Error fetching statistics:', err)
    return getDefaultStats()
  }
}

function getDefaultStats() {
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
