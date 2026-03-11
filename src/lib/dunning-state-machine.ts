/**
 * Dunning State Machine
 *
 * Manages dunning stage progression and state transitions.
 * Handles advancement through payment recovery stages.
 */

import { supabase } from '@/lib/supabase'
import { analyticsLogger } from '@/utils/logger'
import type { DunningStage, ResolutionMethod, DunningResolutionResult } from './dunning-types'

/**
 * Valid stage transitions
 */
const STAGE_TRANSITIONS: Record<DunningStage, DunningStage[]> = {
  initial: ['reminder'],
  reminder: ['final'],
  final: ['cancel_notice'],
  cancel_notice: [],
}

/**
 * Check if stage transition is valid
 */
export function isValidTransition(from: DunningStage, to: DunningStage): boolean {
  return STAGE_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Resolve dunning event after payment success
 */
export async function resolveDunning(
  dunningId: string,
  resolutionMethod: ResolutionMethod
): Promise<DunningResolutionResult> {
  try {
    const { error } = await supabase.rpc('resolve_dunning_event', {
      p_dunning_id: dunningId,
      p_resolution_method: resolutionMethod,
    })

    if (error) {
      analyticsLogger.error('[DunningStateMachine] Error resolving dunning:', error)
      return { success: false, dunningId, error: error.message }
    }

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
      analyticsLogger.error('[DunningStateMachine] Error processing stages:', error)
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
 * Get days since failure from dunning ID
 */
export async function getDaysSinceFailure(dunningId: string): Promise<number | null> {
  try {
    const { data } = await supabase
      .from('dunning_events')
      .select('days_since_failure')
      .eq('id', dunningId)
      .single()

    return data?.days_since_failure ?? null
  } catch {
    return null
  }
}

/**
 * Get current dunning stage
 */
export async function getCurrentStage(dunningId: string): Promise<DunningStage | null> {
  try {
    const { data } = await supabase
      .from('dunning_events')
      .select('dunning_stage')
      .eq('id', dunningId)
      .single()

    return data?.dunning_stage ?? null
  } catch {
    return null
  }
}

/**
 * Advance dunning to next stage
 */
export async function advanceToNextStage(
  dunningId: string,
  currentStage: DunningStage,
  emailTemplate: string
): Promise<{ success: boolean; newStage?: DunningStage; error?: string }> {
  const nextStages = STAGE_TRANSITIONS[currentStage]

  if (!nextStages || nextStages.length === 0) {
    return { success: false, error: 'No further stages available' }
  }

  const nextStage = nextStages[0]

  const { error } = await supabase.rpc('advance_dunning_stage', {
    p_dunning_id: dunningId,
    p_new_stage: nextStage,
    p_email_template: emailTemplate,
    p_email_sent: true,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, newStage: nextStage }
}
