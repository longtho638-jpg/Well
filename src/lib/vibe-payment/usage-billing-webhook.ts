/**
 * Usage Billing Webhook Handler
 *
 * Sends usage summary to Polar.sh (or other billing providers) for usage-based billing.
 * Triggered monthly or on-demand via admin dashboard.
 *
 * Usage:
 *   import { sendUsageToBilling } from '@/lib/vibe-payment/usage-billing-webhook';
 *
 *   await sendUsageToBilling({
 *     orgId: 'org_123',
 *     licenseId: 'lic_456',
 *     periodStart: '2026-03-01T00:00:00Z',
 *     periodEnd: '2026-03-31T23:59:59Z',
 *   });
 */

import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { analyticsLogger } from '@/utils/logger'

interface UsageBillingPayload {
  orgId: string
  licenseId: string
  periodStart: string
  periodEnd: string
  metrics: {
    api_calls: number
    tokens: number
    compute_ms: number
    storage_mb: number
    bandwidth_mb: number
  }
  tier: string
  overage: {
    api_calls: number
    tokens: number
    compute_minutes: number
  }
  calculated_cost: number
}

interface SendUsageOptions {
  orgId: string
  licenseId: string
  periodStart: string
  periodEnd: string
}

/**
 * Send usage data to Polar.sh billing
 */
export async function sendUsageToBilling(options: SendUsageOptions): Promise<{
  success: boolean
  usageId?: string
  error?: string
}> {
  const { orgId, licenseId, periodStart, periodEnd } = options

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Fetch usage summary from Edge Function
    const webhookSecret = process.env.USAGE_WEBHOOK_SECRET || ''
    const body = JSON.stringify({ org_id: orgId, license_id: licenseId, period_start: periodStart, period_end: periodEnd })
    const timestamp = new Date().toISOString()
    const signature = createHmac('sha256', webhookSecret)
      .update(body)
      .update(timestamp)
      .digest('hex')

    const response = await fetch(`${supabaseUrl}/functions/v1/usage-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'x-signature': signature,
        'x-timestamp': timestamp,
      },
      body,
    })

    if (!response.ok) {
      throw new Error(`Usage summary API returned ${response.status}`)
    }

    const summary: UsageBillingPayload = await response.json()

    // Send to Polar.sh
    const polarApiKey = process.env.POLAR_API_KEY || ''
    const polarResponse = await fetch('https://api.polar.sh/v1/billing/usage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${polarApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organization_id: orgId,
        subscription_id: licenseId,
        billing_period: {
          start: periodStart,
          end: periodEnd,
        },
        usage: {
          api_calls: summary.overage.api_calls,
          tokens: summary.overage.tokens,
          compute_minutes: summary.overage.compute_minutes,
        },
        calculated_cost: summary.calculated_cost,
        metadata: {
          tier: summary.tier,
          total_api_calls: summary.metrics.api_calls,
          total_tokens: summary.metrics.tokens,
          total_compute_ms: summary.metrics.compute_ms,
        },
      }),
    })

    if (!polarResponse.ok) {
      const errorData = await polarResponse.json()
      analyticsLogger.error('[USAGE-BILLING] Polar.sh error:', errorData)
      throw new Error(`Polar.sh returned ${polarResponse.status}`)
    }

    const polarResult = await polarResponse.json()

    // Log the billing sync
    await supabase.from('usage_billing_sync_log').insert({
      org_id: orgId,
      license_id: licenseId,
      period_start: periodStart,
      period_end: periodEnd,
      status: 'success',
      polar_usage_id: polarResult.id,
      calculated_cost: summary.calculated_cost,
      synced_at: new Date().toISOString(),
    })

    return {
      success: true,
      usageId: polarResult.id,
    }

  } catch (error) {
    analyticsLogger.error('[USAGE-BILLING] Error:', error)

    // Log the failure
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

      await supabase.from('usage_billing_sync_log').insert({
        org_id: orgId,
        license_id: licenseId,
        period_start: periodStart,
        period_end: periodEnd,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        synced_at: new Date().toISOString(),
      })
    } catch (logError) {
      analyticsLogger.error('[USAGE-BILLING] Failed to log error:', logError)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Cron job handler for monthly billing sync
 * Run on the 1st of every month at 00:00 UTC
 */
export async function monthlyBillingSync(): Promise<{
  success: number
  failed: number
  total: number
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  // Get all active licenses
  const { data: licenses } = await supabase
    .from('raas_licenses')
    .select('id, org_id')
    .eq('status', 'active')

  if (!licenses) {
    return { success: 0, failed: 0, total: 0 }
  }

  // Calculate previous month period
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const periodStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString()
  const periodEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59).toISOString()

  let success = 0
  let failed = 0

  for (const license of licenses) {
    const result = await sendUsageToBilling({
      orgId: license.org_id,
      licenseId: license.id,
      periodStart,
      periodEnd,
    })

    if (result.success) {
      success++
    } else {
      failed++
    }
  }

  return {
    success,
    failed,
    total: licenses.length,
  }
}

export default sendUsageToBilling
