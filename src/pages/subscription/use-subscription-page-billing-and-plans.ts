/**
 * use-subscription-page-billing-and-plans — billing cycle state, plan fetch, subscribe/cancel handlers, and plan display constants for SubscriptionPage
 */

import React from 'react';
import { Crown, Zap, Shield, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks';
import { useStore } from '@/store';
import type { SubscriptionPlan } from '@/services/subscription-service';

export const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: React.createElement(Users, { className: 'w-6 h-6' }),
  basic: React.createElement(Zap, { className: 'w-6 h-6' }),
  pro: React.createElement(Shield, { className: 'w-6 h-6' }),
  agency: React.createElement(Crown, { className: 'w-6 h-6' }),
};

export const PLAN_COLORS: Record<string, string> = {
  free: 'from-zinc-600 to-zinc-700',
  basic: 'from-blue-600 to-blue-700',
  pro: 'from-emerald-600 to-emerald-700',
  agency: 'from-amber-500 to-amber-600',
};

export const FEATURE_KEYS: Record<string, string> = {
  dashboard: 'subscription.features.dashboard',
  marketplace: 'subscription.features.marketplace',
  basic_commission: 'subscription.features.basic_commission',
  commission: 'subscription.features.commission',
  withdrawal: 'subscription.features.withdrawal',
  health_coach: 'subscription.features.health_coach',
  all_features: 'subscription.features.all_features',
  ai_copilot: 'subscription.features.ai_copilot',
  advanced_analytics: 'subscription.features.advanced_analytics',
  priority_support: 'subscription.features.priority_support',
  white_label: 'subscription.features.white_label',
  multi_network: 'subscription.features.multi_network',
  api_access: 'subscription.features.api_access',
  dedicated_support: 'subscription.features.dedicated_support',
};

export function featureLabel(feature: string, t: (key: string) => string): string {
  const key = FEATURE_KEYS[feature];
  return key ? t(key) : feature;
}

export function useSubscriptionPageBillingAndPlans() {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const {
    plans,
    activePlan,
    currentSubscription,
    subscriptionLoading,
    subscriptionError,
    fetchPlans,
    fetchActivePlan,
    subscribeToPlan,
    cancelCurrentSubscription,
    user,
  } = useStore();

  useEffect(() => {
    fetchPlans();
    if (user?.id) {
      fetchActivePlan(user.id);
    }
  }, [fetchPlans, fetchActivePlan, user?.id]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!user?.id || plan.slug === 'free') return;
    if (activePlan?.plan_slug === plan.slug) return;

    try {
      setUpgrading(plan.id);
      const { checkoutUrl } = await subscribeToPlan({
        userId: user.id,
        planId: plan.id,
        billingCycle,
      });
      window.location.href = checkoutUrl;
    } catch {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm(t('subscription.cancel_confirm'))) return;
    await cancelCurrentSubscription();
  };

  const formatPrice = (amount: number) => {
    if (amount === 0) return t('subscription.free');
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const planHierarchy = ['free', 'basic', 'pro', 'agency'];
  const currentPlanIndex = activePlan
    ? planHierarchy.indexOf(activePlan.plan_slug)
    : -1;

  return {
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
  };
}
