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
    createProductSlice, ProductSlice
} from './slices';
import { storeLogger } from '../utils/logger';
import { User, Product, Transaction, UserRank } from '../types';
export type { User, Product, Transaction, UserRank };

// Combined Store Type definition
export type AppState = AuthSlice & WalletSlice & QuestSlice & TeamSlice & AgentSlice & UISlice & ProductSlice & {
    fetchRealData: () => Promise<void>;
};

export const useStore = create<AppState>((set, get, ...a) => ({
    // Initialize slices with spread state
    ...createAuthSlice(set, get, ...a),
    ...createWalletSlice(set, get, ...a),
    ...createQuestSlice(set, get, ...a),
    ...createTeamSlice(set, get, ...a),
    ...createAgentSlice(set, get, ...a),
    ...createUISlice(set, get, ...a),
    ...createProductSlice(set, get, ...a),

    // Initial State Overrides - CLEAN SLATE for Production
    isAuthenticated: false,
    // products: [], // Handled by ProductSlice
    // transactions: [], // Handled by WalletSlice
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
