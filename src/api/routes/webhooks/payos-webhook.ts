/**
 * PayOS Webhook API Route Handler
 *
 * Real-time webhook handler for PayOS payment events.
 * Verifies HMAC-SHA256 signatures and processes payment events.
 *
 * Route: POST /api/webhooks/payos
 *
 * Headers:
 * - X-PayOS-Signature: HMAC-SHA256 signature (raw hex)
 * - Content-Type: application/json
 *
 * Event Codes:
 * - '00': Payment successful
 * - '01': Payment cancelled
 *
 * Response Codes:
 * - 200: Event processed successfully (or already processed - idempotent)
 * - 400: Invalid signature or payload
 * - 401: Signature verification failed
 * - 500: Processing error
 *
 * Usage with Cloudflare Pages Functions:
 *   export const onRequest POST = payosWebhook.onRequest
 */

import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/utils/logger';
import { verifyWebhookSignature } from '@/lib/webhook-signature-verify';
 
import { computeHmacSha256, secureCompare } from '@/lib/vibe-payment/payos-adapter'; // eslint-disable-line @typescript-eslint/no-unused-vars

const logger = createLogger('PayOSWebhook');

/**
 * CORS headers for cross-origin webhook requests
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-PayOS-Signature',
  'Access-Control-Max-Age': '86400',
};

/**
 * Get PayOS webhook checksum key from environment
 */
function getPayOSChecksumKey(env?: Record<string, string>): string {
  const key =
    typeof process !== 'undefined' && process.env
      ? process.env.PAYOS_CHECKSUM_KEY
      : env?.PAYOS_CHECKSUM_KEY;

  if (!key) {
    logger.error('PAYOS_CHECKSUM_KEY not configured');
    throw new Error('PayOS checksum key not configured');
  }

  return key;
}

/**
 * Create Supabase admin client for webhook processing
 */
