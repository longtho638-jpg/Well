 
/**
 * WellNexus Subscription Service
 * Quản lý subscription plans và user subscriptions cho RaaS model.
 */

import { supabase as supabaseClient } from '@/lib/supabase';
import type { SupabaseLike } from '@/lib/vibe-supabase/typed-query-helpers';
import { canAccessFeature, computeActivationParams } from '@/lib/vibe-subscription';
import type {
    SubscriptionPlan, UserSubscription, ActivePlanInfo, Organization, OrgMember,
    FeatureGateConfig, UsageRecord, UsageSummary, UsageQuota,
} from '@/lib/vibe-subscription';
import {
    getUserOrgs, getOrgMembers, createOrg, getOrgActivePlan, getOrgSubscription,
    getPlans, getUserActivePlan, getUserSubscription, createSubscription,
    cancelSubscription, createSubscriptionIntent, trackFeatureUsage,
    getOrgUsageSummary, checkOrgQuota,
} from '@/lib/vibe-supabase';

const supabase = supabaseClient as unknown as SupabaseLike;
export type { SubscriptionPlan, UserSubscription, ActivePlanInfo, Organization, OrgMember, UsageRecord, UsageSummary, UsageQuota };

const WELL_FEATURE_GATE: FeatureGateConfig = {
    planHierarchy: ['free', 'basic', 'pro', 'agency'],
    featureMinPlan: {
        dashboard: 'free', marketplace: 'free', basic_commission: 'free',
        withdrawal: 'basic', health_coach: 'basic', ai_copilot: 'pro',
        advanced_analytics: 'pro', white_label: 'agency', api_access: 'agency',
    },
    defaultMinPlan: 'pro',
};

export const subscriptionService = {
    async getPlans(): Promise<SubscriptionPlan[]> { return getPlans(supabase); },
    async getActivePlan(userId: string): Promise<ActivePlanInfo | null> { return getUserActivePlan(supabase, userId); },
    async getUserSubscription(userId: string): Promise<UserSubscription | null> { return getUserSubscription(supabase, userId); },
    async getOrgActivePlan(orgId: string): Promise<ActivePlanInfo | null> { return getOrgActivePlan(supabase, orgId); },
    async getOrgSubscription(orgId: string): Promise<UserSubscription | null> { return getOrgSubscription(supabase, orgId); },
    async getUserOrgs(userId: string): Promise<Organization[]> { return getUserOrgs(supabase, userId); },
    async getOrgMembers(orgId: string): Promise<OrgMember[]> { return getOrgMembers(supabase, orgId); },
    async createOrg(params: { name: string; slug: string; ownerId: string }): Promise<Organization> { return createOrg(supabase, params); },

    async createSubscription(params: { userId: string; planId: string; billingCycle: 'monthly' | 'yearly'; payosOrderCode: number; orgId?: string }): Promise<UserSubscription> {
        const activation = computeActivationParams({ userId: params.userId, planId: params.planId, billingCycle: params.billingCycle, orgId: params.orgId });
        return createSubscription(supabase, { ...activation.data, payos_order_code: params.payosOrderCode });
    },

    async cancelSubscription(subscriptionId: string): Promise<void> { return cancelSubscription(supabase, subscriptionId); },

    async canAccessFeature(userId: string, feature: string): Promise<boolean> {
        const activePlan = await this.getActivePlan(userId);
        if (!activePlan) return false;
        return canAccessFeature(activePlan.plan_slug, feature, WELL_FEATURE_GATE);
    },

    async createSubscriptionIntent(params: { userId: string; planId: string; billingCycle: 'monthly' | 'yearly'; orgId?: string }): Promise<{ checkoutUrl: string; orderCode: number }> {
        return createSubscriptionIntent(supabase, { planId: params.planId, billingCycle: params.billingCycle, returnUrl: `${window.location.origin}/dashboard/subscription?status=success`, cancelUrl: `${window.location.origin}/dashboard/subscription?status=canceled`, orgId: params.orgId });
    },

    async trackUsage(params: { orgId: string; userId: string; feature: string; quantity?: number; metadata?: Record<string, unknown> }): Promise<UsageRecord> { return trackFeatureUsage(supabase, params); },
    async getOrgUsage(orgId: string, periodStart: string, periodEnd: string): Promise<UsageSummary[]> { return getOrgUsageSummary(supabase, orgId, periodStart, periodEnd); },
    async checkQuota(orgId: string, feature: string, planLimit: number, periodStart: string, periodEnd: string): Promise<UsageQuota> { return checkOrgQuota(supabase, orgId, feature, planLimit, periodStart, periodEnd); },

    async renewSubscription(params: { subscriptionId: string; extendsMonths: number; payosOrderCode: number }): Promise<UserSubscription> {
        if (!params.extendsMonths || params.extendsMonths <= 0) throw new Error('extendsMonths must be a positive number');
        const { data, error } = await supabase.from('user_subscriptions').select('*').eq('id', params.subscriptionId).single();
        if (error || !data) throw new Error('Subscription not found');
        const subscription = data as UserSubscription & { end_date?: string | null; metadata?: Record<string, unknown> | null };
        if (!subscription.end_date) throw new Error('Subscription end_date is missing');
        const currentEnd = new Date(subscription.end_date);
        const newEnd = new Date(currentEnd);
        newEnd.setMonth(newEnd.getMonth() + params.extendsMonths);
        if (newEnd.getMonth() !== (currentEnd.getMonth() + params.extendsMonths) % 12) newEnd.setDate(0);
        const currentMetadata = subscription.metadata || {};
        const { data: updated, error: updateError } = await supabase.from('user_subscriptions').update({ end_date: newEnd.toISOString(), status: 'active', metadata: { ...currentMetadata, lastRenewalDate: new Date().toISOString(), renewalOrderCode: params.payosOrderCode } }).eq('id', params.subscriptionId).select().single();
        if (updateError) throw new Error('Failed to renew subscription');
        return updated as UserSubscription;
    },

    async activateLicenseOnRenewal(params: { userId: string; subscriptionId: string; features: Record<string, boolean>; expiresAt: string }): Promise<{ success: boolean; licenseId?: string }> {
        const { data: existing } = await supabase.from('raas_licenses').select('id').eq('user_id', params.userId).eq('status', 'active').single();
        if (existing) {
            const { error } = await supabase.from('raas_licenses').update({ expires_at: params.expiresAt, features: params.features, metadata: { renewed_at: new Date().toISOString(), subscription_id: params.subscriptionId } }).eq('id', (existing as { id: string }).id);
            return { success: !error, licenseId: (existing as { id: string }).id };
        }
        const { data: newLicense, error } = await supabase.from('raas_licenses').insert({ user_id: params.userId, license_key: `RAAS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, status: 'active', features: params.features, expires_at: params.expiresAt, metadata: { created_via: 'subscription_renewal', subscription_id: params.subscriptionId } }).select().single();
        return { success: !error, licenseId: (newLicense as { id?: string })?.id };
    },
};
