/**
 * Pricing Landing Page - WellNexus
 * 3-tier subscription pricing with FAQ and PayOS checkout
 * Aura Elite design: Glassmorphism, dark gradients, teal accents
 *
 * UI/UX Improvements:
 * - Enhanced visual hierarchy with animated price displays
 * - Improved mobile responsiveness with horizontal scrolling cards
 * - Better loading states with skeleton loaders
 * - Toast notifications instead of alerts
 * - Enhanced accessibility with ARIA labels
 * - Smoother micro-interactions and transitions
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Crown,
  Zap,
  Users,
  ChevronDown,
  ChevronUp,
  Shield,
  Clock,
  Headphones,
  RefreshCcw,
  Star,
  Award,
  TrendingUp,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import { SEOHead } from '@/components/seo/seo-head';
import { createPayment } from '@/services/payment/payos-client';
import { QRPaymentModal } from '@/components/checkout/qr-payment-modal';
import type { PaymentResponse } from '@/services/payment/payos-client';

interface PricingTier {
  id: string;
  nameKey: string;
  monthlyPrice: number;
  yearlyPrice: number;
  descriptionKey: string;
  features: string[];
  icon: React.ReactNode;
  gradient: string;
  popular?: boolean;
}

interface FAQItem {
  questionKey: string;
  answerKey: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const PricingPage: React.FC = () => {
  const { t, lang } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pageLoaded, setPageLoaded] = useState(false);

  React.useEffect(() => {
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

  const testimonials = [
    {
      name: 'Sarah Nguyen',
      role: t('pricing.testimonials.sarah_role'),
      content: t('pricing.testimonials.sarah_content'),
      rating: 5,
      avatar: '👩‍💼',
    },
    {
      name: 'David Tran',
      role: t('pricing.testimonials.david_role'),
      content: t('pricing.testimonials.david_content'),
      rating: 5,
      avatar: '👨‍💼',
    },
    {
      name: 'Lisa Pham',
      role: t('pricing.testimonials.lisa_role'),
      content: t('pricing.testimonials.lisa_content'),
      rating: 5,
      avatar: '👩‍🦰',
    },
  ];

  const tiers: PricingTier[] = [
    {
      id: 'free',
      nameKey: 'pricing.free_name',
      monthlyPrice: 0,
      yearlyPrice: 0,
      descriptionKey: 'pricing.free_description',
      features: [
        'pricing.features.basic_dashboard',
        'pricing.features.marketplace_access',
        'pricing.features.basic_support',
      ],
      icon: React.createElement(Users, { className: 'w-8 h-8' }),
      gradient: 'from-zinc-600 to-zinc-700',
    },
    {
      id: 'pro',
      nameKey: 'pricing.pro_name',
      monthlyPrice: 299000,
      yearlyPrice: 299000 * 10,
      descriptionKey: 'pricing.pro_description',
      features: [
        'pricing.features.everything_in_free',
        'pricing.features.advanced_analytics',
        'pricing.features.ai_copilot',
        'pricing.features.priority_support',
        'pricing.features.health_coach',
      ],
      icon: React.createElement(Zap, { className: 'w-8 h-8' }),
      gradient: 'from-teal-500 to-emerald-600',
      popular: true,
    },
    {
      id: 'enterprise',
      nameKey: 'pricing.enterprise_name',
      monthlyPrice: 999000,
      yearlyPrice: 999000 * 10,
      descriptionKey: 'pricing.enterprise_description',
      features: [
        'pricing.features.everything_in_pro',
        'pricing.features.white_label',
        'pricing.features.multi_network',
        'pricing.features.api_access',
        'pricing.features.dedicated_support',
        'pricing.features.custom_integrations',
      ],
      icon: React.createElement(Crown, { className: 'w-8 h-8' }),
      gradient: 'from-purple-600 to-indigo-700',
    },
  ];

  const faqItems: FAQItem[] = [
    { questionKey: 'pricing.faq.q1_question', answerKey: 'pricing.faq.q1_answer' },
    { questionKey: 'pricing.faq.q2_question', answerKey: 'pricing.faq.q2_answer' },
    { questionKey: 'pricing.faq.q3_question', answerKey: 'pricing.faq.q3_answer' },
    { questionKey: 'pricing.faq.q4_question', answerKey: 'pricing.faq.q4_answer' },
    { questionKey: 'pricing.faq.q5_question', answerKey: 'pricing.faq.q5_answer' },
    { questionKey: 'pricing.faq.q6_question', answerKey: 'pricing.faq.q6_answer' },
    { questionKey: 'pricing.faq.q7_question', answerKey: 'pricing.faq.q7_answer' },
    { questionKey: 'pricing.faq.q8_question', answerKey: 'pricing.faq.q8_answer' },
    { questionKey: 'pricing.faq.q9_question', answerKey: 'pricing.faq.q9_answer' },
    { questionKey: 'pricing.faq.q10_question', answerKey: 'pricing.faq.q10_answer' },
  ];

  const formatPrice = (price: number) => {
    if (price === 0) return t('pricing.free_name');
    return `${new Intl.NumberFormat('vi-VN').format(price)}₫`;
  };

  const handleUpgrade = async (tierId: string) => {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier || tier.monthlyPrice === 0) {
      if (tierId === 'free') {
        window.location.href = '/dashboard';
      }
      return;
    }

    setProcessingTier(tierId);
    try {
      const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
      const orderCode = Date.now();

      addToast('info', t('pricing.processing_payment'));

      const payment = await createPayment({
        orderCode,
        amount: price,
        description: `${t(tier.nameKey)} - ${billingCycle === 'monthly' ? t('pricing.monthly') : t('pricing.yearly')}`,
        items: [
          {
            name: t(tier.nameKey),
            quantity: 1,
            price,
          },
        ],
        returnUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      setPaymentData(payment);
      setShowPaymentModal(true);
      setSelectedTier(tierId);
      addToast('success', t('pricing.payment_created'));
    } catch (error) {
      console.error('Payment creation failed:', error);
      addToast('error', t('checkout.payment.failed'));
    } finally {
      setProcessingTier(null);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setPaymentData(null);
    // Redirect to success page or dashboard
    window.location.href = '/dashboard/subscription?success=true';
  };

  const handlePaymentFailure = () => {
    setShowPaymentModal(false);
    setPaymentData(null);
    addToast('error', t('checkout.payment.failed'));
  };

  if (!pageLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={t('pricing.page_title')}
        description={t('pricing.page_description')}
        keywords={['pricing', 'subscription', 'wellness', 'health', 'vietnam']}
      />

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
        <div className="max-w-7xl mx-auto">
          {/* Header - Enhanced with gradient text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 rounded-full px-4 py-2 mb-6"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium text-teal-400">
                {t('pricing.save_2_months')}
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tighter bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              {t('pricing.choose_plan')}
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('pricing.subtitle')}
            </p>

            {/* Billing Toggle - Enhanced */}
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <span
                className={`text-sm sm:text-base font-medium transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'text-white text-lg'
                    : 'text-zinc-500'
                }`}
              >
                {t('pricing.monthly')}
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-20 h-9 sm:w-24 sm:h-10 bg-zinc-800 rounded-full transition-all duration-300 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950"
                aria-label={t('pricing.toggle_billing')}
                aria-pressed={billingCycle === 'yearly'}
              >
                <motion.div
                  className="absolute top-1.5 left-1.5 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full shadow-lg"
                  animate={{ x: billingCycle === 'monthly' ? 0 : billingCycle === 'yearly' ? (window.innerWidth >= 640 ? 88 : 56) : 0 }}
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
                {t('pricing.yearly')}
              </span>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-bold text-emerald-400 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-3 py-1.5 rounded-full border border-emerald-400/20 shadow-lg shadow-emerald-500/10"
              >
                {t('pricing.save_2_months')}
              </motion.div>
            </div>
          </motion.div>

          {/* Pricing Cards - Enhanced with better hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
            {tiers.map((tier, index) => {
              const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
              const isProcessing = processingTier === tier.id;
              const originalPrice = billingCycle === 'yearly' ? tier.monthlyPrice * 12 : 0;
              const savings = billingCycle === 'yearly' ? originalPrice - price : 0;

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className={`relative group rounded-[2rem] p-6 sm:p-8 border transition-all duration-300 overflow-hidden ${
                    tier.popular
                      ? 'border-teal-500/50 shadow-teal-500/20 shadow-2xl scale-100 md:scale-105 z-10'
                      : 'border-white/5 hover:border-white/10 hover:shadow-xl'
                  } bg-gradient-to-b from-white/[0.08] to-zinc-900/80 backdrop-blur-sm`}
                >
                  {/* Gradient Glow Effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  />

                  {/* Popular Badge - Enhanced */}
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
                        className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 text-white text-xs font-bold px-5 py-2 rounded-full shadow-lg shadow-teal-500/30 flex items-center gap-1.5"
                      >
                        <Star className="w-3 h-3 fill-white" />
                        {t('pricing.most_popular')}
                        <Star className="w-3 h-3 fill-white" />
                      </motion.span>
                    </div>
                  )}

                  <div className="text-center mb-6 relative z-10">
                    {/* Icon - Enhanced with pulse effect */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                      className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                    >
                      {tier.icon}
                    </motion.div>

                    {/* Name */}
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                      {t(tier.nameKey)}
                    </h3>

                    {/* Price - Enhanced with animated numbers */}
                    <div className="mb-4">
                      <motion.div
                        key={price}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-baseline justify-center gap-1"
                      >
                        {price > 0 && (
                          <span className="text-zinc-500 text-sm font-medium">₫</span>
                        )}
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                          {new Intl.NumberFormat('vi-VN').format(price)}
                        </span>
                      </motion.div>
                      {price > 0 && (
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <span className="text-zinc-500 text-sm">
                            {billingCycle === 'monthly' ? t('pricing.per_month') : t('pricing.per_year')}
                          </span>
                          {billingCycle === 'yearly' && savings > 0 && (
                            <motion.span
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-400/20"
                            >
                              {t('pricing.save')} ₫{new Intl.NumberFormat('vi-VN').format(savings)}
                            </motion.span>
                          )}
                        </div>
                      )}
                      {price === 0 && (
                        <span className="text-zinc-500 text-sm">{t('pricing.forever_free')}</span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-zinc-400 leading-relaxed">{t(tier.descriptionKey)}</p>
                  </div>

                  {/* Features - Enhanced with better spacing */}
                  <ul className="space-y-3 mb-8 relative z-10">
                    {tier.features.map((featureKey, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + i * 0.05 }}
                        className="flex items-start gap-3 group/item"
                      >
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5 rounded-full bg-emerald-400/10 flex items-center justify-center"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </motion.div>
                        <span className="text-sm text-zinc-300 group-hover/item:text-white transition-colors">
                          {t(featureKey)}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA Button - Enhanced */}
                  <motion.button
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={isProcessing || price === 0}
                    whileHover={price === 0 || isProcessing ? {} : { scale: 1.02 }}
                    whileTap={price === 0 || isProcessing ? {} : { scale: 0.98 }}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-300 relative overflow-hidden group ${
                      price === 0
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : isProcessing
                        ? 'bg-zinc-700 text-zinc-400'
                        : `bg-gradient-to-r ${tier.gradient} text-white shadow-lg hover:shadow-xl`
                    }`}
                    aria-label={`${t('pricing.upgrade')} ${t(tier.nameKey)}`}
                    aria-busy={isProcessing}
                  >
                    {isProcessing ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t('pricing.processing')}</span>
                      </motion.div>
                    ) : price === 0 ? (
                      t('pricing.included')
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {t('pricing.upgrade')}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                    {/* Button shine effect */}
                    {price > 0 && !isProcessing && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>

          {/* Feature Comparison Table - Enhanced with responsive design */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16 glass-card rounded-[2rem] p-6 sm:p-8 border border-white/5 overflow-hidden"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
              {t('pricing.feature_comparison')}
            </h2>
            <p className="text-zinc-400 text-center mb-8 text-sm sm:text-base">
              {t('pricing.comparison_subtitle')}
            </p>

            {/* Mobile: Card-based comparison */}
            <div className="lg:hidden space-y-4">
              {tiers.map((tier, tierIndex) => (
                <div
                  key={tier.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white`}>
                      {tier.icon}
                    </div>
                    <span className="font-bold text-white">{t(tier.nameKey)}</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'table_dashboard', levels: [true, true, true] },
                      { key: 'table_marketplace', levels: [true, true, true] },
                      { key: 'table_analytics_basic', levels: [true, true, true] },
                      { key: 'table_analytics_advanced', levels: [false, true, true] },
                      { key: 'table_ai_copilot', levels: [false, true, true] },
                      { key: 'table_health_coach', levels: [false, true, true] },
                      { key: 'table_priority_support', levels: [false, true, true] },
                      { key: 'table_team_management', levels: [false, true, true] },
                      { key: 'table_commission_tracking', levels: [false, true, true] },
                      { key: 'table_referral_program', levels: [false, true, true] },
                      { key: 'table_export_data', levels: [false, false, true] },
                      { key: 'table_custom_reports', levels: [false, false, true] },
                      { key: 'table_white_label', levels: [false, false, true] },
                      { key: 'table_api_access', levels: [false, false, true] },
                    ].map((feature) => (
                      <div
                        key={feature.key}
                        className={`flex items-center justify-between text-sm ${
                          feature.levels[tierIndex] ? 'text-zinc-300' : 'text-zinc-600'
                        }`}
                      >
                        <span>{t(`pricing.features.${feature.key}`)}</span>
                        {feature.levels[tierIndex] ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table comparison */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-zinc-400 font-medium text-sm sticky left-0 bg-zinc-900">
                      {t('pricing.feature')}
                    </th>
                    {tiers.map((tier) => (
                      <th key={tier.id} className="text-center py-4 px-2 min-w-[120px]">
                        <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white shadow-lg`}>
                          {tier.icon}
                        </div>
                        <p className="text-sm font-bold text-white mt-2">
                          {t(tier.nameKey)}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'table_dashboard', levels: [true, true, true] },
                    { key: 'table_marketplace', levels: [true, true, true] },
                    { key: 'table_analytics_basic', levels: [true, true, true] },
                    { key: 'table_analytics_advanced', levels: [false, true, true] },
                    { key: 'table_ai_copilot', levels: [false, true, true] },
                    { key: 'table_health_coach', levels: [false, true, true] },
                    { key: 'table_priority_support', levels: [false, true, true] },
                    { key: 'table_team_management', levels: [false, true, true] },
                    { key: 'table_commission_tracking', levels: [false, true, true] },
                    { key: 'table_referral_program', levels: [false, true, true] },
                    { key: 'table_export_data', levels: [false, false, true] },
                    { key: 'table_custom_reports', levels: [false, false, true] },
                    { key: 'table_white_label', levels: [false, false, true] },
                    { key: 'table_api_access', levels: [false, false, true] },
                  ].map((feature, i) => (
                    <motion.tr
                      key={feature.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.03 }}
                      className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                        i % 2 === 0 ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className="py-4 px-4 text-sm text-zinc-300 sticky left-0 bg-zinc-900">
                        {t(`pricing.features.${feature.key}`)}
                      </td>
                      {feature.levels.map((included, j) => (
                        <td key={j} className="text-center py-4 px-2">
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: included ? 1 : 0 }}
                            transition={{ delay: 0.6 + j * 0.1 }}
                            className="inline-block w-6 h-6"
                          >
                            {included ? (
                              <Check className="w-6 h-6 text-emerald-400" />
                            ) : (
                              <span className="text-zinc-700 text-xl">—</span>
                            )}
                          </motion.span>
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Testimonials Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
              {t('pricing.testimonials.title')}
            </h2>
            <p className="text-zinc-400 text-center mb-8">{t('pricing.testimonials.subtitle')}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="glass-card rounded-2xl p-6 border border-white/5 relative"
                >
                  {/* Quote Icon */}
                  <div className="absolute top-4 right-4 text-6xl text-teal-500/10 font-serif">"</div>

                  {/* Rating Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-sm text-zinc-300 mb-4 italic leading-relaxed">
                    {testimonial.content}
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{testimonial.avatar}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{testimonial.name}</p>
                      <p className="text-xs text-zinc-500">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
          >
            {[
              { icon: Shield, key: 'secure_payment' },
              { icon: RefreshCcw, key: 'money_back' },
              { icon: Headphones, key: 'support_24_7' },
              { icon: Clock, key: 'cancel_anytime' },
            ].map((item, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 border border-white/5 text-center">
                <item.icon className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-zinc-300">{t(`pricing.trust.${item.key}`)}</p>
              </div>
            ))}
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
              {t('pricing.faq_title')}
            </h2>
            <p className="text-zinc-400 text-center mb-8">{t('pricing.faq_subtitle')}</p>

            <div className="space-y-4 max-w-3xl mx-auto">
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="glass-card rounded-2xl border border-white/5 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="font-semibold text-white pr-4">
                        {t(item.questionKey)}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-teal-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                      )}
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-4 text-zinc-400 text-sm leading-relaxed">
                        {t(item.answerKey)}
                      </p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center glass-card rounded-[2rem] p-8 border border-white/5"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {t('pricing.cta_bottom.title')}
            </h2>
            <p className="text-zinc-400 mb-6">{t('pricing.cta_bottom.subtitle')}</p>
            <button
              onClick={() => handleUpgrade('free')}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-teal-500/20 transition-all hover:scale-105"
            >
              {t('pricing.cta_bottom.get_started')}
            </button>
          </motion.div>
        </div>
      </div>

      {/* PayOS QR Modal */}
      <QRPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentData={paymentData}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
      />
    </>
  );
};

export default PricingPage;