function createSupabaseAdminClient(env?: Record<string, string>) {
  const supabaseUrl =
    typeof process !== 'undefined' && process.env
      ? process.env.SUPABASE_URL
      : env?.SUPABASE_URL;
  const supabaseServiceKey =
    typeof process !== 'undefined' && process.env
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : env?.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Log webhook request metadata
 */
function logRequest(request: Request, eventCode?: string): void {
  const headers = request.headers;
  const clientIP =
    headers.get('CF-Connecting-IP') ||
    headers.get('X-Forwarded-For') ||
    'unknown';
  const userAgent = headers.get('User-Agent') || 'unknown';

  logger.info('PayOS webhook request received', {
    method: request.method,
    path: new URL(request.url).pathname,
    ip: clientIP,
    userAgent,
    eventCode: eventCode || 'unknown',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create success response
 */
function successResponse(eventCode: string, idempotent = false): Response {
  return new Response(
    JSON.stringify({
      received: true,
      eventCode,
      processed: true,
      idempotent,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
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
  );
}

/**
 * Parse and validate PayOS webhook payload
 */
function parseWebhookPayload(body: string): PayOSWebhookEvent {
  try {
    const parsed = JSON.parse(body);

    // PayOS webhook structure: { data: {...}, signature: "..." }
    if (!parsed.data || typeof parsed.data !== 'object') {
      throw new Error('Missing or invalid data object');
    }

    const data = parsed.data as PayOSRawData;

    // Validate required fields
    if (!data.orderCode || !data.code) {
      throw new Error('Missing required fields: orderCode or code');
    }

    return {
      type: data.code === '00' ? 'payment.paid' : data.code === '01' ? 'payment.cancelled' : 'payment.pending',
      eventCode: data.code,
      orderCode: Number(data.orderCode),
      amount: Number(data.amount) || 0,
      description: data.description || '',
      reference: data.reference || '',
      transactionDateTime: data.transactionDateTime || new Date().toISOString(),
      currency: data.currency || 'VND',
      paymentLinkId: data.paymentLinkId || '',
      raw: data,
    };
  } catch (error) {
    logger.error('Invalid webhook payload', {
      error: error instanceof Error ? error.message : String(error),
      bodyPreview: body.slice(0, 100),
    });
    throw new Error('Invalid webhook payload');
  }
}

/**
 * PayOS webhook event structure
 */
interface PayOSWebhookEvent {
  type: 'payment.paid' | 'payment.cancelled' | 'payment.pending';
  eventCode: string;
  orderCode: number;
  amount: number;
  description: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  raw: PayOSRawData;
}

/**
 * PayOS raw webhook data structure
 */
interface PayOSRawData {
  orderCode: number | string;
  amount: number | string;
  description: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
}

/**
 * Check if webhook event was already processed (idempotency guard)
 */
async function checkIdempotency(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  orderCode: number,
  eventCode: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('payos_webhook_events')
      .select('id')
      .eq('order_code', orderCode)
      .eq('event_code', eventCode)
      .eq('processed', true)
      .maybeSingle();

    return !!data;
  } catch (error) {
    logger.error('Idempotency check failed', { error });
    return false;
  }
}

/**
 * Store webhook event to database for audit and analytics
 */
async function storeWebhookEvent(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  event: PayOSWebhookEvent
): Promise<void> {
  try {
    await supabase.from('payos_webhook_events').insert({
      event_id: crypto.randomUUID(),
      order_code: event.orderCode,
      event_code: event.eventCode,
      amount: event.amount,
      currency: event.currency,
      description: event.description,
      reference: event.reference,
      payment_link_id: event.paymentLinkId,
      transaction_datetime: event.transactionDateTime,
      payload: event.raw,
      processed: true,
      processed_at: new Date().toISOString(),
      received_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to store webhook event', { error });
  }
}

/**
 * Log webhook event to agent_logs for audit trail
 */
async function logToAgentLogs(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  event: PayOSWebhookEvent
): Promise<void> {
  try {
    await supabase.from('agent_logs').insert({
      user_id: 'system',
      agent_name: 'PayOSWebhook',
      action: `payment_${event.eventCode === '00' ? 'success' : event.eventCode === '01' ? 'cancel' : 'pending'}`,
      details: {
        orderCode: event.orderCode,
        amount: event.amount,
        currency: event.currency,
        eventCode: event.eventCode,
        reference: event.reference,
      },
    });
  } catch (error) {
    logger.error('Failed to log to agent_logs', { error });
  }
}

/**
 * Handle payment success event (code '00')
 */
async function handlePaymentSuccess(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  event: PayOSWebhookEvent
): Promise<void> {
  logger.info('Processing payment success', { orderCode: event.orderCode });

  // Update order status in database
  try {
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('reference', event.reference);
  } catch (error) {
    logger.error('Failed to update transaction', { error });
  }

  // Log to agent_logs
  await logToAgentLogs(supabase, event);
}

/**
 * Handle payment cancel event (code '01')
 */
async function handlePaymentCancel(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  event: PayOSWebhookEvent
): Promise<void> {
  logger.info('Processing payment cancel', { orderCode: event.orderCode });

  // Update order status in database
  try {
    await supabase
      .from('transactions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('reference', event.reference);
  } catch (error) {
    logger.error('Failed to update transaction', { error });
  }

  // Log to agent_logs
  await logToAgentLogs(supabase, event);
}

/**
 * PayOS webhook handler for Cloudflare Pages Functions
 *
 * @param context - Cloudflare Pages function context with request and env
 * @returns Response
 */
export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: Record<string, string>;
}): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  logRequest(request);

  try {
    // Get checksum key from environment
    const checksumKey = getPayOSChecksumKey(env);

    // Read raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('X-PayOS-Signature');

    // Verify HMAC-SHA256 signature using PayOS format
    // PayOS signature is raw hex (no prefix like sha256=)
    const verification = await verifyWebhookSignature(body, signature, checksumKey, 'payos');

    if (!verification.isValid) {
      logger.warn('Signature verification failed', {
        reason: verification.reason,
      });
      return errorResponse(
        `Signature verification failed: ${verification.reason || 'invalid_signature'}`,
        401
      );
    }

    // Parse webhook payload
    const event = parseWebhookPayload(body);
    logRequest(request, event.eventCode);

    // Create Supabase client
    const supabase = createSupabaseAdminClient(env);

    // Check idempotency (prevent replay attacks)
    const isProcessed = await checkIdempotency(supabase, event.orderCode, event.eventCode);
    if (isProcessed) {
      logger.info('Event already processed (idempotent)', {
        orderCode: event.orderCode,
        eventCode: event.eventCode,
      });
      return successResponse(event.eventCode, true);
    }

    // Store event to database
    await storeWebhookEvent(supabase, event);

    // Route to event handler
    if (event.eventCode === '00') {
      await handlePaymentSuccess(supabase, event);
    } else if (event.eventCode === '01') {
      await handlePaymentCancel(supabase, event);
    } else {
      logger.warn('Unhandled event code', { eventCode: event.eventCode });
    }

    logger.info('PayOS webhook processed successfully', {
      orderCode: event.orderCode,
      eventCode: event.eventCode,
      amount: event.amount,
      currency: event.currency,
    });

    return successResponse(event.eventCode, false);
  } catch (error) {
    logger.error('PayOS webhook handler error', {
      error: error instanceof Error ? error.message : String(error),
    });

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

/**
 * Handler for generic Request/Response usage
 */
export async function payosWebhookHandler(
  req: Request,
  env?: Record<string, string>
): Promise<Response> {
  return onRequest({ request: req, env: env || {} });
}

/**
 * Export handler and utilities
 */
export const payosWebhook = {
  onRequest,
  payosWebhookHandler,
  parseWebhookPayload,
  checkIdempotency,
  corsHeaders,
};

export default payosWebhook;
