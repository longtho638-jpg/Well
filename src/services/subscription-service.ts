/**
 * WellNexus Subscription Service
 * Quản lý subscription plans và user subscriptions cho RaaS model.
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

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const subscriptionService = {
    /**
     * Lấy tất cả plans đang active, sắp xếp theo sort_order
     */
    async getPlans(): Promise<SubscriptionPlan[]> {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        if (error) throw error;
        return data as SubscriptionPlan[];
    },

    /**
     * Lấy plan đang active của user (dùng DB function)
     */
    async getActivePlan(userId: string): Promise<ActivePlanInfo | null> {
        const { data, error } = await supabase
            .rpc('get_user_active_plan', { p_user_id: userId });

        if (error) throw error;
        return (data as ActivePlanInfo[])?.[0] ?? null;
    },

    /**
     * Lấy subscription hiện tại của user
     */
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

    /**
     * Tạo subscription mới sau khi PayOS payment thành công
     */
    async createSubscription(params: {
        userId: string;
        planId: string;
        billingCycle: 'monthly' | 'yearly';
        payosOrderCode: number;
    }): Promise<UserSubscription> {
        const { userId, planId, billingCycle, payosOrderCode } = params;

        // Tính period_end dựa trên billing cycle
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
            })
            .select()
            .single();

        if (error) throw error;
        return data as UserSubscription;
    },

    /**
     * Hủy subscription (set canceled_at, không xóa)
     */
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

    /**
     * Kiểm tra user có đủ quyền dùng feature không
     */
    async canAccessFeature(userId: string, feature: string): Promise<boolean> {
        const activePlan = await this.getActivePlan(userId);
        if (!activePlan) return false;

        // Free plan chỉ dùng basic features
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
};
