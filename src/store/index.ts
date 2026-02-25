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
    createUISlice, UISlice
} from './slices';
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

    // Initial State Overrides - CLEAN SLATE for Production
    isAuthenticated: false,
    products: [],
    transactions: [],
    quests: [], // Will be fetched via fetchRealData -> fetchQuests (if implemented) or default empty
    teamMembers: [],
    teamMetrics: {
        totalMembers: 0,
        activeMembers: 0,
        totalTeamVolume: 0, // Corrected property name
        monthlyGrowth: 0,
        averageSalesPerMember: 0,
        topPerformers: []
    },
    teamInsights: {
        atRiskMembers: [],
        totalAtRisk: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        retentionRate: 0
    },
    referrals: [],
    referralStats: {
        totalReferrals: 0,
        activeReferrals: 0,
        totalCommission: 0,
        conversionRate: 0
    },
    landingPageTemplates: [],
    userLandingPages: [],
    redemptionItems: [],
    redemptionOrders: [],

    /**
     * Fetch products from Supabase
     */
    fetchProducts: async () => {
        const { data } = await supabase
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

        const { data } = await supabase
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
