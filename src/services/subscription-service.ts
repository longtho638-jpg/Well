/**
 * WellNexus Subscription Service
 * Quản lý subscription plans và user subscriptions cho RaaS model.
 * Hỗ trợ multi-org: mỗi org có subscription riêng.
 */

import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubscriptionPlan {
    id: string;
    slug: 'free' | 'basic' | 'pro' | 'agency';
    name: string;
    price_monthly: number;
    price_yearly: number;
    max_members: number;
    features: string[];
    is_active: boolean;
    sort_order: number;
}

export interface UserSubscription {
    id: string;
    user_id: string;
    plan_id: string;
    org_id: string | null;
    status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'expired';
    billing_cycle: 'monthly' | 'yearly';
    started_at: string;
    current_period_end: string;
    canceled_at: string | null;
    payos_order_code: number | null;
    last_payment_at: string | null;
    next_payment_at: string | null;
}

export interface ActivePlanInfo {
    plan_slug: string;
    plan_name: string;
    status: string;
    period_end: string;
    max_members: number;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    logo_url: string | null;
    is_active: boolean;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface OrgMember {
    id: string;
    org_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    joined_at: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

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
        const { userId, planId, billingCycle, payosOrderCode, orgId } = params;

        const periodEnd = new Date();
        if (billingCycle === 'monthly') {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        const { data, error } = await supabase
            .from('user_subscriptions')
            .insert({
                user_id: userId,
                plan_id: planId,
                billing_cycle: billingCycle,
                status: 'active',
                current_period_end: periodEnd.toISOString(),
                payos_order_code: payosOrderCode,
                last_payment_at: new Date().toISOString(),
                next_payment_at: periodEnd.toISOString(),
                org_id: orgId ?? null,
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

        const planHierarchy = ['free', 'basic', 'pro', 'agency'];
        const userPlanIndex = planHierarchy.indexOf(activePlan.plan_slug);

        const featureMinPlan: Record<string, string> = {
            dashboard: 'free',
            marketplace: 'free',
            basic_commission: 'free',
            withdrawal: 'basic',
            health_coach: 'basic',
            ai_copilot: 'pro',
            advanced_analytics: 'pro',
            white_label: 'agency',
            api_access: 'agency',
        };

        const requiredPlan = featureMinPlan[feature] ?? 'pro';
        const requiredIndex = planHierarchy.indexOf(requiredPlan);
        return userPlanIndex >= requiredIndex;
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
