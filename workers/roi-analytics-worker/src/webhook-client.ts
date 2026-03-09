/**
 * Webhook Client - Deliver ROI digest to AgencyOS dashboard
 *
 * Uses JWT + mk_api_key authentication for secure delivery.
 */

import * as jose from 'jose'
import type { Env, typeROIDigest } from './env'

interface WebhookResult {
  success: boolean
  error?: string
}

export async function deliverWebhook(
  env: Env,
  digests: typeROIDigest[]
): Promise<WebhookResult> {
  try {
    // Build payload
    const payload = {
      digests,
      timestamp: new Date().toISOString(),
      version: env.ROI_CALCULATION_VERSION,
    }

    // Sign JWT
    const secret = new TextEncoder().encode(env.JWT_SECRET)
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)

    // Deliver webhook
    const response = await fetch(env.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
        'X-API-Key': env.ADMIN_API_KEY,
        'X-Webhook-Source': 'roi-analytics-worker',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.status}`)
    }

    return { success: true }
  } catch (error) {
    console.error('[Webhook] Delivery error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
