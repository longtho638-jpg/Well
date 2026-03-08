/**
 * Payment Update Page - Dashboard Billing
 *
 * Allows users to update payment method when subscription is past_due.
 * Integrates with Stripe Customer Portal for secure payment updates.
 */

import React, { useState, useEffect } from 'react'
import { AlertCircle, CreditCard, CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { stripeBillingClient } from '@/lib/stripe-billing-client'
import { Button } from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'

interface BillingStatus {
  subscription_status: string
  amount_due: number
  currency: string
  next_billing_date: string
  payment_method?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  } | null
}

export const PaymentUpdatePage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadBillingStatus()
  }, [])

  async function loadBillingStatus() {
    try {
      setLoading(true)
      setError(null)

      // Get org_id from user's organization
      const { data: orgData } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', user?.id)
        .single()

      if (!orgData?.org_id) {
        setError(t('billing.no_organization'))
        return
      }

      // Get subscription status
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('org_id', orgData.org_id)
        .single()

      if (!subscription) {
        setError(t('billing.no_subscription'))
        return
      }

      // Get customer ID
      const { data: customerData } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('org_id', orgData.org_id)
        .single()

      const customerId = customerData?.stripe_customer_id

      // Get payment method details if available
      let paymentMethod = null
      if (customerId && subscription.stripe_subscription_id) {
        try {
          const { data: paymentData } = await supabase.functions.invoke('stripe-get-payment-method', {
            body: {
              customer_id: customerId,
              subscription_id: subscription.stripe_subscription_id,
            },
          })

          if (paymentData?.payment_method) {
            paymentMethod = {
              brand: paymentData.payment_method.card?.brand || 'card',
              last4: paymentData.payment_method.card?.last4 || '****',
              exp_month: paymentData.payment_method.card?.exp_month,
              exp_year: paymentData.payment_method.card?.exp_year,
            }
          }
        } catch (err) {
          console.warn('Failed to get payment method:', err)
        }
      }

      setBillingStatus({
        subscription_status: subscription.status,
        amount_due: subscription.amount_due || 0,
        currency: subscription.currency || 'USD',
        next_billing_date: subscription.current_period_end,
        payment_method: paymentMethod,
      })
    } catch (err) {
      console.error('Error loading billing status:', err)
      setError(t('billing.load_error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdatePaymentMethod() {
    try {
      setUpdating(true)
      setError(null)

      // Get customer ID
      const { data: orgData } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', user?.id)
        .single()

      if (!orgData?.org_id) {
        throw new Error('No organization found')
      }

      const { data: customerData } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('org_id', orgData.org_id)
        .single()

      if (!customerData?.stripe_customer_id) {
        throw new Error('No Stripe customer found')
      }

      // Get Customer Portal URL
      const portalUrl = await stripeBillingClient.getCustomerPortalUrl(customerData.stripe_customer_id)

      if (portalUrl) {
        // Open Stripe Customer Portal
        window.open(portalUrl, '_blank')

        // Show success message
        setSuccess(t('billing.portal_opened'))
      } else {
        throw new Error('Failed to get portal URL')
      }
    } catch (err) {
      console.error('Error updating payment method:', err)
      setError(err instanceof Error ? err.message : t('billing.update_error'))
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (error && !billingStatus) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">{t('billing.error')}</h3>
        <p className="text-zinc-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">{t('billing.update_payment_title')}</h1>
        <p className="text-zinc-400 mt-1">
          {t('billing.update_payment_description')}
        </p>
      </div>

      {/* Past Due Warning */}
      {billingStatus?.subscription_status === 'past_due' && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-red-500/10 p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">
                {t('billing.payment_overdue')}
              </h3>
              <p className="text-zinc-300 mb-4">
                {t('billing.overdue_description')}
              </p>

              {/* Amount Due */}
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-zinc-400" />
                    <span className="text-zinc-400">{t('billing.amount_due')}</span>
                  </div>
                  <span className="text-2xl font-bold text-amber-400">
                    ${billingStatus.amount_due.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Update Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={handleUpdatePaymentMethod}
                disabled={updating}
                className="w-full"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('billing.loading')}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {t('billing.update_payment_method')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Current Payment Method */}
      {billingStatus?.payment_method && (
        <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900 p-6">
          <h3 className="text-lg font-bold text-white mb-4">{t('billing.current_payment_method')}</h3>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50">
            <CreditCard className="w-10 h-10 text-zinc-400" />
            <div className="flex-1">
              <p className="text-white font-medium">
                {billingStatus.payment_method.brand?.charAt(0).toUpperCase() + billingStatus.payment_method.brand?.slice(1)} •••• {billingStatus.payment_method.last4}
              </p>
              <p className="text-zinc-500 text-sm">
                {t('billing.expires')} {billingStatus.payment_method.exp_month}/{billingStatus.payment_method.exp_year}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdatePaymentMethod}
              disabled={updating}
            >
              {t('billing.change')}
            </Button>
          </div>
        </div>
      )}

      {/* Billing Information */}
      <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900 p-6">
        <h3 className="text-lg font-bold text-white mb-4">{t('billing.billing_info')}</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-zinc-400">{t('billing.status')}</dt>
            <dd className={`font-medium ${
              billingStatus?.subscription_status === 'active' ? 'text-emerald-400' :
              billingStatus?.subscription_status === 'past_due' ? 'text-amber-400' :
              'text-zinc-300'
            }`}>
              {t(`billing.status.${billingStatus?.subscription_status}`) || billingStatus?.subscription_status}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-400">{t('billing.next_billing_date')}</dt>
            <dd className="text-zinc-300">
              {billingStatus?.next_billing_date
                ? new Date(billingStatus.next_billing_date).toLocaleDateString('vi-VN')
                : '-'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <p className="text-emerald-400">{success}</p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-xl bg-zinc-800/50 p-4 text-sm text-zinc-400">
        <p className="font-medium text-zinc-300 mb-2">{t('billing.secure_payment')}</p>
        <p>
          {t('billing.stripe_secure')}{' '}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            {t('billing.stripe_privacy')}
          </a>
        </p>
      </div>
    </div>
  )
}
