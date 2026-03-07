/**
 * Stripe Usage Reconciliation Script
 *
 * Compares usage records in Supabase vs Stripe Usage Records
 * to identify discrepancies for billing reconciliation.
 *
 * Usage:
 *   tsx src/scripts/reconcile-stripe-usage.ts --period 2026-03-07 --subscription-item si_xxx
 *
 * Output:
 *   Writes reconciliation report to plans/reports/stripe-reconciliation-{date}.md
 */

import type { UsageReconciliationResult } from '@/types/payments'

interface ReconciliationConfig {
  supabaseUrl: string
  supabaseServiceKey: string
  stripeSecretKey: string
  subscriptionItemId: string  // si_xxx
  periodStart: string  // YYYY-MM-DD
  periodEnd: string    // YYYY-MM-DD
}

export class StripeUsageReconciler {
  private config: ReconciliationConfig

  constructor(config: ReconciliationConfig) {
    this.config = config
  }

  /**
   * Fetch usage from Supabase for the period
   */
  private async fetchSupabaseUsage(): Promise<Map<string, number>> {
    // Note: In actual implementation, this would call Supabase REST API
    // For now, returning structure for demonstration
    console.warn('[Reconciler] Fetching Supabase usage...')

    // Simulated daily usage data
    const dailyUsage = new Map<string, number>()

    // TODO: Implement actual Supabase API call
    // const response = await fetch(`${this.config.supabaseUrl}/rest/v1/usage_records`, {
    //   headers: {
    //     'apikey': this.config.supabaseServiceKey,
    //     'Authorization': `Bearer ${this.config.supabaseServiceKey}`,
    //   },
    // })

    return dailyUsage
  }

  /**
   * Fetch usage records from Stripe for the period
   */
  private async fetchStripeUsage(): Promise<Map<string, number>> {
    console.warn('[Reconciler] Fetching Stripe usage...')

    const dailyUsage = new Map<string, number>()

    // TODO: Implement Stripe API call
    // Step 1: Get usage record summaries for subscription item
    // GET /v1/subscription_items/{subscription_item_id}/usage_record_summaries
    // const response = await fetch(
    //   `https://api.stripe.com/v1/subscription_items/${this.config.subscriptionItemId}/usage_record_summaries`,
    //   {
    //     headers: {
    //       'Authorization': `Bearer ${this.config.stripeSecretKey}`,
    //     },
    //   }
    // )

    return dailyUsage
  }

  /**
   * Compare Supabase vs Stripe usage
   */
  private compareUsage(
    supabaseUsage: Map<string, number>,
    stripeUsage: Map<string, number>
  ): UsageReconciliationResult {
    const allDates = new Set([...supabaseUsage.keys(), ...stripeUsage.keys()])
    const discrepancies: UsageReconciliationResult['discrepancies'] = []

    let supabaseTotal = 0
    let stripeTotal = 0

    for (const date of allDates) {
      const sbUsage = supabaseUsage.get(date) || 0
      const stripeUsg = stripeUsage.get(date) || 0

      supabaseTotal += sbUsage
      stripeTotal += stripeUsg

      const difference = Math.abs(sbUsage - stripeUsg)
      if (difference > 0) {
        discrepancies.push({
          date,
          supabase_usage: sbUsage,
          stripe_usage: stripeUsg,
          difference,
        })
      }
    }

    const difference = supabaseTotal - stripeTotal
    const differencePercent = stripeTotal > 0
      ? Math.round((difference / stripeTotal) * 100)
      : 0

    return {
      period: {
        start: this.config.periodStart,
        end: this.config.periodEnd,
      },
      supabase_total: supabaseTotal,
      stripe_total: stripeTotal,
      difference,
      difference_percent: differencePercent,
      status: discrepancies.length === 0 ? 'matched' : 'discrepancy',
      discrepancies,
      recommendations: this.generateRecommendations(difference, discrepancies),
    }
  }

