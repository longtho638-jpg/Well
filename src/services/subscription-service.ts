/**
 * WellNexus Subscription Service
 * Quản lý subscription plans và user subscriptions cho RaaS model.
 * Hỗ trợ multi-org: mỗi org có subscription riêng.
 *
 * All Supabase queries delegated to vibe-supabase SDK.
 * Pure logic imported from vibe-subscription SDK.
 */

import { supabase } from '@/lib/supabase';
import { canAccessFeature, computeActivationParams } from '@/lib/vibe-subscription';
import type {
    SubscriptionPlan,
    UserSubscription,
    ActivePlanInfo,
    Organization,
    OrgMember,
    FeatureGateConfig,
} from '@/lib/vibe-subscription';
import {
    getUserOrgs as _getUserOrgs,
    getOrgMembers as _getOrgMembers,
    createOrg as _createOrg,
    getOrgActivePlan as _getOrgActivePlan,
    getOrgSubscription as _getOrgSubscription,
    getPlans as _getPlans,
    getUserActivePlan as _getUserActivePlan,
    getUserSubscription as _getUserSubscription,
    createSubscription as _createSubscription,
    cancelSubscription as _cancelSubscription,
    createSubscriptionIntent as _createSubscriptionIntent,
} from '@/lib/vibe-supabase';

// Re-export types so existing consumers don't break
export type { SubscriptionPlan, UserSubscription, ActivePlanInfo, Organization, OrgMember };

// ─── Well-specific feature gate config ──────────────────────────

const WELL_FEATURE_GATE: FeatureGateConfig = {
    planHierarchy: ['free', 'basic', 'pro', 'agency'],
    featureMinPlan: {
        dashboard: 'free',
        marketplace: 'free',
        basic_commission: 'free',
        withdrawal: 'basic',
        health_coach: 'basic',
        ai_copilot: 'pro',
        advanced_analytics: 'pro',
        white_label: 'agency',
        api_access: 'agency',
    },
    defaultMinPlan: 'pro',
};

// ─── Service ────────────────────────────────────────────────────

export const subscriptionService = {
    // ── Plan queries (delegates to vibe-supabase SDK) ────────────────

    async getPlans(): Promise<SubscriptionPlan[]> {
        return _getPlans(supabase);
    },

    // ── User-level subscription (delegates to vibe-supabase SDK) ─────

    async getActivePlan(userId: string): Promise<ActivePlanInfo | null> {
        return _getUserActivePlan(supabase, userId);
    },

    async getUserSubscription(userId: string): Promise<UserSubscription | null> {
        return _getUserSubscription(supabase, userId);
    },

    async createSubscription(params: {
        userId: string;
        planId: string;
        billingCycle: 'monthly' | 'yearly';
        payosOrderCode: number;
        orgId?: string;
    }): Promise<UserSubscription> {
        const activation = computeActivationParams({
            userId: params.userId,
            planId: params.planId,
            billingCycle: params.billingCycle,
            orgId: params.orgId,
        });

        return _createSubscription(supabase, {
            ...activation.data,
            payos_order_code: params.payosOrderCode,
        });
    },

    async cancelSubscription(subscriptionId: string): Promise<void> {
        return _cancelSubscription(supabase, subscriptionId);
    },

    async canAccessFeature(userId: string, feature: string): Promise<boolean> {
        const activePlan = await this.getActivePlan(userId);
        if (!activePlan) return false;
        return canAccessFeature(activePlan.plan_slug, feature, WELL_FEATURE_GATE);
    },

    // ── Org-level subscription (delegates to vibe-supabase SDK) ────

    async getOrgActivePlan(orgId: string): Promise<ActivePlanInfo | null> {
        return _getOrgActivePlan(supabase, orgId);
    },

    async getOrgSubscription(orgId: string): Promise<UserSubscription | null> {
        return _getOrgSubscription(supabase, orgId);
    },

    // ── Organization CRUD (delegates to vibe-supabase SDK) ─────────

    async getUserOrgs(userId: string): Promise<Organization[]> {
        return _getUserOrgs(supabase, userId);
    },

    async getOrgMembers(orgId: string): Promise<OrgMember[]> {
        return _getOrgMembers(supabase, orgId);
    },

    async createOrg(params: { name: string; slug: string; ownerId: string }): Promise<Organization> {
        return _createOrg(supabase, params);
    },

    // ── Subscription payment intent (delegates to vibe-supabase SDK) ─

    async createSubscriptionIntent(params: {
        userId: string;
        planId: string;
        billingCycle: 'monthly' | 'yearly';
        orgId?: string;
    }): Promise<{ checkoutUrl: string; orderCode: number }> {
        return _createSubscriptionIntent(supabase, {
            planId: params.planId,
            billingCycle: params.billingCycle,
            returnUrl: `${window.location.origin}/dashboard/subscription?status=success`,
            cancelUrl: `${window.location.origin}/dashboard/subscription?status=canceled`,
            orgId: params.orgId,
        });
    },
};
