/**
 * RaaS Suspension Logic - Phase 6.3
 *
 * Handles subscription suspension based on billing state, dunning events,
 * and license status. Provides configurable grace periods and admin bypass.
 *
 * Usage:
 *   import { suspensionLogic, checkSuspensionStatus } from '@/lib/raas-suspension-logic'
 *
 *   const result = await suspensionLogic.checkSuspension(orgId)
 *   if (result.shouldSuspend) {
 *     return build403Response(result)
 *   }
 */

import { supabase } from '@/lib/supabase'
import { dunningService } from '@/lib/dunning-service'
import { raasAnalyticsEvents } from '@/lib/raas-analytics-events'
import type { LicenseEnforcementResult } from '@/types/license-enforcement'

/**
 * Suspension status result
 */
export interface SuspensionStatus {
  /** Whether the subscription should be suspended */
  shouldSuspend: boolean
  /** Suspension reason code */
  reason: SuspensionReason | null
  /** Human-readable message */
  message: string
  /** Days past due (if applicable) */
  daysPastDue: number
  /** Grace period remaining in hours (if applicable) */
  gracePeriodRemainingHours?: number
  /** Amount owed (if applicable) */
  amountOwed: number
  /** Subscription status */
  subscriptionStatus: SubscriptionStatus
  /** Dunning stage (if active) */
  dunningStage?: string
  /** Whether admin bypass is available */
  adminBypassAvailable: boolean
}

/**
 * Suspension reason codes
 */
export type SuspensionReason =
  | 'subscription_canceled'
  | 'subscription_expired'
  | 'payment_past_due'
  | 'dunning_active'
  | 'grace_period_expired'
  | 'license_revoked'
  | 'license_expired'
  | 'non_payment'

/**
 * Subscription status values
 */
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'expired'
  | 'incomplete'
  | 'none'

/**
 * Suspension config with defaults
 */
export interface SuspensionConfig {
  /** Grace period for past_due subscriptions (hours) */
  gracePeriodHours: number
  /** Dunning threshold before suspension (days) */
  dunningSuspensionDays: number
  /** Admin bypass key (optional) */
  adminBypassKey?: string
  /** Enable fail-open mode */
  failOpen: boolean
}

/**
 * Default suspension configuration
 */
const DEFAULT_CONFIG: SuspensionConfig = {
  gracePeriodHours: 24, // 24 hours grace period
  dunningSuspensionDays: 7, // Suspend after 7 days of active dunning
  failOpen: false, // Fail closed by default for billing
}

/**
 * Get suspension config for organization
 */
export async function getSuspensionConfig(
  orgId: string
): Promise<SuspensionConfig> {
  try {
    const { data, error } = await supabase
      .from('raas_config')
      .select('config_value')
      .eq('org_id', orgId)
      .in('config_key', [
        'grace_period_hours',
        'dunning_suspension_days',
        'admin_bypass_key',
        'fail_open',
      ])

    if (error || !data || data.length === 0) {
      return DEFAULT_CONFIG
    }

    const config: SuspensionConfig = {
      gracePeriodHours: DEFAULT_CONFIG.gracePeriodHours,
      dunningSuspensionDays: DEFAULT_CONFIG.dunningSuspensionDays,
      failOpen: DEFAULT_CONFIG.failOpen,
    }

    for (const row of data) {
      const key = row.config_key as string
      const value = row.config_value

      if (key === 'grace_period_hours') {
        config.gracePeriodHours = Number(value) || DEFAULT_CONFIG.gracePeriodHours
      } else if (key === 'dunning_suspension_days') {
        config.dunningSuspensionDays = Number(value) || DEFAULT_CONFIG.dunningSuspensionDays
      } else if (key === 'admin_bypass_key') {
        config.adminBypassKey = value
      } else if (key === 'fail_open') {
        config.failOpen = value === 'true'
      }
    }

    return config
  } catch (err) {
    console.error('[SuspensionLogic] Error fetching config:', err)
    return DEFAULT_CONFIG
  }
}

