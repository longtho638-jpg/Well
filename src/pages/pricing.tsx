/**
 * Pricing Landing Page - WellNexus
 * 3-tier subscription pricing with FAQ and PayOS checkout
 * Aura Elite design: Glassmorphism, dark gradients, teal accents
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Users, ChevronDown, ChevronUp, Shield, Clock, Headphones, RefreshCcw } from 'lucide-react';
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

const PricingPage: React.FC = () => {
  const { t, lang } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [processingTier, setProcessingTier] = useState<string | null>(null);

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
    if (!tier || tier.monthlyPrice === 0) return;

    setProcessingTier(tierId);
    try {
      const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
      const orderCode = Date.now();

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
    } catch (error) {
      console.error('Payment creation failed:', error);
      alert(t('checkout.payment.failed'));
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
  };

  return (
    <>
      <SEOHead
        title={t('pricing.page_title')}
        description={t('pricing.page_description')}
        keywords={['pricing', 'subscription', 'wellness', 'health', 'vietnam']}
      />

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter">
              {t('pricing.choose_plan')}
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500'}`}>
                {t('pricing.monthly')}
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-16 h-8 bg-zinc-700 rounded-full transition-colors hover:bg-zinc-600"
                aria-label={t('pricing.toggle_billing')}
              >
                <motion.div
                  className="absolute top-1 left-1 w-6 h-6 bg-teal-500 rounded-full shadow-lg"
                  animate={{ x: billingCycle === 'monthly' ? 0 : 32 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
              <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-zinc-500'}`}>
                {t('pricing.yearly')}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                {t('pricing.save_2_months')}
              </span>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
            {tiers.map((tier, index) => {
              const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
              const isProcessing = processingTier === tier.id;

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative glass-card rounded-[2rem] p-6 sm:p-8 border transition-all duration-300 ${
                    tier.popular
                      ? 'border-teal-500/50 shadow-teal-500/20 shadow-2xl scale-105'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Popular Badge */}
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                        {t('pricing.most_popular')}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    {/* Icon */}
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white shadow-lg`}>
                      {tier.icon}
                    </div>

                    {/* Name */}
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                      {t(tier.nameKey)}
                    </h3>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
                        {formatPrice(price)}
                      </span>
                      {price > 0 && (
                        <span className="text-zinc-500 ml-2 text-sm">
                          {billingCycle === 'monthly' ? t('pricing.per_month') : t('pricing.per_year')}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-zinc-400">{t(tier.descriptionKey)}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((featureKey, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-300">{t(featureKey)}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={isProcessing || price === 0}
                    className={`w-full py-4 rounded-xl font-bold transition-all duration-200 ${
                      price === 0
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : isProcessing
                        ? 'bg-zinc-700 text-zinc-400 animate-pulse'
                        : `bg-gradient-to-r ${tier.gradient} text-white hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98]`
                    }`}
                  >
                    {isProcessing ? t('pricing.processing') : price === 0 ? t('pricing.included') : t('pricing.upgrade')}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16 glass-card rounded-[2rem] p-6 sm:p-8 border border-white/5 overflow-hidden"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">
              {t('pricing.feature_comparison')}
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-zinc-400 font-medium text-sm">
                      {t('pricing.feature')}
                    </th>
                    {tiers.map((tier) => (
                      <th key={tier.id} className="text-center py-4 px-2">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white`}>
                          {tier.icon}
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white mt-2">
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
                    <tr key={feature.key} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                      <td className="py-4 px-4 text-sm text-zinc-300">
                        {t(`pricing.features.${feature.key}`)}
                      </td>
                      {feature.levels.map((included, j) => (
                        <td key={j} className="text-center py-4 px-2">
                          {included ? (
                            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mx-auto" />
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
