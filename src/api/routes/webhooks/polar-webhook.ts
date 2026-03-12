/**
 * Polar.sh Webhook API Route Handler
 *
 * Real-time webhook handler for Polar.sh payment and subscription events.
 * Verifies webhook signatures and processes events using WebhookEventProcessor.
 *
 * Route: POST /api/webhooks/polar
 *
 * Headers:
 * - X-Polar-Signature: HMAC-SHA256 signature (sha256=<hex>)
 * - X-Polar-Timestamp: Unix timestamp
 * - Content-Type: application/json
 *
 * Response Codes:
 * - 200: Event processed successfully
 * - 400: Invalid signature, timestamp, or payload
 * - 500: Processing error
 *
 * Usage with Cloudflare Pages Functions:
 *   export const onRequest POST = polarWebhookHandler
 */

import { createClient } from '@supabase/supabase-js'
import { createLogger } from '@/utils/logger'
import { verifyWebhookSignature } from '@/lib/webhook-signature-verify'
import {
  WebhookEventProcessor,
  type PolarWebhookEvent,
} from '@/lib/webhook-event-processor'

const logger = createLogger('PolarWebhook')

/**
 * CORS headers for cross-origin webhook requests
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, X-Polar-Signature, X-Polar-Timestamp',
  'Access-Control-Max-Age': '86400',
}

/**
 * Get webhook secret from environment
 */
function getWebhookSecret(env?: Record<string, string>): string {
  const secret =
    typeof process !== 'undefined' && process.env
      ? process.env.POLAR_WEBHOOK_SECRET
      : env?.POLAR_WEBHOOK_SECRET

  if (!secret) {
    logger.error('POLAR_WEBHOOK_SECRET not configured')
    throw new Error('Webhook secret not configured')
  }

  return secret
}

/**
 * Create Supabase admin client for webhook processing
 */
function createSupabaseAdminClient(env?: Record<string, string>) {
  const supabaseUrl =
    typeof process !== 'undefined' && process.env
      ? process.env.SUPABASE_URL
      : env?.SUPABASE_URL
  const supabaseServiceKey =
    typeof process !== 'undefined' && process.env
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : env?.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Log webhook request metadata
 */
function logRequest(request: Request, eventType?: string): void {
  const headers = request.headers
  const clientIP =
    headers.get('CF-Connecting-IP') ||
    headers.get('X-Forwarded-For') ||
    'unknown'
  const userAgent = headers.get('User-Agent') || 'unknown'

  logger.info('Webhook request received', {
    method: request.method,
    path: new URL(request.url).pathname,
    ip: clientIP,
    userAgent,
    eventType: eventType || 'unknown',
    timestamp: new Date().toISOString(),
  })
}

/**
 * Create success response
 */
function successResponse(eventType: string): Response {
  return new Response(
    JSON.stringify({
      received: true,
      eventType,
      processed: true,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  )
}

/**
 * Create error response
 */
function errorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({
      error: 'webhook_error',
      message,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  )
}

/**
 * Parse and validate webhook payload
 */
function parseWebhookPayload(body: string): PolarWebhookEvent {
  try {
    const parsed = JSON.parse(body)

    if (!parsed.type || typeof parsed.type !== 'string') {
      throw new Error('Missing or invalid event type')
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      throw new Error('Missing or invalid event data')
    }

    return {
      type: parsed.type as PolarWebhookEvent['type'],
      data: parsed.data as Record<string, unknown>,
    }
  } catch (error) {
    logger.error('Invalid webhook payload', {
      error: error instanceof Error ? error.message : String(error),
      bodyPreview: body.slice(0, 100),
    })
    throw new Error('Invalid webhook payload')
  }
}

/**
 * Polar webhook handler for Cloudflare Pages Functions
 *
 * @param context - Cloudflare Pages function context
 * @returns Response
 */
export async function onRequest({
  request,
  env,
}: {
  request: Request
  env: Record<string, string>
}): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  logRequest(request)

  try {
    // Get secret from environment
    const secret = getWebhookSecret(env)

    // Verify signature
    const body = await request.text()
    const signature = request.headers.get('X-Polar-Signature')

    const verification = await verifyWebhookSignature(
      body,
      signature,
      secret,
      'polar'
    )

    if (!verification.isValid) {
      logger.warn('Signature verification failed', {
        reason: verification.reason,
      })
      return errorResponse(
        verification.reason ? `Signature verification failed: ${verification.reason}` : 'Signature verification failed',
        400
      )
    }

    // Parse payload
    const event = parseWebhookPayload(body)
    logRequest(request, event.type)

    // Create processor and process event
    const supabase = createSupabaseAdminClient(env)
    const processor = new WebhookEventProcessor(supabase)
    const result = await processor.processEvent(event)

    if (!result.success) {
      logger.error('Event processing failed', {
        eventType: event.type,
        error: result.error,
      })
      return errorResponse(result.error || 'Event processing failed', 500)
    }

    logger.info('Webhook processed successfully', {
      eventType: event.type,
      processedAt: result.processedAt,
    })

    return successResponse(event.type)
  } catch (error) {
    logger.error('Webhook handler error', {
      error: error instanceof Error ? error.message : String(error),
    })

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

/**
 * Handler for generic Request/Response usage
 */
export async function polarWebhookHandler(
  req: Request,
  env?: Record<string, string>
): Promise<Response> {
  return onRequest({ request: req, env: env || {} })
}

/**
 * Export handler and utilities
 */
export const polarWebhook = {
  onRequest,
  polarWebhookHandler,
  parseWebhookPayload,
  corsHeaders,
}

export default polarWebhook
