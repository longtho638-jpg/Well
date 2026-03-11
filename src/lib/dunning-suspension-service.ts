/**
 * Dunning Suspension Service
 *
 * Handles subscription suspension for overdue accounts.
 */

import { supabase } from '@/lib/supabase'
import type { DunningConfig } from './dunning-types'

/**
 * Raw database row type for email sequence items
 */
interface EmailSequenceRow {
  stage: string
  day: number
  template: string
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
 * Suspend subscription after max dunning days
 */
export async function suspendOverdueSubscriptions(): Promise<{
  success: boolean
  suspendedCount: number
  error?: string
}> {
  try {
    const { data: overdueDunning } = await supabase
      .from('dunning_events')
      .select('subscription_id, org_id')
      .eq('resolved', false)
      .gte('days_since_failure', 14)

    if (!overdueDunning || overdueDunning.length === 0) {
      return { success: true, suspendedCount: 0 }
    }

    let suspendedCount = 0

    for (const dunning of overdueDunning) {
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
          .eq('status', 'past_due')

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
