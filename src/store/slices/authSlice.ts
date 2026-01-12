/**
 * Auth Slice - Authentication State & Actions
 * Part of Store Decomposition (Phase 2 Refactoring)
 */

import { StateCreator } from 'zustand';
import { User, UserRank } from '../../types';
import { supabase } from '../../lib/supabase';

// ============================================================================
// WEALTH OS CALCULATION ENGINE
// ============================================================================

export function calculateBusinessValuation(user: User): number {
    const monthlyProfit = user.totalSales * 0.20;
    const annualizedProfit = monthlyProfit * 12;
    const PE_RATIO = 5;
    return annualizedProfit * PE_RATIO;
}

export function calculateEquityValue(growBalance: number): number {
    const GROW_TO_VND_RATE = 10000;
    return growBalance * GROW_TO_VND_RATE;
}

export function calculateAssetGrowthRate(user: User): number {
    if (user.teamVolume > 100_000_000) return 15;
    if (user.teamVolume > 50_000_000) return 10;
    if (user.teamVolume > 20_000_000) return 7;
    return 5;
}

export function enrichUserWithWealthMetrics(user: User): User {
    const monthlyProfit = user.totalSales * 0.20;
    const businessValuation = calculateBusinessValuation(user);
    const equityValue = calculateEquityValue(user.growBalance + user.stakedGrowBalance);
    const cashflowValue = user.shopBalance;
    const assetGrowthRate = calculateAssetGrowthRate(user);
    const projectedAnnualProfit = monthlyProfit * 12;

    return {
        ...user,
        monthlyProfit,
        businessValuation,
        projectedAnnualProfit,
        equityValue,
        cashflowValue,
        assetGrowthRate,
    };
}

// ============================================================================
// SLICE TYPES
// ============================================================================

export interface AuthState {
    isAuthenticated: boolean;
    user: User;
}

export interface AuthActions {
    login: () => void;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
    setIsAuthenticated: (isAuth: boolean) => void;
    fetchUserFromDB: () => Promise<void>;
}

export type AuthSlice = AuthState & AuthActions;

// ============================================================================
// DEFAULT USER
// ============================================================================

export const createEmptyUser = (): User => ({
    id: '',
    name: '',
    email: '',
    rank: UserRank.CTV,
    roleId: 8,
    sponsorId: undefined,
    totalSales: 0,
    teamVolume: 0,
    shopBalance: 0,
    growBalance: 0,
    pendingCashback: 0,
    pointBalance: 0,
    stakedGrowBalance: 0,
    avatarUrl: '',
    joinedAt: '',
    kycStatus: false,
    monthlyProfit: 0,
    businessValuation: 0,
    projectedAnnualProfit: 0,
    equityValue: 0,
    cashflowValue: 0,
    assetGrowthRate: 0,
    accumulatedBonusRevenue: 0,
    estimatedBonus: 0,
    referralLink: '',
});

// ============================================================================
// SLICE CREATOR
// ============================================================================

export const createAuthSlice: StateCreator<
    AuthSlice,
    [],
    [],
    AuthSlice
> = (set, get) => ({
    // Initial State
    isAuthenticated: false,
    user: createEmptyUser(),

    // Actions
    login: () => set({ isAuthenticated: true }),

    logout: async () => {
        try {
            // Use Promise.race with timeout to prevent hanging on network errors
            const signOutPromise = supabase.auth.signOut();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Logout timeout')), 3000)
            );
            await Promise.race([signOutPromise, timeoutPromise]);
        } catch {
            // Ignore errors - we always want to reset local state
        }
        // Always reset local state regardless of Supabase response
        set({ isAuthenticated: false, user: createEmptyUser() });
    },

    setUser: (user) => {
        if (user === null) {
            set({ user: createEmptyUser() });
        } else {
            set({ user: enrichUserWithWealthMetrics(user) });
        }
    },

    setIsAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),

    fetchUserFromDB: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (data) {
            const user: User = {
                id: data.id,
                name: data.name,
                email: data.email,
                rank: (data.role_id as UserRank) || UserRank.CTV,
                roleId: data.role_id || 8,
                sponsorId: data.sponsor_id,
                totalSales: data.total_sales || 0,
                teamVolume: data.team_volume || 0,
                shopBalance: data.shop_balance || 0,
                growBalance: data.grow_balance || data.pending_cashback || 0,
                pendingCashback: data.pending_cashback || 0,
                pointBalance: data.point_balance || 0,
                stakedGrowBalance: data.staked_grow_balance || 0,
                avatarUrl: data.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                joinedAt: new Date(data.created_at).toISOString().split('T')[0],
                kycStatus: false,
                monthlyProfit: 0,
                businessValuation: 0,
                projectedAnnualProfit: 0,
                equityValue: 0,
                cashflowValue: 0,
                assetGrowthRate: 0,
                accumulatedBonusRevenue: data.accumulated_bonus_revenue || 0,
                estimatedBonus: 0,
                referralLink: `wellnexus.vn/ref/${data.id}`,
            };

            set({ user: enrichUserWithWealthMetrics(user), isAuthenticated: true });
        }
    },
});
