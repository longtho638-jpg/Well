/**
 * Unified Store - Unified Orchestrator (Phase 17 Refactoring)
 * 
 * This file combines all domain-specific slices into a single 
 * high-performance Zustand store.
 */

import { create } from 'zustand';
import {
    createAuthSlice, AuthSlice,
    createWalletSlice, WalletSlice,
    createQuestSlice, QuestSlice,
    createTeamSlice, TeamSlice,
    createAgentSlice, AgentSlice,
    createUISlice, UISlice,
    AuthActions,
    WalletActions,
    TeamActions
} from './slices';
import {
    CURRENT_USER,
    PRODUCTS,
    TRANSACTIONS,
    DAILY_QUESTS,
    REVENUE_DATA,
    TEAM_MEMBERS,
    TEAM_METRICS,
    REFERRALS,
    REFERRAL_STATS,
    LANDING_PAGE_TEMPLATES,
    USER_LANDING_PAGES,
    TEAM_INSIGHTS,
    REDEMPTION_ITEMS,
    REDEMPTION_ORDERS
} from '../data/mockData';
import { storeLogger } from '../utils/logger';
import { supabase } from '../lib/supabase';
import { User, Product, Transaction, UserRank } from '../types';
export type { User, Product, Transaction, UserRank };

// Combined Store Type definition
export type AppState = AuthSlice & WalletSlice & QuestSlice & TeamSlice & AgentSlice & UISlice & {
    fetchRealData: () => Promise<void>;
    fetchProducts: () => Promise<void>;
    fetchTransactions: () => Promise<void>;
};

export const useStore = create<AppState>((set, get, ...a) => ({
    // Initialize slices with spread state
    ...createAuthSlice(set, get, ...a),
    ...createWalletSlice(set, get, ...a),
    ...createQuestSlice(set, get, ...a),
    ...createTeamSlice(set, get, ...a),
    ...createAgentSlice(set, get, ...a),
    ...createUISlice(set, get, ...a),

    // Initial State Overrides
    isAuthenticated: false,
    products: PRODUCTS,
    transactions: TRANSACTIONS,
    quests: DAILY_QUESTS,
    teamMembers: TEAM_MEMBERS,
    teamMetrics: TEAM_METRICS,
    teamInsights: TEAM_INSIGHTS,
    referrals: REFERRALS,
    referralStats: REFERRAL_STATS,
    landingPageTemplates: LANDING_PAGE_TEMPLATES,
    userLandingPages: USER_LANDING_PAGES,
    redemptionItems: REDEMPTION_ITEMS,
    redemptionOrders: REDEMPTION_ORDERS,

    /**
     * Fetch products from Supabase
     */
    fetchProducts: async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('sales_count', { ascending: false });

        if (data && data.length > 0) {
            const products: Product[] = data.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description || '',
                price: p.price,
                commissionRate: p.commission_rate || 0.25,
                bonusRevenue: p.bonus_revenue || p.price * 0.5,
                imageUrl: p.image_url || 'https://placehold.co/400',
                salesCount: p.sales_count || 0,
                stock: p.stock || 100,
                isNew: false,
                rating: 4.5,
                category: 'health'
            }));
            set({ products } as Partial<AppState>);
        }
    },

    /**
     * Fetch transactions from Supabase
     */
    fetchTransactions: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data && data.length > 0) {
            const transactions: Transaction[] = data.map(t => ({
                id: t.id,
                userId: t.user_id,
                date: t.date || new Date(t.created_at).toISOString().split('T')[0],
                amount: t.amount,
                type: t.type || 'Direct Sale',
                status: t.status || 'completed',
                taxDeducted: t.tax_deducted || 0,
                hash: t.hash || '',
                currency: t.currency || 'SHOP',
                metadata: t.metadata || {}
            }));
            set({ transactions } as Partial<AppState>);
        }
    },

    /**
     * Orchestrator: Fetch all real data from Supabase
     */
    fetchRealData: async () => {
        const store = get();
        try {
            await Promise.allSettled([
                store.fetchProducts(),
                store.fetchTransactions(),
                store.fetchTeamData()
            ]).then(results => {
                results.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        const names = ['fetchProducts', 'fetchTransactions', 'fetchTeamData'];
                        storeLogger.error(`${names[index]} failed`, result.reason);
                    }
                });
            });
        } catch (error) {
            storeLogger.error('fetchRealData failed', error);
        }
    },
}));

export default useStore;
