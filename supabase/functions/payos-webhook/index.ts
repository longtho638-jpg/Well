import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handlePayOSWebhook, computeSubscriptionPeriodEnd, createAdminClient } from '../_shared/vibe-payos/mod.ts'
import type { WebhookCallbacks, WebhookOrderRecord, WebhookSubscriptionIntent } from '../_shared/vibe-payos/mod.ts'
import type { PayOSWebhookData } from '../_shared/vibe-payos/mod.ts'
import { provisionLicenseOnPayment } from '../_shared/raas-license-provision.ts'

interface OrderItem {
  product_name: string
  quantity: number
  unit_price?: number
}

serve(async (req) => {
  const supabase = createAdminClient()

  const callbacks: WebhookCallbacks = {
    findOrder: async (orderCode) => {
      const { data } = await supabase
        .from('orders')
        .select('id, status, user_id, order_code')
        .eq('order_code', orderCode)
        .single()
      return data as WebhookOrderRecord | null
    },

    findSubscriptionIntent: async (orderCode) => {
      const { data } = await supabase
        .from('subscription_payment_intents')
        .select('id, user_id, plan_id, billing_cycle, status, org_id')
        .eq('payos_order_code', orderCode)
        .single()
      return data as WebhookSubscriptionIntent | null
    },

    updateOrderStatus: async (orderId, newStatus, paymentData) => {
      const { data } = await supabase
        .from('orders')
        .update({ status: newStatus, payment_data: paymentData, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'pending')
        .select('id')
        .single()
      return !!data
    },

    updateSubscriptionIntent: async (intentId, status) => {
      await supabase
        .from('subscription_payment_intents')
        .update({ status, completed_at: new Date().toISOString() })
        .eq('id', intentId)
        .eq('status', 'pending')
    },

    activateSubscription: async (intent, data) => {
      const now = new Date()
      const periodEnd = computeSubscriptionPeriodEnd(now, intent.billing_cycle)
      const nowIso = now.toISOString()
      const periodEndIso = periodEnd.toISOString()

      // Cancel existing active subscriptions
      await supabase
        .from('user_subscriptions')
        .update({ status: 'canceled', canceled_at: nowIso })
        .eq('user_id', intent.user_id)
        .in('status', ['active', 'trialing'])

      const { error } = await supabase.from('user_subscriptions').insert({
        user_id: intent.user_id,
        plan_id: intent.plan_id,
        billing_cycle: intent.billing_cycle,
        status: 'active',
        current_period_end: periodEndIso,
        payos_order_code: data.orderCode,
        last_payment_at: nowIso,
        next_payment_at: periodEndIso,
        org_id: intent.org_id ?? null,
      })

      if (error) {
        await callbacks.logAudit(intent.user_id, 'SUBSCRIPTION_ACTIVATION_FAILED', {
          intentId: intent.id, planId: intent.plan_id, error: error.message,
        }, 'failure')
      } else {
        await callbacks.logAudit(intent.user_id, 'SUBSCRIPTION_ACTIVATED', {
          planId: intent.plan_id, billingCycle: intent.billing_cycle, periodEnd: periodEndIso,
        }, 'success')

        // ════════════════════════════════════════════════════════════
        // ROIaaS PHASE 3: Auto-provision license on subscription
        // ════════════════════════════════════════════════════════════
        try {
          const provisionResult = await provisionLicenseOnPayment(
            {
              userId: intent.user_id,
              planId: intent.plan_id,
              billingCycle: intent.billing_cycle as 'monthly' | 'yearly',
              paymentAmount: data.amount,
              paymentId: String(data.orderCode),
              orgId: intent.org_id ?? undefined,
            },
            supabase
          )

          if (provisionResult.success) {
            await callbacks.logAudit(intent.user_id, 'LICENSE_PROVISIONED', {
              licenseNonce: provisionResult.license?.nonce,
              tier: provisionResult.license?.tier,
            }, 'success')
          } else {
            await callbacks.logAudit(intent.user_id, 'LICENSE_PROVISION_FAILED', {
              error: provisionResult.error,
            }, 'failure')
          }
        } catch (err) {
          await callbacks.logAudit(intent.user_id, 'LICENSE_PROVISION_ERROR', {
            error: String(err),
          }, 'failure')
        }
      }
    },

    logAudit: async (userId, action, payload, severity) => {
      try {
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action,
          payload: { ...payload, severity },
          user_agent: 'PayOS-Webhook-Service',
          ip_address: '0.0.0.0',
        })
      } catch (err) {
        // Last-resort fallback — audit logging must not break webhook flow
        console.error('[audit] Write failed:', err)
      }
    },

    // ─── Business logic side effects ──────────────────────────

    onOrderPaid: async (order: WebhookOrderRecord, data: PayOSWebhookData) => {
      // Sync to transactions table (idempotent)
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('reference_id', order.id)
        .eq('type', 'sale')
        .limit(1)

      if (!existingTx || existingTx.length === 0) {
        const { error: txError } = await supabase.from('transactions').insert({
          user_id: order.user_id,
          amount: data.amount,
          type: 'sale',
          status: 'completed',
          description: `PayOS đơn hàng #${data.orderCode}`,
          reference_id: order.id,
          created_at: new Date().toISOString(),
        })

        if (txError) {
          await callbacks.logAudit(order.user_id, 'TRANSACTION_SYNC_FAILED', {
            orderId: order.id, orderCode: data.orderCode, error: txError.message,
          }, 'failure')
        }
      }

      // Email notification (fire-and-forget)
      if (order.user_id) {
        const [userResult, itemsResult] = await Promise.all([
          supabase.from('users').select('email, full_name').eq('id', order.user_id).single(),
          supabase.from('order_items').select('product_name, quantity, unit_price').eq('order_id', order.id),
        ])

        if (userResult.data?.email) {
          supabase.functions.invoke('send-email', {
            body: {
              to: userResult.data.email,
              subject: `✅ Đơn hàng #${data.orderCode} đã được xác nhận!`,
              templateType: 'order-confirmation',
              data: {
                userName: userResult.data.full_name || 'Bạn',
                orderId: String(data.orderCode),
                orderDate: new Date().toLocaleDateString('vi-VN'),
                totalAmount: `${data.amount.toLocaleString('vi-VN')} VND`,
                items: (itemsResult.data || []).map((i: OrderItem) => ({
                  name: i.product_name, quantity: i.quantity,
                  price: `${(i.unit_price || 0).toLocaleString('vi-VN')} VND`,
                })),
              },
            },
          }).catch(async (err) => {
            await callbacks.logAudit(order.user_id, 'EMAIL_SEND_FAILED', {
              orderId: order.id, error: String(err),
            }, 'failure')
          })
        }
      }

      // Commission distribution (fire-and-forget)
      if (order.user_id) {
        const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
        supabase.functions.invoke('agent-reward', {
          body: {
            record: { id: order.id, user_id: order.user_id, total_vnd: data.amount, status: 'completed' },
            old_record: { status: 'pending' },
          },
          ...(webhookSecret ? { headers: { 'x-webhook-secret': webhookSecret } } : {}),
        }).catch(async (err) => {
          await callbacks.logAudit(order.user_id, 'COMMISSION_DISTRIBUTION_FAILED', {
            orderId: order.id, error: String(err),
          }, 'failure')
        })
      }
    },
  }

  return handlePayOSWebhook(req, callbacks)
})
