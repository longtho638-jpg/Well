/**
 * Stripe Dunning Management - Supabase Edge Function
 *
 * Handles automatic payment retry logic and dunning email notifications.
 * Triggered by webhook events or scheduled cron job.
 *
 * POST /functions/v1/stripe-dunning
 * Body: { action: 'retry' | 'notify' | 'cancel', subscription_id: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createAdminClient, jsonRes } from './_shared/vibe-payos/edge-function-helpers.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://wellnexus.vn'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      }
    })
  }

  try {
    const body = await req.json()
    const { action, subscription_id } = body

    if (!action || !subscription_id) {
      return jsonRes({ error: 'Missing action or subscription_id' }, 400)
    }

    const supabase = createAdminClient()

    // Get subscription details
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*, users(email, full_name)')
      .eq('stripe_subscription_id', subscription_id)
      .single()

    if (!subscription) {
      return jsonRes({ error: 'Subscription not found' }, 404)
    }

    const user = subscription.users
    const retryCount = (subscription.metadata as any)?.dunning_retry_count || 0
    const maxRetries = 3
    const retryIntervals = [1, 3, 7] // Days between retries

    switch (action) {
      case 'retry': {
        // Attempt payment retry
        if (retryCount >= maxRetries) {
          // Cancel subscription after max retries
          await handleCancelSubscription(subscription_id, supabase)
          await sendDunningEmail(user.email, user.full_name, subscription, 'cancelled')
          return jsonRes({ status: 'cancelled', reason: 'max_retries_exceeded' })
        }

        // Schedule retry via Stripe
        const nextRetryDays = retryIntervals[retryCount] || 7
        const nextRetryDate = new Date()
        nextRetryDate.setDate(nextRetryDate.getDate() + nextRetryDays)

        await supabase
          .from('user_subscriptions')
          .update({
            status: 'past_due',
            metadata: {
              ...((subscription.metadata as any) || {}),
              dunning_retry_count: retryCount + 1,
              next_retry_date: nextRetryDate.toISOString(),
              last_dunning_action: 'retry_scheduled',
            },
          })
          .eq('id', subscription.id)

        // Send retry notification email
        await sendDunningEmail(user.email, user.full_name, subscription, 'retry', nextRetryDays)

        return jsonRes({
          status: 'retry_scheduled',
          next_retry: nextRetryDate.toISOString(),
          retry_count: retryCount + 1,
        })
      }

      case 'notify': {
        // Send dunning notification without scheduling retry
        await sendDunningEmail(user.email, user.full_name, subscription, 'notice')
        return jsonRes({ status: 'notification_sent' })
      }

      case 'cancel': {
        await handleCancelSubscription(subscription_id, supabase)
        await sendDunningEmail(user.email, user.full_name, subscription, 'cancelled')
        return jsonRes({ status: 'cancelled' })
      }

      default:
        return jsonRes({ error: 'Invalid action' }, 400)
    }

  } catch (err) {
    console.error('[StripeDunning] Error:', err)
    return jsonRes({ error: 'Internal server error' }, 500)
  }
})

/**
 * Cancel subscription and revoke license
 */
async function handleCancelSubscription(subscriptionId: string, supabase: any) {
  // Update subscription status
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      metadata: {
        cancel_reason: 'dunning_max_retries',
      },
    })
    .eq('stripe_subscription_id', subscriptionId)

  // Revoke license
  await supabase
    .from('raas_licenses')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      metadata: {
        revoke_reason: 'subscription_canceled_dunning',
      },
    })
    .eq('(metadata->>stripe_subscription_id)', subscriptionId)

  console.log('[StripeDunning] Subscription cancelled:', subscriptionId)
}

/**
 * Send dunning email notification
 */
