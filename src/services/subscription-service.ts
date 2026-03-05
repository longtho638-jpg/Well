/**
 * WellNexus Subscription Service
 * Quản lý subscription plans và user subscriptions cho RaaS model.
 * Hỗ trợ multi-org: mỗi org có subscription riêng.
 *
 * All Supabase queries delegated to vibe-supabase SDK.
 * Pure logic imported from vibe-subscription SDK.
 */

import { supabase as supabaseClient } from '@/lib/supabase';
import type { SupabaseLike } from '@/lib/vibe-supabase/typed-query-helpers';
import { canAccessFeature, computeActivationParams } from '@/lib/vibe-subscription';

// Cast real SupabaseClient to SupabaseLike at boundary — structurally compatible at runtime
const supabase = supabaseClient as unknown as SupabaseLike;
import type {
    SubscriptionPlan,
    UserSubscription,
    ActivePlanInfo,
    Organization,
    OrgMember,
    FeatureGateConfig,
    UsageRecord,
    UsageSummary,
    UsageQuota,
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
    trackFeatureUsage as _trackFeatureUsage,
    getOrgUsageSummary as _getOrgUsageSummary,
    checkOrgQuota as _checkOrgQuota,
} from '@/lib/vibe-supabase';

// Re-export types so existing consumers don't break
export type { SubscriptionPlan, UserSubscription, ActivePlanInfo, Organization, OrgMember, UsageRecord, UsageSummary, UsageQuota };

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

    // ── Usage tracking (delegates to vibe-supabase SDK) ──────────

    async trackUsage(params: {
        orgId: string;
        userId: string;
        feature: string;
        quantity?: number;
        metadata?: Record<string, unknown>;
    }): Promise<UsageRecord> {
        return _trackFeatureUsage(supabase, params);
    },

    async getOrgUsage(
        orgId: string,
        periodStart: string,
        periodEnd: string,
    ): Promise<UsageSummary[]> {
        return _getOrgUsageSummary(supabase, orgId, periodStart, periodEnd);
    },

    async checkQuota(
        orgId: string,
        feature: string,
        planLimit: number,
        periodStart: string,
        periodEnd: string,
    ): Promise<UsageQuota> {
        return _checkOrgQuota(supabase, orgId, feature, planLimit, periodStart, periodEnd);
    },

    // ── Auto-renewal logic ─────────────────────────────────────

    /**
     * Extend subscription expiration date on successful payment.
     * Called from webhook handler when payment status = PAID.
     */
    async renewSubscription(params: {
        subscriptionId: string;
        extendsMonths: number;
        payosOrderCode: number;
    }): Promise<UserSubscription> {
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('id', params.subscriptionId)
            .single();

        if (error || !data) {
            throw new Error('Subscription not found');
        }

        const currentEnd = new Date(data.end_date);
        const newEnd = new Date(currentEnd.setMonth(currentEnd.getMonth() + params.extendsMonths));

        const { data: updated, error: updateError } = await supabase
            .from('user_subscriptions')
            .update({
                end_date: newEnd.toISOString(),
                status: 'active',
                metadata: {
                    ...data.metadata,
                    lastRenewalDate: new Date().toISOString(),
                    renewalOrderCode: params.payosOrderCode,
                },
            })
            .eq('id', params.subscriptionId)
            .select()
            .single();

        if (updateError) {
            throw new Error('Failed to renew subscription');
        }

        return updated as UserSubscription;
    },

    /**
     * Activate RaaS license on subscription renewal.
     * Links subscription to raas_licenses table.
     */
    async activateLicenseOnRenewal(params: {
        userId: string;
        subscriptionId: string;
        features: Record<string, boolean>;
        expiresAt: string;
    }): Promise<{ success: boolean; licenseId?: string }> {
        const { data: existing } = await supabase
            .from('raas_licenses')
            .select('id')
            .eq('user_id', params.userId)
            .eq('status', 'active')
            .single();

        if (existing) {
            const { error } = await supabase
                .from('raas_licenses')
                .update({
                    expires_at: params.expiresAt,
                    features: params.features,
                    metadata: {
                        renewed_at: new Date().toISOString(),
                        subscription_id: params.subscriptionId,
                    },
                })
                .eq('id', existing.id);

            return { success: !error, licenseId: existing.id };
        }

        const { data: newLicense, error } = await supabase
            .from('raas_licenses')
            .insert({
                user_id: params.userId,
                license_key: `RAAS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                status: 'active',
                features: params.features,
                expires_at: params.expiresAt,
                metadata: {
                    created_via: 'subscription_renewal',
                    subscription_id: params.subscriptionId,
                },
            })
            .select()
            .single();

        return { success: !error, licenseId: newLicense?.id };
    },
};
