/**
 * Edge Function: Send Overage Alert
 *
 * Handles email, SMS, and webhook notifications for usage threshold alerts.
 * Supports both Resend API (email) and Twilio (SMS) integrations.
 *
 * Usage:
 *   POST /functions/v1/send-overage-alert
 *   Body: {
 *     type: 'email' | 'sms' | 'webhook',
 *     to: string (email or phone),
 *     user_id: string,
 *     metric_type: string,
 *     threshold_percentage: number,
 *     current_usage: number,
 *     quota_limit: number,
 *     locale: 'vi' | 'en'
 *   }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertPayload {
  type: 'email' | 'sms' | 'webhook'
  to: string
  user_id: string
  org_id?: string
  license_id?: string
  metric_type: string
  threshold_percentage: number
  current_usage: number
  quota_limit: number
  locale: 'vi' | 'en'
}

interface EmailPayload {
  to: string
  subject: string
  html: string
  from: string
}

interface SMSPayload {
  to: string
  from: string
  body: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const payload: AlertPayload = await req.json()

    console.log('[send-overage-alert] Received:', payload)

    // Validate payload
    if (!payload.type || !payload.to || !payload.metric_type) {
      throw new Error('Missing required fields: type, to, metric_type')
    }

    let result: { success: boolean; messageId?: string; error?: string }

    switch (payload.type) {
      case 'email':
        result = await sendEmail(payload, supabase)
        break
      case 'sms':
        result = await sendSMS(payload, supabase)
        break
      case 'webhook':
        result = await sendWebhook(payload, supabase)
        break
      default:
        throw new Error(`Invalid notification type: ${payload.type}`)
    }

    if (!result.success) {
      return new Response(
        JSON.stringify(result),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[send-overage-alert] Error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Send email notification via Resend API
 */
