/**
 * SMS Service - Send SMS via Twilio
 * Supabase Edge Function
 *
 * POST /functions/v1/send-sms
 * Headers:
 *   Authorization: Bearer <token> (optional for authenticated users)
 *   x-service-key: <key> (for service-to-service calls)
 *   Content-Type: application/json
 *
 * Body:
 * {
 *   to: "+84123456789",
 *   message?: string,
 *   template?: string,
 *   templateData?: Record<string, string>,
 *   locale?: 'vi' | 'en',
 *   orgId?: string,
 *   userId?: string,
 *   dunningEventId?: string,
 *   idempotencyKey?: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   smsId: string,
 *   providerSid: string,
 *   status: 'sent' | 'failed',
 *   segments: number,
 *   price: number
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Twilio API configuration
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')
const TWILIO_API = 'https://api.twilio.com/2010-04-01/Accounts'

// Rate limit configuration (unused - using DB rate limits instead)
// const SMS_RATE_LIMIT_HOURLY = 10
// const SMS_RATE_LIMIT_DAILY = 50

interface SmsRequest {
  to: string
  message?: string
  template?: string
  templateData?: Record<string, string>
  locale?: 'vi' | 'en'
  orgId?: string
  userId?: string
  dunningEventId?: string
  idempotencyKey?: string
}

interface TwilioResponse {
  sid: string
  status: string
  from: string
  to: string
  body: string
  num_segments?: string
  price?: string
  error_code?: string
  error_message?: string
}

serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const internalServiceKey = Deno.env.get('INTERNAL_SERVICE_KEY') ?? ''

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Require POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Auth check: Service key OR authenticated user
    const requestAuthHeader = req.headers.get('Authorization')
    const serviceKey = req.headers.get('x-service-key')

    const hasValidServiceKey = internalServiceKey && serviceKey === internalServiceKey

    let isAuthenticatedUser = false
    let currentUserId: string | undefined
    if (!hasValidServiceKey && requestAuthHeader?.startsWith('Bearer ')) {
      const token = requestAuthHeader.substring(7)
      const { data: { user }, error } = await supabase.auth.getUser(token)
      isAuthenticatedUser = !!user && !error
      if (isAuthenticatedUser) {
        currentUserId = user.id
      }
    }

    if (!hasValidServiceKey && !isAuthenticatedUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const body: SmsRequest = await req.json()

    // Validate required fields
    if (!body.to) {
      return new Response(JSON.stringify({ error: 'Missing required field: to' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate phone number format (E.164)
    if (!body.to.startsWith('+')) {
      return new Response(JSON.stringify({ error: 'Phone number must be in E.164 format (e.g., +84123456789)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get or generate idempotency key
    const idempotencyKey = body.idempotencyKey || `sms:${body.orgId}:${body.to}:${Date.now()}`

    // Check for duplicate request (idempotency)
    const { data: existingSms } = await supabase
      .from('sms_logs')
      .select('id, status, provider_sid')
      .eq('idempotency_key', idempotencyKey)
      .single()

    if (existingSms) {
      console.warn('[SendSMS] Duplicate request, returning existing:', existingSms.id)
      return new Response(JSON.stringify({
        success: true,
        smsId: existingSms.id,
        providerSid: existingSms.provider_sid,
        status: existingSms.status,
        idempotent: true,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check rate limit
    const { data: rateLimitData } = await supabase.rpc('check_sms_rate_limit', {
      p_org_id: body.orgId,
      p_user_id: body.userId || currentUserId,
      p_phone_number: body.to,
      p_window_type: 'hourly',
    })

    if (rateLimitData && !rateLimitData.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        currentCount: rateLimitData.current_count,
        maxAllowed: rateLimitData.max_allowed,
        resetAt: rateLimitData.reset_at,
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': rateLimitData.reset_at,
        },
      })
    }

    // Get message content (from template or direct message)
    let messageBody = body.message
    if (!messageBody && body.template) {
      const { data: template } = await supabase.rpc('get_sms_template', {
        p_template_key: body.template,
        p_locale: body.locale || 'vi',
      })

      if (!template) {
        return new Response(JSON.stringify({ error: `Template not found: ${body.template}` }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Replace template variables
      messageBody = template.message_template
      if (body.templateData) {
        for (const [key, value] of Object.entries(body.templateData)) {
          messageBody = messageBody.replace(new RegExp(`{{${key}}}`, 'g'), value)
        }
      }
    }

    if (!messageBody) {
      return new Response(JSON.stringify({ error: 'Missing message content: provide either message or template' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Calculate SMS segments (160 chars per segment for GSM-7)
    const segments = Math.ceil(messageBody.length / 160)

    // Log SMS send attempt (creates sms_logs entry + updates rate limit)
    const { data: smsLogData, error: logError } = await supabase.rpc('log_sms_send', {
      p_to_number: body.to,
      p_message_body: messageBody,
      p_message_template: body.template || null,
      p_locale: body.locale || 'vi',
      p_org_id: body.orgId,
      p_user_id: body.userId || currentUserId,
      p_dunning_event_id: body.dunningEventId || null,
      p_idempotency_key: idempotencyKey,
    })

    if (logError) {
      console.error('[SendSMS] Failed to log SMS:', logError)
      throw logError
    }

    const smsId = smsLogData

    // Send SMS via Twilio API
    const twilioUrl = `${TWILIO_API}/${TWILIO_ACCOUNT_SID}/Messages.json`
    const authHeader = `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`

    const formData = new URLSearchParams()
    formData.append('To', body.to)
    formData.append('From', TWILIO_PHONE_NUMBER || '+1234567890')
    formData.append('Body', messageBody)

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    const twilioData: TwilioResponse = await twilioResponse.json()

    if (twilioData.error_code) {
      console.error('[SendSMS] Twilio API error:', twilioData.error_code, twilioData.error_message)

      // Update SMS log with error
      await supabase.rpc('update_sms_status', {
        p_sms_id: smsId,
        p_status: 'failed',
        p_provider_sid: twilioData.sid,
        p_provider_status: twilioData.status,
        p_error_code: twilioData.error_code,
        p_error_message: twilioData.error_message,
      })

      return new Response(JSON.stringify({
        error: 'Failed to send SMS',
        errorCode: twilioData.error_code,
        errorMessage: twilioData.error_message,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update SMS log with success
    const price = twilioData.price ? parseFloat(twilioData.price) : undefined
    await supabase.rpc('update_sms_status', {
      p_sms_id: smsId,
      p_status: 'sent',
      p_provider_sid: twilioData.sid,
      p_provider_status: twilioData.status,
      p_segments: twilioData.num_segments ? parseInt(twilioData.num_segments) : segments,
      p_price: price,
    })

    console.warn('[SendSMS] SMS sent:', twilioData.sid, 'to:', body.to, 'segments:', segments)

    return new Response(JSON.stringify({
      success: true,
      smsId: smsId,
      providerSid: twilioData.sid,
      status: 'sent',
      segments: twilioData.num_segments ? parseInt(twilioData.num_segments) : segments,
      price: price,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[SendSMS] Error:', error)

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
