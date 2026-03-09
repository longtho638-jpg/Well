/**
 * ROI Analytics Worker - Cloudflare Worker v1.0.0
 *
 * Daily automated ROI analytics aggregation from Stripe/Polar billing data.
 * Runs at midnight UTC via cron trigger.
 *
 * Features:
 * - Aggregate Stripe subscription + usage data
 * - Aggregate Polar checkout + overage data
 * - Calculate ROI metrics per customer
 * - Push digest to AgencyOS dashboard via secure webhook
 * - Audit logs to R2 bucket
 */

import type { Env } from './env'
import { aggregateStripeData } from './stripe-client'
import { aggregatePolarData } from './polar-client'
import { calculateROI, typeROIDigest } from './roi-calculator'
import { deliverWebhook } from './webhook-client'

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.warn('[ROI Worker] Starting daily ROI aggregation...')

    try {
      // Step 1: Fetch data from billing providers
      const [stripeData, polarData] = await Promise.all([
        aggregateStripeData(env),
        aggregatePolarData(env),
      ])

      console.warn('[ROI Worker] Fetched billing data:', {
        stripe: stripeData.orgs.length,
        polar: polarData.orgs.length,
      })

      // Step 2: Merge and calculate ROI per org
      const allOrgs = new Set([...stripeData.orgs, ...polarData.orgs])
      const digests: typeROIDigest[] = []

      for (const orgId of allOrgs) {
        const digest = calculateROI({
          orgId,
          stripeData,
          polarData,
          date: new Date().toISOString(),
        })
        digests.push(digest)
      }

      console.warn('[ROI Worker] Calculated ROI for', digests.length, 'organizations')

      // Step 3: Deliver to AgencyOS dashboard
      const deliveryResult = await deliverWebhook(env, digests)

      // Step 4: Log to R2 audit bucket
      await logToR2(env, {
        timestamp: new Date().toISOString(),
        digestCount: digests.length,
        deliveryStatus: deliveryResult.success ? 'success' : 'failed',
        error: deliveryResult.error,
      })

      console.warn('[ROI Worker] Daily aggregation complete')
    } catch (error) {
      console.error('[ROI Worker] Fatal error:', error)
      throw error
    }
  },

  // Manual trigger via HTTP for testing
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'POST' && new URL(request.url).pathname === '/trigger') {
      try {
        await this.scheduled({} as ScheduledEvent, env, {} as ExecutionContext)
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response('ROI Analytics Worker', { status: 200 })
  },
}

async function logToR2(
  env: Env,
  data: {
    timestamp: string
    digestCount: number
    deliveryStatus: string
    error?: string
  }
): Promise<void> {
  const key = `audit/${new Date().toISOString().split('T')[0]}/${Date.now()}.json`
  await env.ROI_AUDIT_LOGS.put(key, JSON.stringify(data), {
    httpMetadata: { contentType: 'application/json' },
  })
}