async function sendEmail(
  payload: AlertPayload,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[send-overage-alert] RESEND_API_KEY not configured, skipping email')
    return { success: true, messageId: undefined } // Fail-open
  }

  const template = getEmailTemplate(payload)

  const emailData: EmailPayload = {
    from: 'WellNexus <noreply@wellnexus.vn>',
    to: payload.to,
    subject: template.subject,
    html: template.html,
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Resend API error')
    }

    const result = await response.json()

    // Log email sent to database
    await logNotificationEvent(supabase, {
      userId: payload.user_id,
      orgId: payload.org_id,
      channel: 'email',
      metricType: payload.metric_type,
      threshold: payload.threshold_percentage,
      recipient: payload.to,
      messageId: result.id,
    })

    console.log('[send-overage-alert] Email sent:', result.id)
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('[send-overage-alert] sendEmail error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send SMS notification via Twilio API
 */
async function sendSMS(
  payload: AlertPayload,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('[send-overage-alert] Twilio credentials not configured, skipping SMS')
    return { success: true, messageId: undefined } // Fail-open
  }

  const message = getSMSTemplate(payload)

  const smsData: SMSPayload = {
    from: TWILIO_PHONE_NUMBER,
    to: payload.to,
    body: message,
  }

  try {
    const authHeader = `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(smsData),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Twilio API error')
    }

    const result = await response.json()

    // Log SMS sent to database
    await logNotificationEvent(supabase, {
      userId: payload.user_id,
      orgId: payload.org_id,
      channel: 'sms',
      metricType: payload.metric_type,
      threshold: payload.threshold_percentage,
      recipient: payload.to,
      messageId: result.sid,
    })

    console.log('[send-overage-alert] SMS sent:', result.sid)
    return { success: true, messageId: result.sid }
  } catch (error) {
    console.error('[send-overage-alert] sendSMS error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send webhook notification to AgencyOS
 */
async function sendWebhook(
  payload: AlertPayload,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Get webhook URL from org or use default
  let webhookUrl = 'https://agencyos.network/api/webhooks/usage-alerts'

  if (payload.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('metadata')
      .eq('id', payload.org_id)
      .single()

    if (org?.metadata) {
      webhookUrl = (org.metadata as Record<string, unknown>)?.webhook_url as string || webhookUrl
    }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('AGENCYOS_WEBHOOK_SECRET') || ''}`,
      },
      body: JSON.stringify({
        event_type: 'usage.threshold_breach',
        user_id: payload.user_id,
        org_id: payload.org_id,
        license_id: payload.license_id,
        metric_type: payload.metric_type,
        threshold_percentage: payload.threshold_percentage,
        current_usage: payload.current_usage,
        quota_limit: payload.quota_limit,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Webhook delivery failed')
    }

    const result = await response.json()

    // Log webhook sent to database
    await logNotificationEvent(supabase, {
      userId: payload.user_id,
      orgId: payload.org_id,
      channel: 'webhook',
      metricType: payload.metric_type,
      threshold: payload.threshold_percentage,
      recipient: webhookUrl,
      messageId: result.event_id,
    })

    console.log('[send-overage-alert] Webhook sent to:', webhookUrl)
    return { success: true, messageId: result.event_id }
  } catch (error) {
    console.error('[send-overage-alert] sendWebhook error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get email template based on threshold and locale
 */
function getEmailTemplate(payload: AlertPayload): { subject: string; html: string } {
  const { threshold_percentage, metric_type, current_usage, quota_limit, locale } = payload
  const isVietnamese = locale === 'vi'

  const metricNames: Record<string, { vi: string; en: string }> = {
    api_calls: { vi: 'API calls', en: 'API calls' },
    ai_calls: { vi: 'AI calls', en: 'AI calls' },
    tokens: { vi: 'Tokens', en: 'Tokens' },
    compute_minutes: { vi: 'Compute minutes', en: 'Compute minutes' },
    storage_gb: { vi: 'Storage GB', en: 'Storage GB' },
    emails: { vi: 'Emails', en: 'Emails' },
    model_inferences: { vi: 'Model inferences', en: 'Model inferences' },
    agent_executions: { vi: 'Agent executions', en: 'Agent executions' },
  }

  const metricName = metricNames[metric_type]?.[locale] || metric_type

  const emoji = threshold_percentage === 80 ? '⚠️' : threshold_percentage === 90 ? '🔴' : '🚨'

  const subject = isVietnamese
    ? `[WellNexus] ${threshold_percentage === 80 ? 'Cảnh báo sử dụng' : threshold_percentage === 90 ? 'Sắp hết quota' : 'Đã hết quota!'} - ${metricName}`
    : `[WellNexus] ${threshold_percentage === 80 ? 'Usage Warning' : threshold_percentage === 90 ? 'Quota Almost Exhausted' : 'Quota Exhausted!'} - ${metricName}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert-box { background: white; border-left: 4px solid ${threshold_percentage === 80 ? '#f59e0b' : threshold_percentage === 90 ? '#ef4444' : '#dc2626'}; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .progress-bar { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 15px 0; }
    .progress-fill { background: linear-gradient(90deg, ${threshold_percentage === 80 ? '#f59e0b' : '#ef4444'} 0%, ${threshold_percentage === 80 ? '#fbbf24' : '#dc2626'} 100%); height: 100%; width: ${Math.min(threshold_percentage, 100)}%; transition: width 0.3s; }
    .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-box { background: white; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
    .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin-top: 20px; font-weight: 600; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} WellNexus</h1>
      <p style="margin: 0; opacity: 0.9;">${isVietnamese ? 'Thông báo sử dụng' : 'Usage Notification'}</p>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2 style="margin-top: 0; color: ${threshold_percentage === 80 ? '#b45309' : '#991b1b'};">
          ${threshold_percentage === 80 ? (isVietnamese ? '⚠️ Cảnh báo sử dụng' : '⚠️ Usage Warning') :
            threshold_percentage === 90 ? (isVietnamese ? '🔴 Sắp hết quota' : '🔴 Quota Almost Exhausted') :
            (isVietnamese ? '🚨 Đã hết quota!' : '🚨 Quota Exhausted!')}
        </h2>
        <p style="font-size: 16px;">
          ${isVietnamese
            ? `Bạn đã sử dụng <strong>${threshold_percentage}%</strong> quota <strong>${metricName}</strong> của mình.`
            : `You have used <strong>${threshold_percentage}%</strong> of your <strong>${metricName}</strong> quota.`
          }
        </p>
      </div>

      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>

      <div class="stats">
        <div class="stat-box">
          <div class="stat-value">${current_usage.toLocaleString()}</div>
          <div class="stat-label">${isVietnamese ? 'Đã dùng' : 'Used'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${quota_limit.toLocaleString()}</div>
          <div class="stat-label">${isVietnamese ? 'Giới hạn' : 'Limit'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${quota_limit - current_usage >= 0 ? (quota_limit - current_usage).toLocaleString() : '0'}</div>
          <div class="stat-label">${isVietnamese ? 'Còn lại' : 'Remaining'}</div>
        </div>
      </div>

      ${threshold_percentage >= 90 ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;">
            <strong>${isVietnamese ? '💡 Gợi ý:' : '💡 Recommendation:'}</strong>
            ${isVietnamese
              ? 'Nâng cấp gói của bạn để tiếp tục sử dụng mà không bị gián đoạn.'
              : 'Consider upgrading your plan to continue without interruption.'
            }
          </p>
        </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="https://wellnexus.vn/dashboard/billing" class="cta-button">
          ${isVietnamese ? 'Xem chi tiết →' : 'View Details →'}
        </a>
      </div>

      <div class="footer">
        <p>${isVietnamese
          ? 'Bạn nhận được email này do cài đặt thông báo sử dụng của bạn.'
          : 'You received this email due to your usage notification settings.'
        }</p>
        <p>WellNexus - ${isVietnamese ? 'Xây dựng một lần, triển khai mọi nơi' : 'Build once, deploy anywhere'}</p>
        <p><a href="https://wellnexus.vn/dashboard/settings" style="color: #667eea;">${isVietnamese ? 'Quản lý thông báo' : 'Manage notifications'}</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()

  return { subject, html }
}

/**
 * Get SMS template based on threshold and locale
 */
function getSMSTemplate(payload: AlertPayload): string {
  const { threshold_percentage, metric_type, current_usage, quota_limit, locale } = payload
  const isVietnamese = locale === 'vi'

  const metricShortNames: Record<string, { vi: string; en: string }> = {
    api_calls: { vi: 'API', en: 'API' },
    ai_calls: { vi: 'AI', en: 'AI' },
    tokens: { vi: 'tokens', en: 'tokens' },
    compute_minutes: { vi: 'compute', en: 'compute' },
    storage_gb: { vi: 'storage', en: 'storage' },
    emails: { vi: 'email', en: 'email' },
    model_inferences: { vi: 'inference', en: 'inference' },
    agent_executions: { vi: 'agent', en: 'agent' },
  }

  const metricShort = metricShortNames[metric_type]?.[locale] || metric_type

  if (threshold_percentage === 80) {
    return isVietnamese
      ? `WellNexus: Canh bao: Ban da dung 80% quota ${metricShort}. Con lại ${quota_limit - current_usage}. Xem chi tiet: https://wellnexus.vn/dashboard`
      : `WellNexus: Warning: You've used 80% of ${metricShort} quota. ${quota_limit - current_usage} remaining. Details: https://wellnexus.vn/dashboard`
  } else if (threshold_percentage === 90) {
    return isVietnamese
      ? `WellNexus: Sap het ${metricShort}! 90% da dung. Nap them ngay: https://wellnexus.vn/dashboard/billing`
      : `WellNexus: ${metricShort} almost exhausted! 90% used. Upgrade now: https://wellnexus.vn/dashboard/billing`
  } else {
    return isVietnamese
      ? `WellNexus: DA HET ${metricShort.toUpperCase()}! Thanh toan phi vuot muc de tiep tuc: https://wellnexus.vn/dashboard/billing`
      : `WellNexus: ${metricShort.toUpperCase()} EXHAUSTED! Pay overage to continue: https://wellnexus.vn/dashboard/billing`
  }
}

/**
 * Log notification event to database for audit trail
 */
async function logNotificationEvent(
  supabase: any,
  params: {
    userId: string
    orgId?: string
    channel: string
    metricType: string
    threshold: number
    recipient: string
    messageId?: string
  }
): Promise<void> {
  try {
    await supabase.from('notification_events').insert({
      user_id: params.userId,
      org_id: params.orgId,
      channel: params.channel,
      metric_type: params.metricType,
      threshold_percentage: params.threshold,
      recipient: params.recipient,
      message_id: params.messageId,
      status: 'sent',
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[send-overage-alert] logNotificationEvent error:', error)
    // Don't throw - notification succeeded, log failure is non-critical
  }
}
