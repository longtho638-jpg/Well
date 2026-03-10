/**
 * Usage Reconciliation Service - Helper Functions
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { analyticsLogger } from '@/utils/logger'
import type { AutoHealParams, AlertParams, LogParams } from './usage-reconciliation-types'

export async function fetchGatewayUsage(
  supabase: SupabaseClient,
  orgId: string,
  period: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('usage_records')
      .select('quantity')
      .eq('org_id', orgId)
      .gte('recorded_at', `${period}T00:00:00Z`)
      .lt('recorded_at', `${period}T23:59:59Z`)

    if (error) {
      analyticsLogger.error(`[Reconciliation] Gateway fetch error:`, error)
      return 0
    }

    return data?.reduce((sum, record) => sum + record.quantity, 0) || 0
  } catch (error) {
    analyticsLogger.error(`[Reconciliation] Gateway fetch error:`, error)
    return 0
  }
}

export async function fetchStripeUsage(
  supabase: SupabaseClient,
  orgId: string,
  period: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('stripe_usage_reconciliation')
      .select('quantity')
      .eq('org_id', orgId)
      .eq('period', period)

    if (error) {
      analyticsLogger.error(`[Reconciliation] Stripe fetch error:`, error)
      return 0
    }

    return data?.reduce((sum, record) => sum + record.quantity, 0) || 0
  } catch (error) {
    analyticsLogger.error(`[Reconciliation] Stripe fetch error:`, error)
    return 0
  }
}

export async function fetchPolarUsage(
  supabase: SupabaseClient,
  orgId: string,
  period: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('polar_usage_records')
      .select('quantity')
      .eq('org_id', orgId)
      .eq('period', period)

    if (error) {
      analyticsLogger.error(`[Reconciliation] Polar fetch error:`, error)
      return 0
    }

    return data?.reduce((sum, record) => sum + record.quantity, 0) || 0
  } catch (error) {
    analyticsLogger.error(`[Reconciliation] Polar fetch error:`, error)
    return 0
  }
}

export async function autoHealDiscrepancy(
  supabase: SupabaseClient,
  params: AutoHealParams
): Promise<void> {
  const { orgId, period, gatewayUsage, billingUsage } = params

  const authoritativeSource = billingUsage < gatewayUsage ? 'gateway' : 'billing'

  analyticsLogger.info(`[Reconciliation] Auto-healing: trusting ${authoritativeSource} as source of truth`)

  await supabase
    .from('reconciliation_log')
    .insert({
      org_id: orgId,
      period,
      gateway_usage: gatewayUsage,
      billing_usage: billingUsage,
      authoritative_source: authoritativeSource,
      auto_healed: true,
      status: 'auto_healed',
    })
}

export async function sendReconciliationAlert(
  supabase: SupabaseClient,
  params: AlertParams
): Promise<void> {
  const { orgId, gatewayUsage, billingUsage, discrepancy } = params

  try {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('metadata, owner_id')
      .eq('id', orgId)
      .single()

    const adminEmail = orgData?.metadata?.admin_email

    if (adminEmail) {
      await supabase.functions.invoke('send-overage-alert', {
        body: {
          type: 'email',
          to: adminEmail,
          user_id: orgData?.owner_id,
          org_id: orgId,
          metric_type: 'reconciliation_discrepancy',
          threshold_percentage: Math.round(discrepancy * 100),
          current_usage: gatewayUsage,
          quota_limit: billingUsage,
          locale: 'en',
        },
      })
    }

    analyticsLogger.info(`[Reconciliation] Alert sent for org=${orgId}`)
  } catch (error) {
    analyticsLogger.error(`[Reconciliation] Alert send error:`, error)
  }
}

export async function logReconciliation(
  supabase: SupabaseClient,
  params: LogParams
): Promise<void> {
  try {
    await supabase
      .from('reconciliation_log')
      .insert({
        org_id: params.orgId,
        period: params.period,
        gateway_usage: params.gatewayUsage,
        stripe_usage: params.stripeUsage,
        polar_usage: params.polarUsage,
        discrepancy: params.discrepancy,
        auto_healed: params.autoHealed,
        alert_sent: params.alertSent,
        status: params.status,
      })
  } catch (_err) {
    // Silent fail for logging
  }
}

// Re-export advanced functions
export { getReconciliationHistory, getReconciliationStats } from './usage-reconciliation-advanced'