async function sendDunningEmail(
  to: string,
  name: string,
  subscription: any,
  type: 'retry' | 'notice' | 'cancelled',
  daysUntilRetry?: number
) {
  if (!RESEND_API_KEY) {
    console.warn('[StripeDunning] RESEND_API_KEY not configured, skipping email')
    return
  }

  const subjectMap = {
    retry: `⚠️ Thanh toán thất bại - Vui lòng cập nhật phương thức thanh toán`,
    notice: `🔔 Nhắc nhở: Subscription của bạn đang bị tạm ngưng`,
    cancelled: `❌ Subscription đã bị hủy do thanh toán thất bại`,
  }

  const templateData = {
    userName: name || 'Bạn',
    subscriptionPlan: subscription?.plan_name || 'Subscription',
    amountDue: '$9.00',
    daysUntilRetry: daysUntilRetry?.toString() || '3',
    updatePaymentUrl: `${APP_URL}/dashboard/subscription`,
    contactSupportUrl: `${APP_URL}/support`,
  }

  const emailHtml = generateDunningEmailHTML(type, templateData)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WellNexus <noreply@wellnexus.vn>',
        to,
        subject: subjectMap[type],
        html: emailHtml,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[StripeDunning] Email error:', errorData)
    } else {
      const result = await response.json()
      console.log('[StripeDunning] Email sent:', result.id)
    }
  } catch (err) {
    console.error('[StripeDunning] Send email error:', err)
  }
}

/**
 * Generate dunning email HTML
 */
function generateDunningEmailHTML(type: string, data: any): string {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background: #f9fafb;
  `

  const cardStyles = `
    background: white;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  `

  const buttonStyles = `
    display: inline-block;
    padding: 12px 32px;
    background: #10b981;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin-top: 20px;
  `

  const alertColors = {
    retry: '#f59e0b',    // Amber
    notice: '#3b82f6',   // Blue
    cancelled: '#ef4444', // Red
  }

  const alertColor = alertColors[type as keyof typeof alertColors]

  const contentMap = {
    retry: `
      <h2 style="color: ${alertColor}; margin-bottom: 16px;">⚠️ Thanh toán thất bại</h2>
      <p style="color: #374151; line-height: 1.6;">
        Chào ${data.userName},
      </p>
      <p style="color: #374151; line-height: 1.6;">
        Hệ thống không thể xử lý thanh toán cho subscription <strong>${data.subscriptionPlan}</strong>
        của bạn (số tiền: ${data.amountDue}).
      </p>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Chúng tôi sẽ tự động thử lại sau <strong>${data.daysUntilRetry} ngày</strong>.
        Nếu vẫn thất bại, subscription sẽ bị hủy.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${data.updatePaymentUrl}" style="${buttonStyles}">Cập nhật phương thức thanh toán</a>
      </div>
    `,
    notice: `
      <h2 style="color: ${alertColor}; margin-bottom: 16px;">🔔 Nhắc nhở Subscription</h2>
      <p style="color: #374151; line-height: 1.6;">
        Chào ${data.userName},
      </p>
      <p style="color: #374151; line-height: 1.6;">
        Subscription <strong>${data.subscriptionPlan}</strong> của bạn đang ở trạng thái
        <strong>past_due</strong> do thanh toán thất bại.
      </p>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Vui lòng cập nhật phương thức thanh toán để tiếp tục sử dụng dịch vụ.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${data.updatePaymentUrl}" style="${buttonStyles}">Cập nhật ngay</a>
      </div>
    `,
    cancelled: `
      <h2 style="color: ${alertColor}; margin-bottom: 16px;">❌ Subscription đã hủy</h2>
      <p style="color: #374151; line-height: 1.6;">
        Chào ${data.userName},
      </p>
      <p style="color: #374151; line-height: 1.6;">
        Subscription <strong>${data.subscriptionPlan}</strong> của bạn đã bị hủy do
        thanh toán thất bại sau nhiều lần thử lại.
      </p>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Nếu đây là nhầm lẫn, vui lòng liên hệ hỗ trợ.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${data.contactSupportUrl}" style="background: #6b7280; ${buttonStyles}">Liên hệ hỗ trợ</a>
      </div>
    `,
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WellNexus Billing Notification</title>
      </head>
      <body style="${baseStyles}">
        <div style="${cardStyles}">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://wellnexus.vn/logo.png" alt="WellNexus" style="height: 40px;">
          </div>
          ${contentMap[type as keyof typeof contentMap]}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Email tự động từ WellNexus Billing System
          </p>
        </div>
      </body>
    </html>
  `
}
