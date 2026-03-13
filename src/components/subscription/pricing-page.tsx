/**
 * PricingPage - 3-tier subscription pricing with monthly/yearly toggle
 * Aura Elite design: Glassmorphism cards, amber/orange gradients, clean typography
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Users } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface PricingTier {
  id: string;
  name: string;
  nameKey: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  icon: React.ReactNode;
  gradient: string;
  popular?: boolean;
}

export interface PricingPageProps {
  currentPlan?: string;
  onUpgrade: (planId: string, billingCycle: 'monthly' | 'yearly') => void;
  upgrading?: string | null;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  currentPlan = 'free',
  onUpgrade,
  upgrading = null,
}) => {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const tiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      nameKey: 'pricing.free_name',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: t('pricing.free_description'),
      features: [
        t('pricing.features.basic_dashboard'),
        t('pricing.features.marketplace_access'),
        t('pricing.features.basic_support'),
      ],
      icon: React.createElement(Users, { className: 'w-8 h-8' }),
      gradient: 'from-zinc-600 to-zinc-700',
    },
    {
      id: 'pro',
      name: 'Pro',
      nameKey: 'pricing.pro_name',
      monthlyPrice: 299000,
      yearlyPrice: 299000 * 10, // Save 2 months
      description: t('pricing.pro_description'),
      features: [
        t('pricing.features.everything_in_free'),
        t('pricing.features.advanced_analytics'),
        t('pricing.features.ai_copilot'),
        t('pricing.features.priority_support'),
        t('pricing.features.health_coach'),
      ],
      icon: React.createElement(Zap, { className: 'w-8 h-8' }),
      gradient: 'from-amber-500 to-orange-600',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      nameKey: 'pricing.enterprise_name',
      monthlyPrice: 999000,
      yearlyPrice: 999000 * 10, // Save 2 months
      description: t('pricing.enterprise_description'),
      features: [
        t('pricing.features.everything_in_pro'),
        t('pricing.features.white_label'),
        t('pricing.features.multi_network'),
        t('pricing.features.api_access'),
        t('pricing.features.dedicated_support'),
        t('pricing.features.custom_integrations'),
      ],
      icon: React.createElement(Crown, { className: 'w-8 h-8' }),
      gradient: 'from-purple-600 to-indigo-700',
    },
  ];

  const formatPrice = (price: number) => {
    if (price === 0) return t('pricing.free_name');
    return `${new Intl.NumberFormat('vi-VN').format(price)}₫`;
  };

  const calculateSavings = (monthly: number, yearly: number) => {
    const monthlyTotal = monthly * 12;
    return monthlyTotal - yearly;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">
            {t('pricing.choose_plan')}
          </h1>
          <p className="text-xl text-zinc-400 mb-8">
            {t('pricing.subtitle')}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium ${
                billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500'
              }`}
            >
              {t('pricing.monthly')}
            </span>
            <button
              onClick={() =>
                setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')
              }
              className="relative w-16 h-8 bg-zinc-700 rounded-full transition-colors hover:bg-zinc-600"
              aria-label={t('pricing.toggle_billing')}
            >
              <motion.div
                className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg"
                animate={{ x: billingCycle === 'monthly' ? 0 : 32 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                billingCycle === 'yearly' ? 'text-white' : 'text-zinc-500'
              }`}
            >
              {t('pricing.yearly')}
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
              {t('pricing.save_2_months')}
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => {
            const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
            const isCurrentPlan = currentPlan === tier.id;
            const isUpgrading = upgrading === tier.id;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative glass-card rounded-[2rem] p-8 border transition-all duration-300 ${
                  tier.popular
                    ? 'border-amber-500/50 shadow-amber-500/20 shadow-2xl scale-105'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      {t('pricing.most_popular')}
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute top-4 right-4">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                      {t('pricing.current_plan')}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white shadow-lg`}
                  >
                    {tier.icon}
                  </div>

                  {/* Name */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {t(tier.nameKey)}
                  </h3>

                  {/* Price */}
                  <div className="mb-2">
                    <span className="text-4xl font-black text-white tracking-tighter">
                      {formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-zinc-500 ml-2">
                        {billingCycle === 'monthly'
                          ? t('pricing.per_month')
                          : t('pricing.per_year')}
                      </span>
                    )}
                  </div>

                  {/* Savings for yearly */}
                  {billingCycle === 'yearly' && price > 0 && (
                    <p className="text-sm text-emerald-400 font-medium">
                      {t('pricing.save')} {formatPrice(calculateSavings(tier.monthlyPrice * 12, tier.yearlyPrice))}
                    </p>
                  )}

                  {/* Description */}
                  <p className="text-sm text-zinc-400 mt-4">{tier.description}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => !isCurrentPlan && onUpgrade(tier.id, billingCycle)}
                  disabled={isCurrentPlan || isUpgrading}
                  className={`w-full py-4 rounded-xl font-bold transition-all duration-200 ${
                    isCurrentPlan
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : isUpgrading
                      ? 'bg-zinc-700 text-zinc-400 animate-pulse'
                      : `bg-gradient-to-r ${tier.gradient} text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`
                  }`}
                >
                  {isCurrentPlan
                    ? t('pricing.current_plan')
                    : isUpgrading
                    ? t('pricing.processing')
                    : t('pricing.upgrade')}
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
          className="mt-16 glass-card rounded-[2rem] p-8 border border-white/5"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            {t('pricing.feature_comparison')}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-zinc-400 font-medium">
                    {t('pricing.feature')}
                  </th>
                  {tiers.map((tier) => (
                    <th key={tier.id} className="text-center py-4 px-4">
                      <div
                        className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white`}
                      >
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
                  { key: 'dashboard', levels: [true, true, true] },
                  { key: 'marketplace', levels: [true, true, true] },
                  { key: 'analytics_basic', levels: [true, true, true] },
                  { key: 'analytics_advanced', levels: [false, true, true] },
                  { key: 'ai_copilot', levels: [false, true, true] },
                  { key: 'health_coach', levels: [false, true, true] },
                  { key: 'priority_support', levels: [false, true, true] },
                  { key: 'white_label', levels: [false, false, true] },
                  { key: 'multi_network', levels: [false, false, true] },
                  { key: 'api_access', levels: [false, false, true] },
                  { key: 'dedicated_support', levels: [false, false, true] },
                ].map((feature, i) => (
                  <tr
                    key={feature.key}
                    className={`border-b border-white/5 ${
                      i % 2 === 0 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <td className="py-4 px-4 text-zinc-300">
                      {t(`pricing.features.${feature.key}`)}
                    </td>
                    {feature.levels.map((included, j) => (
                      <td key={j} className="text-center py-4 px-4">
                        {included ? (
                          <Check className="w-6 h-6 text-emerald-400 mx-auto" />
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
      </div>
    </div>
  );
};

export default PricingPage;

// Export props type for index.ts
export interface PricingPageProps {
  currentPlan?: string;
  onUpgrade: (planId: string, billingCycle: 'monthly' | 'yearly') => void;
  upgrading?: string | null;
}
