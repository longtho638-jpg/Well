/**
 * Subscription Slice — Reactive subscription state with multi-org support
 *
 * Manages: active plan, subscription status, org context, plan list.
 * Integrates with subscriptionService for data fetching.
 */

import type { StateCreator } from 'zustand';
import { subscriptionService } from '@/services/subscription-service';
import type {
    SubscriptionPlan,
    UserSubscription,
    ActivePlanInfo,
    Organization,
} from '@/services/subscription-service';

// ─── Slice State ─────────────────────────────────────────────────

export interface SubscriptionSlice {
    // State
    plans: SubscriptionPlan[];
    activePlan: ActivePlanInfo | null;
    currentSubscription: UserSubscription | null;
    currentOrg: Organization | null;
    userOrgs: Organization[];
    subscriptionLoading: boolean;
    subscriptionError: string | null;

    // Actions
    fetchPlans: () => Promise<void>;
    fetchActivePlan: (userId: string) => Promise<void>;
    fetchUserOrgs: (userId: string) => Promise<void>;
    setCurrentOrg: (org: Organization | null) => void;
    subscribeToPlan: (params: {
        userId: string;
        planId: string;
        billingCycle: 'monthly' | 'yearly';
    }) => Promise<{ checkoutUrl: string; orderCode: number }>;
    cancelCurrentSubscription: () => Promise<void>;
    resetSubscription: () => void;
}

// ─── Initial State ───────────────────────────────────────────────

const initialState = {
    plans: [] as SubscriptionPlan[],
    activePlan: null as ActivePlanInfo | null,
    currentSubscription: null as UserSubscription | null,
    currentOrg: null as Organization | null,
    userOrgs: [] as Organization[],
    subscriptionLoading: false,
    subscriptionError: null as string | null,
};

// ─── Slice Creator ───────────────────────────────────────────────

export const createSubscriptionSlice: StateCreator<
    SubscriptionSlice,
    [],
    [],
    SubscriptionSlice
> = (set, get) => ({
    ...initialState,

    fetchPlans: async () => {
        try {
            set({ subscriptionLoading: true, subscriptionError: null });
            const plans = await subscriptionService.getPlans();
            set({ plans, subscriptionLoading: false });
        } catch (err) {
            set({
                subscriptionError: err instanceof Error ? err.message : 'Failed to fetch plans',
                subscriptionLoading: false,
            });
        }
    },

    fetchActivePlan: async (userId: string) => {
        try {
            set({ subscriptionLoading: true, subscriptionError: null });

            const [activePlan, subscription] = await Promise.all([
                subscriptionService.getActivePlan(userId),
                subscriptionService.getUserSubscription(userId),
            ]);

            set({
                activePlan,
                currentSubscription: subscription,
                subscriptionLoading: false,
            });
        } catch (err) {
            set({
                subscriptionError: err instanceof Error ? err.message : 'Failed to fetch plan',
                subscriptionLoading: false,
            });
        }
    },

    fetchUserOrgs: async (userId: string) => {
        try {
            const userOrgs = await subscriptionService.getUserOrgs(userId);
            set({ userOrgs });
            // Auto-select first org if none selected
            if (!get().currentOrg && userOrgs.length > 0) {
                set({ currentOrg: userOrgs[0] });
            }
        } catch {
            // Non-critical — orgs may not exist yet
            set({ userOrgs: [] });
        }
    },

    setCurrentOrg: (org: Organization | null) => {
        set({ currentOrg: org });
    },

    subscribeToPlan: async (params) => {
        try {
            set({ subscriptionLoading: true, subscriptionError: null });
            const orgId = get().currentOrg?.id;
            const result = await subscriptionService.createSubscriptionIntent({
                userId: params.userId,
                planId: params.planId,
                billingCycle: params.billingCycle,
                orgId,
            });
            set({ subscriptionLoading: false });
            return result;
        } catch (err) {
            set({
                subscriptionError: err instanceof Error ? err.message : 'Failed to create subscription',
                subscriptionLoading: false,
            });
            throw err;
        }
    },

    cancelCurrentSubscription: async () => {
        const sub = get().currentSubscription;
        if (!sub) return;

        try {
            set({ subscriptionLoading: true, subscriptionError: null });
            await subscriptionService.cancelSubscription(sub.id);
            set({
                currentSubscription: { ...sub, status: 'canceled', canceled_at: new Date().toISOString() },
                activePlan: null,
                subscriptionLoading: false,
            });
        } catch (err) {
            set({
                subscriptionError: err instanceof Error ? err.message : 'Failed to cancel',
                subscriptionLoading: false,
            });
        }
    },

    resetSubscription: () => {
        set(initialState);
    },
});