/**
 * Get billing state for organization
 */
export async function getBillingState(orgId: string): Promise<{
  subscriptionStatus: SubscriptionStatus
  currentPeriodEnd: string | null
  hasActiveSubscription: boolean
}> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('status, current_period_end')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return {
        subscriptionStatus: 'none',
        currentPeriodEnd: null,
        hasActiveSubscription: false,
      }
    }

    return {
      subscriptionStatus: data.status as SubscriptionStatus,
      currentPeriodEnd: data.current_period_end,
      hasActiveSubscription: ['active', 'trialing', 'past_due'].includes(data.status),
    }
  } catch (err) {
    console.error('[SuspensionLogic] Error fetching billing state:', err)
    return {
      subscriptionStatus: 'none',
      currentPeriodEnd: null,
      hasActiveSubscription: false,
    }
  }
}

/**
 * Check if subscription should be suspended
 *
 * @param orgId - Organization ID to check
 * @param license - Optional license info for additional checks
 * @param config - Optional suspension config
 * @returns SuspensionStatus with decision and details
 */
export async function checkSuspensionStatus(
  orgId: string,
  license?: LicenseEnforcementResult,
  config?: SuspensionConfig
): Promise<SuspensionStatus> {
  const effectiveConfig = config || DEFAULT_CONFIG

  // Get billing state
  const billingState = await getBillingState(orgId)

  // Check for admin bypass
  const adminBypassAvailable = license?.features?.['admin_bypass'] === true

  // Check license status first
  if (license) {
    if (license.status === 'revoked') {
      return {
        shouldSuspend: true,
        reason: 'license_revoked',
        message: 'License has been revoked',
        daysPastDue: 0,
        amountOwed: 0,
        subscriptionStatus: billingState.subscriptionStatus,
        adminBypassAvailable,
      }
    }

    if (license.status === 'expired') {
      return {
        shouldSuspend: true,
        reason: 'license_expired',
        message: 'License has expired',
        daysPastDue: 0,
        amountOwed: 0,
        subscriptionStatus: billingState.subscriptionStatus,
        adminBypassAvailable,
      }
    }
  }

  // Check subscription status
  switch (billingState.subscriptionStatus) {
    case 'canceled':
      return {
        shouldSuspend: true,
        reason: 'subscription_canceled',
        message: 'Subscription has been canceled',
        daysPastDue: 0,
        amountOwed: 0,
        subscriptionStatus: billingState.subscriptionStatus,
        adminBypassAvailable,
      }

    case 'expired':
      return {
        shouldSuspend: true,
        reason: 'subscription_expired',
        message: 'Subscription has expired',
        daysPastDue: 0,
        amountOwed: 0,
        subscriptionStatus: billingState.subscriptionStatus,
        adminBypassAvailable,
      }

    case 'past_due':
      // Check dunning status
      const dunningEvents = await dunningService.getActiveDunningEvents(orgId)
      const hasActiveDunning = dunningEvents.length > 0
      const daysPastDue = hasActiveDunning ? dunningEvents[0].daysSinceFailure : 0
      const amountOwed = hasActiveDunning ? dunningEvents[0].amountOwed : 0
      const dunningStage = hasActiveDunning ? dunningEvents[0].dunningStage : undefined

      // Check if dunning period exceeds suspension threshold
      if (hasActiveDunning && daysPastDue >= effectiveConfig.dunningSuspensionDays) {
        return {
          shouldSuspend: true,
          reason: 'dunning_active',
          message: `Payment overdue for ${daysPastDue} days`,
          daysPastDue,
          amountOwed,
          subscriptionStatus: billingState.subscriptionStatus,
          dunningStage,
          adminBypassAvailable,
        }
      }

      // Check grace period
      if (billingState.currentPeriodEnd) {
        const periodEnd = new Date(billingState.currentPeriodEnd).getTime()
        const now = Date.now()
        const graceMs = effectiveConfig.gracePeriodHours * 60 * 60 * 1000
        const graceRemaining = Math.max(0, graceMs - (now - periodEnd)) / (60 * 60 * 1000)

        if (graceRemaining <= 0) {
          return {
            shouldSuspend: true,
            reason: 'grace_period_expired',
            message: 'Grace period expired',
            daysPastDue,
            amountOwed,
            subscriptionStatus: billingState.subscriptionStatus,
            dunningStage,
            adminBypassAvailable,
          }
        }

        // Still in grace period - allow but return warning
        return {
          shouldSuspend: false,
          reason: null,
          message: 'Payment past due - grace period active',
          daysPastDue,
          amountOwed,
          subscriptionStatus: billingState.subscriptionStatus,
          dunningStage,
          gracePeriodRemainingHours: graceRemaining,
          adminBypassAvailable,
        }
      }

      // Past due without grace period info
      return {
        shouldSuspend: hasActiveDunning,
        reason: hasActiveDunning ? 'payment_past_due' : null,
        message: hasActiveDunning ? 'Payment overdue' : 'Payment past due',
        daysPastDue,
        amountOwed,
        subscriptionStatus: billingState.subscriptionStatus,
        dunningStage,
        adminBypassAvailable,
      }

    case 'unpaid':
      return {
        shouldSuspend: true,
        reason: 'non_payment',
        message: 'Payment not received',
        daysPastDue: 0,
        amountOwed: 0,
        subscriptionStatus: billingState.subscriptionStatus,
        adminBypassAvailable,
      }

    case 'active':
    case 'trialing':
    case 'incomplete':
    case 'none':
    default:
      // Allow active, trialing, incomplete, or no subscription
      return {
        shouldSuspend: false,
        reason: null,
        message: 'Subscription active',
        daysPastDue: 0,
        amountOwed: 0,
        subscriptionStatus: billingState.subscriptionStatus,
        adminBypassAvailable,
      }
  }
}

