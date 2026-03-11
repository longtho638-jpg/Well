/**
 * Dunning Email Service
 *
 * Handles dunning email sequence sending via Edge Functions.
 * Manages email template selection and email state tracking.
 */

import { supabase } from '@/lib/supabase'
import { analyticsLogger } from '@/utils/logger'
import type { DunningEmailResult, DunningStage, DunningConfig } from './dunning-types'

/**
 * Raw database row type for email sequence items
 */
interface EmailSequenceRow {
  stage: string
  day: number
  template: string
}

/**
 * Raw database row type for dunning emails
 */
interface DunningEmailRow {
  dunning_id: string
  org_id: string
  user_id: string | null
  email_template: string
  amount_owed: string
  payment_url: string | null
  days_since_failure: number
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
      return getDefaultConfig(orgId)
    }

    return {
      ...data,
      orgId: data.org_id,
      emailSequence: Array.isArray(data.email_sequence)
        ? data.email_sequence.map((s: EmailSequenceRow) => ({
            stage: s.stage,
            day: s.day,
            template: s.template,
          }))
        : [],
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
    analyticsLogger.error('[DunningEmailService] Error fetching config:', err)
    return getDefaultConfig(orgId)
  }
}

function getDefaultConfig(orgId: string): DunningConfig {
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

/**
 * Get email template for dunning stage
 */
export function getEmailTemplateForStage(stage: DunningStage): string {
  const templates: Record<DunningStage, string> = {
    initial: 'dunning-initial',
    reminder: 'dunning-reminder',
    final: 'dunning-final',
    cancel_notice: 'dunning-cancel',
  }
  return templates[stage]
}

/**
 * Map template name to stage
 */
export function getStageFromTemplate(template: string): DunningStage {
  if (template.includes('reminder')) return 'reminder'
  if (template.includes('final')) return 'final'
  if (template.includes('cancel')) return 'cancel_notice'
  return 'initial'
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

    const stage = getStageFromTemplate(template)

    await supabase.rpc('advance_dunning_stage', {
      p_dunning_id: dunningId,
      p_new_stage: stage,
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
      analyticsLogger.error('[DunningEmailService] Error getting pending emails:', error)
      return []
    }

    return (data || []).map((item: DunningEmailRow) => ({
      dunningId: item.dunning_id,
      orgId: item.org_id,
      userId: item.user_id,
      emailTemplate: item.email_template,
      amountOwed: parseFloat(item.amount_owed),
      paymentUrl: item.payment_url,
      daysSinceFailure: item.days_since_failure,
    }))
  } catch (err) {
    analyticsLogger.error('[DunningEmailService] Error:', err)
    return []
  }
}

/**
 * Send email sequence based on config
 */
export async function sendEmailSequence(
  dunningId: string,
  orgId: string,
  config: {
    emailSequence: Array<{ stage: string; day: number; template: string }>
    autoSendEmails: boolean
  },
  daysSinceFailure: number
): Promise<DunningEmailResult[]> {
  if (!config.autoSendEmails) {
    return []
  }

  const results: DunningEmailResult[] = []

  for (const email of config.emailSequence) {
    if (daysSinceFailure >= email.day) {
      const result = await sendDunningEmail(dunningId, email.template)
      results.push(result)
      if (!result.success) break
    }
  }

  return results
}
