/**
 * Subscription Management Page — Multi-org RaaS billing
 *
 * Displays pricing plans, current subscription status, upgrade/cancel flow.
 * Integrates with PayOS via vibe-payment SDK.
 *
 * UI/UX Improvements:
 * - Enhanced visual hierarchy with gradient headers
 * - Better loading states with skeleton loaders
 * - Improved plan cards with hover effects
 * - Toast notifications for feedback
 * - Better mobile responsiveness
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Users,
  ArrowRight,
  Loader2,
  Sparkles,
  Shield,
  Headphones,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  useSubscriptionPageBillingAndPlans,
  PLAN_ICONS,
  PLAN_COLORS,
  featureLabel,
} from './subscription/use-subscription-page-billing-and-plans';

interface PlanCardProps {
  plan: any;
  index: number;
  isCurrent: boolean;
  isUpgrade: boolean;
  isDowngrade: boolean;
  price: number;
  isPopular: boolean;
  billingCycle: 'monthly' | 'yearly';
  upgrading: string | null;
  subscriptionLoading: boolean;
  currentPlanIndex: number;
  onSubscribe: (plan: any) => void;
  onCancel: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  addToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  index,
  isCurrent,
  isUpgrade,
  isDowngrade,
  price,
  isPopular,
  billingCycle,
  upgrading,
  subscriptionLoading,
  currentPlanIndex,
  onSubscribe,
  onCancel,
  t,
}) => {
  const formatPrice = (amount: number) => {
    if (amount === 0) return t('subscription.free');
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`relative group rounded-[2rem] border p-6 transition-all duration-300 ${
        isCurrent
          ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
          : isPopular
          ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-zinc-900 shadow-lg shadow-emerald-500/10'
          : 'border-zinc-700/50 bg-zinc-900/50 hover:border-zinc-600'
      }`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
            <Sparkles className="w-3 h-3" />
            {t('subscription.popular')}
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrent && (
        <div className="absolute top-4 right-4">
          <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
            {t('subscription.current_plan')}
          </span>
        </div>
      )}

      {/* Icon */}
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${PLAN_COLORS[plan.slug]} text-white mb-5 shadow-lg group-hover:shadow-xl transition-shadow`}
      >
        {PLAN_ICONS[plan.slug]}
      </div>

      {/* Plan Name */}
      <h3 className="text-2xl font-bold text-white mb-3">{plan.name}</h3>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white tracking-tighter">
            {formatPrice(price)}
          </span>
          {price > 0 && (
            <span className="text-zinc-500 text-sm">
              /{billingCycle === 'yearly' ? t('subscription.year') : t('subscription.month')}
            </span>
          )}
        </div>
        {billingCycle === 'yearly' && price > 0 && (
          <p className="text-xs text-emerald-400 font-medium mt-1">
            {t('subscription.save_17')}
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-6">
        {plan.features.map((feature: string, i: number) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <Check className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-zinc-300">{featureLabel(feature, t)}</span>
          </li>
        ))}
        <li className="flex items-start gap-3 text-sm text-zinc-400">
          <Users className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{t('subscription.max_members', { count: plan.max_members })}</span>
        </li>
      </ul>

      {/* CTA Button */}
      {isCurrent ? (
        <button
          onClick={onCancel}
          className="w-full py-3.5 rounded-xl border border-zinc-600 text-zinc-400 text-sm font-medium hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          {t('subscription.cancel')}
        </button>
      ) : plan.slug === 'free' ? (
        <div className="w-full py-3.5 rounded-xl text-center text-zinc-500 text-sm bg-zinc-800/50">
          {t('subscription.included')}
        </div>
      ) : (
        <button
          onClick={() => onSubscribe(plan)}
          disabled={!!upgrading || subscriptionLoading}
          className={`w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
            isUpgrade || currentPlanIndex < 0
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg hover:shadow-emerald-500/30'
              : isDowngrade
              ? 'border border-zinc-600 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg hover:shadow-emerald-500/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {upgrading === plan.id ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {isDowngrade ? t('subscription.downgrade') : t('subscription.upgrade')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      )}
    </motion.div>
  );
};

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
    planHierarchy,
    currentPlanIndex,
  } = useSubscriptionPageBillingAndPlans();

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Wrap handleSubscribe to show toasts
  const wrappedHandleSubscribe = useCallback((plan: any) => {
    addToast('info', t('subscription.processing_upgrade'));
    handleSubscribe(plan);
  }, [handleSubscribe, addToast, t]);

  const faqItems = [
    { q: t('subscription.faq.q1_question'), a: t('subscription.faq.q1_answer') },
    { q: t('subscription.faq.q2_question'), a: t('subscription.faq.q2_answer') },
    { q: t('subscription.faq.q3_question'), a: t('subscription.faq.q3_answer') },
    { q: t('subscription.faq.q4_question'), a: t('subscription.faq.q4_answer') },
  ];

  // Skeleton loader for plans
  const PlanSkeleton = () => (
    <div className="rounded-[2rem] border border-white/5 p-6 bg-white/[0.02] animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-white/10 mb-5" />
      <div className="h-8 bg-white/10 rounded-lg mb-3 w-3/4" />
      <div className="h-12 bg-white/10 rounded-lg mb-6 w-1/2" />
      <div className="space-y-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 bg-white/10 rounded w-full" />
        ))}
      </div>
      <div className="h-12 bg-white/10 rounded-xl w-full" />
    </div>
  );

  if (!pageLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm max-w-sm ${
                toast.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : toast.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              {toast.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="hover:bg-white/10 rounded-lg p-1 transition-colors"
                aria-label={t('common.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                {t('subscription.save_17')}
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              {t('subscription.title')}
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {t('subscription.subtitle')}
            </p>

            {/* Billing Toggle - Enhanced */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 mt-8">
              <span
                className={`text-sm sm:text-base font-medium transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'text-white text-lg'
                    : 'text-zinc-500'
                }`}
              >
                {t('subscription.monthly')}
              </span>
              <button
                onClick={() => setBillingCycle((b) => (b === 'monthly' ? 'yearly' : 'monthly'))}
                className="relative w-20 h-9 sm:w-24 sm:h-10 bg-zinc-800 rounded-full transition-all duration-300 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950"
                aria-label={t('subscription.toggle_billing')}
                aria-pressed={billingCycle === 'yearly'}
              >
                <motion.div
                  className="absolute top-1.5 left-1.5 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full shadow-lg"
                  animate={{ x: billingCycle === 'monthly' ? 0 : billingCycle === 'yearly' ? 88 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
              <span
                className={`text-sm sm:text-base font-medium transition-all duration-300 ${
                  billingCycle === 'yearly'
                    ? 'text-white text-lg'
                    : 'text-zinc-500'
                }`}
              >
                {t('subscription.yearly')}
              </span>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-bold text-emerald-400 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-3 py-1.5 rounded-full border border-emerald-400/20 shadow-lg shadow-emerald-500/10"
              >
                {t('subscription.save_17')}
              </motion.div>
            </div>
          </motion.div>

        {/* Current Plan Status */}
        {activePlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-md"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-6 text-center backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 animate-pulse" />
              <p className="relative text-emerald-400 text-sm">
                {t('subscription.current_plan')}: <strong className="text-white">{activePlan.plan_name}</strong>
              </p>
              {currentSubscription && (
                <p className="relative text-zinc-500 text-xs mt-2">
                  {t('subscription.renews')}:{' '}
                  {new Date(currentSubscription.current_period_end).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {subscriptionError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md"
          >
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm text-center">
              {subscriptionError}
            </div>
          </motion.div>
        )}

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: Shield, label: t('subscription.trust.secure') },
            { icon: RefreshCcw, label: t('subscription.trust.cancel_anytime') },
            { icon: Headphones, label: t('subscription.trust.support_24_7') },
            { icon: Zap, label: t('subscription.trust.instant_activation') },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800"
            >
              <item.icon className="w-6 h-6 text-emerald-400" />
              <span className="text-xs text-zinc-400 text-center">{item.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Plan Cards - Enhanced with skeleton loaders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subscriptionLoading && plans.length === 0 ? (
            <>
              <PlanSkeleton />
              <PlanSkeleton />
              <PlanSkeleton />
              <PlanSkeleton />
            </>
          ) : (
            plans.map((plan, i) => {
              const isCurrent = activePlan?.plan_slug === plan.slug;
              const isUpgrade = planHierarchy.indexOf(plan.slug) > currentPlanIndex;
              const isDowngrade =
                planHierarchy.indexOf(plan.slug) < currentPlanIndex && currentPlanIndex >= 0;
              const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
              const isPopular = plan.slug === 'pro';

              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  index={i}
                  isCurrent={isCurrent}
                  isUpgrade={isUpgrade}
                  isDowngrade={isDowngrade}
                  price={price}
                  isPopular={isPopular}
                  billingCycle={billingCycle}
                  upgrading={upgrading}
                  subscriptionLoading={subscriptionLoading}
                  currentPlanIndex={currentPlanIndex}
                  onSubscribe={wrappedHandleSubscribe}
                  onCancel={handleCancel}
                  t={t}
                  addToast={addToast}
                />
              );
            })
          )}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {t('subscription.faq_title')}
          </h2>
          <p className="text-zinc-400 text-center mb-8">{t('subscription.faq_subtitle')}</p>

          <div className="space-y-4">
            <AnimatePresence>
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl border border-zinc-700/50 bg-zinc-900/50 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="font-semibold text-white pr-4">{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className="px-6 pb-4 text-zinc-400 text-sm leading-relaxed">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-2">
              {t('subscription.cta_bottom.title')}
            </h2>
            <p className="text-zinc-400 mb-6">{t('subscription.cta_bottom.subtitle')}</p>
            <button
              onClick={() => {
                const freePlan = plans.find((p) => p.slug === 'free');
                if (freePlan) handleSubscribe(freePlan);
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:scale-105"
            >
              {t('subscription.cta_bottom.get_started')}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
};

export default SubscriptionPage;