/**
 * Build suspension metadata for response
 */
export function buildSuspensionMetadata(status: SuspensionStatus): Record<string, unknown> {
  return {
    reason: status.reason,
    message: status.message,
    daysPastDue: status.daysPastDue,
    amountOwed: status.amountOwed,
    subscriptionStatus: status.subscriptionStatus,
    dunningStage: status.dunningStage,
    gracePeriodRemainingHours: status.gracePeriodRemainingHours,
    adminBypassAvailable: status.adminBypassAvailable,
  }
}

/**
 * Log suspension event for audit trail AND emit analytics event
 */
export async function logSuspensionEvent(
  orgId: string,
  userId: string | null,
  status: SuspensionStatus,
  path?: string
): Promise<{ success: boolean; eventId?: string }> {
  try {
    // Log to suspension_events table (audit trail)
    const { data, error } = await supabase
      .from('suspension_events')
      .insert({
        org_id: orgId,
        user_id: userId,
        reason: status.reason,
        message: status.message,
        metadata: buildSuspensionMetadata(status),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[SuspensionLogic] Error logging suspension event:', error)
    }

    // Emit analytics event (non-blocking, best-effort)
    if (status.shouldSuspend) {
      raasAnalyticsEvents
        .emitSuspensionCreated({
          org_id: orgId,
          user_id: userId || undefined,
          reason: status.reason || 'unknown',
          subscription_status: status.subscriptionStatus,
          days_past_due: status.daysPastDue,
          amount_owed: status.amountOwed,
          dunning_stage: status.dunningStage,
          grace_period_hours: status.gracePeriodRemainingHours,
          path,
        })
        .catch((err) => {
          console.error('[SuspensionLogic] Analytics emission failed:', err)
        })
    }

    if (error) {
      return { success: false }
    }

    return { success: true, eventId: data.id }
  } catch (err) {
    console.error('[SuspensionLogic] Error:', err)
    return { success: false }
  }
}

/**
 * Suspension Logic Service
 */
export const suspensionLogic = {
  checkSuspensionStatus,
  getBillingState,
  getSuspensionConfig,
  buildSuspensionMetadata,
  logSuspensionEvent,
}

export default suspensionLogic