  /**
   * Generate recommendations based on reconciliation results
   */
  private generateRecommendations(
    difference: number,
    discrepancies: UsageReconciliationResult['discrepancies']
  ): string[] {
    const recommendations: string[] = []

    if (discrepancies.length === 0) {
      recommendations.push('✅ Usage records match perfectly - no action needed')
      return recommendations
    }

    if (difference > 0) {
      recommendations.push(
        `⚠️ Supabase has ${difference} more records than Stripe`,
        '→ Check if all usage records were successfully reported to Stripe',
        '→ Review failed API calls in stripe-usage-record edge function logs'
      )
    } else if (difference < 0) {
      recommendations.push(
        `⚠️ Stripe has ${Math.abs(difference)} more records than Supabase`,
        '→ Check for duplicate reporting or manual adjustments in Stripe',
        '→ Review idempotency keys to prevent duplicate submissions'
      )
    }

    if (discrepancies.length > 5) {
      recommendations.push(
        '🔍 Multiple discrepancies detected - consider running daily reconciliation',
        '→ Set up automated alerts for >5% variance'
      )
    }

    return recommendations
  }

  /**
   * Run full reconciliation process
   */
  async reconcile(): Promise<UsageReconciliationResult> {
    console.warn('[Reconciler] Starting reconciliation...')
    console.warn(`[Reconciler] Period: ${this.config.periodStart} to ${this.config.periodEnd}`)
    console.warn(`[Reconciler] Subscription Item: ${this.config.subscriptionItemId}`)

    // Fetch from both sources
    const [supabaseUsage, stripeUsage] = await Promise.all([
      this.fetchSupabaseUsage(),
      this.fetchStripeUsage(),
    ])

    // Compare and generate report
    const result = this.compareUsage(supabaseUsage, stripeUsage)

    console.warn('[Reconciler] Results:', {
      status: result.status,
      supabase_total: result.supabase_total,
      stripe_total: result.stripe_total,
      difference: result.difference,
      discrepancies_count: result.discrepancies.length,
    })

    return result
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2)

  // Parse CLI arguments
  const periodIndex = args.indexOf('--period')
  const subItemIndex = args.indexOf('--subscription-item')

  if (periodIndex === -1 || subItemIndex === -1) {
    console.error('Usage: tsx reconcile-stripe-usage.ts --period YYYY-MM-DD --subscription-item si_xxx')
    process.exit(1)
  }

  const period = args[periodIndex + 1]
  const subscriptionItemId = args[subItemIndex + 1]

  if (!period || !subscriptionItemId) {
    console.error('Invalid arguments')
    process.exit(1)
  }

  // Validate environment variables
  const config: ReconciliationConfig = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    subscriptionItemId: subscriptionItemId,
    periodStart: `${period}T00:00:00Z`,
    periodEnd: `${period}T23:59:59Z`,
  }

  if (!config.supabaseUrl || !config.supabaseServiceKey || !config.stripeSecretKey) {
    console.error('Missing required environment variables:')
    console.error('  - SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    console.error('  - STRIPE_SECRET_KEY')
    process.exit(1)
  }

  // Run reconciliation
  const reconciler = new StripeUsageReconciler(config)
  const result = await reconciler.reconcile()

  // Output results
  console.log('\n## Reconciliation Report')
  console.log(`Period: ${result.period.start} to ${result.period.end}`)
  console.log(`Status: ${result.status.toUpperCase()}`)
  console.log(`Supabase Total: ${result.supabase_total.toLocaleString()}`)
  console.log(`Stripe Total: ${result.stripe_total.toLocaleString()}`)
  console.log(`Difference: ${result.difference.toLocaleString()} (${result.difference_percent}%)`)

  if (result.discrepancies.length > 0) {
    console.log('\n## Discrepancies')
    result.discrepancies.forEach(d => {
      console.log(`  ${d.date}: Supabase=${d.supabase_usage}, Stripe=${d.stripe_usage}, Diff=${d.difference}`)
    })
  }

  console.log('\n## Recommendations')
  result.recommendations.forEach(r => console.log(`  ${r}`))

  // TODO: Write report to file
  // const reportPath = `plans/reports/stripe-reconciliation-${period}.md`
  // await writeReconciliationReport(result, reportPath)
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error)
}

export default StripeUsageReconciler
