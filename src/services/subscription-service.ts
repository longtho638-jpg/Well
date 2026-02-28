/**
 * WellNexus Subscription Service
 * Quản lý subscription plans và user subscriptions cho RaaS model.
 * Hỗ trợ multi-org: mỗi org có subscription riêng.
 *
 * Types & pure logic imported from vibe-subscription SDK.
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
    // ── Plan queries ───────────────────────────────────────────────

    async getPlans(): Promise<SubscriptionPlan[]> {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        if (error) throw error;
        return data as SubscriptionPlan[];
    },

    // ── User-level subscription ────────────────────────────────────

    async getActivePlan(userId: string): Promise<ActivePlanInfo | null> {
        const { data, error } = await supabase
            .rpc('get_user_active_plan', { p_user_id: userId });

        if (error) throw error;
        return (data as ActivePlanInfo[])?.[0] ?? null;
    },

    async getUserSubscription(userId: string): Promise<UserSubscription | null> {
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])
            .gt('current_period_end', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data as UserSubscription | null;
    },

    async createSubscription(params: {
        userId: string;
        planId: string;
        billingCycle: 'monthly' | 'yearly';
        payosOrderCode: number;
        orgId?: string;
    }): Promise<UserSubscription> {
        // Use SDK to compute activation params (period end, status)
        const activation = computeActivationParams({
            userId: params.userId,
            planId: params.planId,
            billingCycle: params.billingCycle,
            orgId: params.orgId,
        });

        const { data, error } = await supabase
            .from('user_subscriptions')
            .insert({
                ...activation.data,
                payos_order_code: params.payosOrderCode,
            })
            .select()
            .single();

        if (error) throw error;
        return data as UserSubscription;
    },

    async cancelSubscription(subscriptionId: string): Promise<void> {
        const { error } = await supabase
            .from('user_subscriptions')
            .update({
                status: 'canceled',
                canceled_at: new Date().toISOString(),
            })
            .eq('id', subscriptionId);

        if (error) throw error;
    },

    async canAccessFeature(userId: string, feature: string): Promise<boolean> {
        const activePlan = await this.getActivePlan(userId);
        if (!activePlan) return false;
        return canAccessFeature(activePlan.plan_slug, feature, WELL_FEATURE_GATE);
    },

    // ── Org-level subscription ─────────────────────────────────────

    async getOrgActivePlan(orgId: string): Promise<ActivePlanInfo | null> {
        const { data, error } = await supabase
            .rpc('get_org_active_plan', { p_org_id: orgId });

        if (error) throw error;
        return (data as ActivePlanInfo[])?.[0] ?? null;
    },

    async getOrgSubscription(orgId: string): Promise<UserSubscription | null> {
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('org_id', orgId)
            .in('status', ['active', 'trialing'])
            .gt('current_period_end', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data as UserSubscription | null;
    },

    // ── Organization CRUD ──────────────────────────────────────────

    async getUserOrgs(userId: string): Promise<Organization[]> {
        const { data, error } = await supabase
            .from('org_members')
            .select('org_id, role, organizations(*)')
            .eq('user_id', userId);

        if (error) throw error;
        return (data ?? [])
            .map((m) => (m.organizations as unknown) as Organization)
            .filter(Boolean);
    },

    async getOrgMembers(orgId: string): Promise<OrgMember[]> {
        const { data, error } = await supabase
            .from('org_members')
            .select('*')
            .eq('org_id', orgId);

        if (error) throw error;
        return data as OrgMember[];
    },

    async createOrg(params: { name: string; slug: string; ownerId: string }): Promise<Organization> {
        const { data, error } = await supabase
            .from('organizations')
            .insert({
                name: params.name,
                slug: params.slug,
                owner_id: params.ownerId,
            })
            .select()
            .single();

        if (error) throw error;

        // Auto-add owner as org member
        await supabase.from('org_members').insert({
            org_id: data.id,
            user_id: params.ownerId,
            role: 'owner',
        });

        return data as Organization;
    },

    // ── Subscription payment intent (for PayOS checkout) ───────────

    async createSubscriptionIntent(params: {
        userId: string;
        planId: string;
        billingCycle: 'monthly' | 'yearly';
        orgId?: string;
    }): Promise<{ checkoutUrl: string; orderCode: number }> {
        const { data, error } = await supabase.functions.invoke('payos-create-subscription', {
            body: {
                planId: params.planId,
                billingCycle: params.billingCycle,
                returnUrl: `${window.location.origin}/dashboard/subscription?status=success`,
                cancelUrl: `${window.location.origin}/dashboard/subscription?status=canceled`,
                orgId: params.orgId,
            },
        });

        if (error) throw error;
        return { checkoutUrl: data.checkoutUrl, orderCode: data.orderCode };
    },
};
