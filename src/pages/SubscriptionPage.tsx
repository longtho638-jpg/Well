/**
 * Subscription Management Page — Multi-org RaaS billing
 *
 * Displays pricing plans, current subscription status, upgrade/cancel flow.
 * Integrates with PayOS via vibe-payment SDK.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Users, ArrowRight, Loader2 } from 'lucide-react';
import {
  useSubscriptionPageBillingAndPlans,
  PLAN_ICONS,
  PLAN_COLORS,
  featureLabel,
} from './subscription/use-subscription-page-billing-and-plans';

const SubscriptionPage: React.FC = () => {
  const {
    t,
    billingCycle,
    setBillingCycle,
    upgrading,
    plans,
    activePlan,
    currentSubscription,
    subscriptionLoading,
    subscriptionError,
    handleSubscribe,
    handleCancel,
    formatPrice,
    planHierarchy,
    currentPlanIndex,
  } = useSubscriptionPageBillingAndPlans();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">
          {t('subscription.title')}
        </h1>
        <p className="mt-2 text-zinc-400">
          {t('subscription.subtitle')}
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={billingCycle === 'monthly' ? 'text-white font-medium' : 'text-zinc-500'}>
          {t('subscription.monthly')}
        </span>
        <button
          onClick={() => setBillingCycle(b => b === 'monthly' ? 'yearly' : 'monthly')}
          className="relative w-14 h-7 bg-zinc-700 rounded-full transition-colors"
          aria-label={t('subscription.toggle_billing')}
        >
          <div
            className={`absolute top-0.5 w-6 h-6 bg-emerald-500 rounded-full transition-transform ${
              billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className={billingCycle === 'yearly' ? 'text-white font-medium' : 'text-zinc-500'}>
          {t('subscription.yearly')}
          <span className="ml-1 text-xs text-emerald-400">{t('subscription.save_17')}</span>
        </span>
      </div>

      {/* Current plan indicator */}
      {activePlan && (
        <div className="mx-auto max-w-md p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <p className="text-emerald-400 text-sm">
            {t('subscription.current_plan')}: <strong>{activePlan.plan_name}</strong>
          </p>
          {currentSubscription && (
            <p className="text-zinc-500 text-xs mt-1">
              {t('subscription.renews')}: {new Date(currentSubscription.current_period_end).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {subscriptionError && (
        <div className="mx-auto max-w-md p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {subscriptionError}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(subscriptionLoading && plans.length === 0) ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          plans.map((plan, i) => {
            const isCurrent = activePlan?.plan_slug === plan.slug;
            const isUpgrade = planHierarchy.indexOf(plan.slug) > currentPlanIndex;
            const isDowngrade = planHierarchy.indexOf(plan.slug) < currentPlanIndex && currentPlanIndex >= 0;
            const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
            const isPopular = plan.slug === 'pro';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : isPopular
                    ? 'border-emerald-500/50 bg-zinc-900'
                    : 'border-zinc-700/50 bg-zinc-900'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-black text-xs font-bold rounded-full">
                    {t('subscription.popular')}
                  </div>
                )}

                {/* Icon + Name */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${PLAN_COLORS[plan.slug]} text-white mb-4`}>
                  {PLAN_ICONS[plan.slug]}
                </div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>

                {/* Price */}
                <div className="mt-3 mb-4">
                  <span className="text-3xl font-bold text-white">{formatPrice(price)}</span>
                  {price > 0 && (
                    <span className="text-zinc-500 text-sm">
                      /{billingCycle === 'yearly' ? t('subscription.year') : t('subscription.month')}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{featureLabel(feature, t)}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2 text-sm text-zinc-400">
                    <Users className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{t('subscription.max_members', { count: plan.max_members })}</span>
                  </li>
                </ul>

                {/* CTA Button */}
                {isCurrent ? (
                  <button
                    onClick={handleCancel}
                    className="w-full py-2.5 rounded-xl border border-zinc-600 text-zinc-400 text-sm hover:border-red-500/50 hover:text-red-400 transition-colors"
                  >
                    {t('subscription.cancel')}
                  </button>
                ) : plan.slug === 'free' ? (
                  <div className="w-full py-2.5 rounded-xl text-center text-zinc-500 text-sm">
                    {t('subscription.included')}
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={!!upgrading || subscriptionLoading}
                    className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                      isUpgrade || currentPlanIndex < 0
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                        : isDowngrade
                        ? 'border border-zinc-600 text-zinc-300 hover:border-emerald-500/50'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    } disabled:opacity-50`}
                  >
                    {upgrading === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {isDowngrade ? t('subscription.downgrade') : t('subscription.upgrade')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
