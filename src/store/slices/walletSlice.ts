/**
 * Wallet Slice - Token Balances, Staking, Withdrawals
 * Part of Store Decomposition (Phase 17 Refactoring)
 */

import { StateCreator } from 'zustand';
import { Transaction, User, UserRank, Product } from '../../types';
import { generateTxHash, calculateStakingReward } from '../../utils/tokenomics';
import { calculatePIT } from '../../utils/tax';
import { enrichUserWithWealthMetrics } from '@/utils/business/wealthEngine';
import { agentRegistry } from '@/agents';
import { agentLogger } from '@/utils/logger';
import { supabase } from '../../lib/supabase';

// ============================================================================
// SLICE TYPES
// ============================================================================

export interface WalletState {
    transactions: Transaction[];
    // Removed products from WalletState as it belongs to ProductSlice,
    // but the slice logic needs access to it via `get().products` which is valid in the combined store.
    revenueData: Array<{ name: string; value: number }>;
}

export interface WalletActions {
    stakeGrowTokens: (amount: number) => void;
    unstakeGrowTokens: (amount: number) => void;
    withdrawShopTokens: (amount: number) => Promise<void>;
    addTransaction: (transaction: Transaction) => void;
    simulateOrder: (productId: string) => Promise<void>;
    // fetchProducts removed, handled by ProductSlice
    fetchTransactions: () => Promise<void>;
}

export type WalletSlice = WalletState & WalletActions;

//Helper type to allow access to products from ProductSlice in the combined store
type CombinedState = WalletSlice & { user: User; setUser: (user: User) => void; products: Product[] };

// ============================================================================
// SLICE CREATOR
// ============================================================================

export const createWalletSlice: StateCreator<
    CombinedState,
    [],
    [],
    WalletSlice
> = (set, get) => ({
    transactions: [],
    // products initialized in ProductSlice, but we don't init it here to avoid conflict
    revenueData: [],

    stakeGrowTokens: (amount) => {
        const state = get();
        if (amount <= 0 || amount > state.user.growBalance) {
            throw new Error("Invalid stake amount");
        }

        const newTransaction: Transaction = {
            id: `TX-STAKE-${Date.now().toString().slice(-6)}`,
            userId: state.user.id,
            date: new Date().toISOString().split('T')[0],
            amount: amount,
            type: 'Withdrawal',
            status: 'completed',
            taxDeducted: 0,
            hash: generateTxHash(),
            currency: 'GROW'
        };

        set({
            user: enrichUserWithWealthMetrics({
                ...state.user,
                growBalance: state.user.growBalance - amount,
                stakedGrowBalance: state.user.stakedGrowBalance + amount
            }),
            transactions: [newTransaction, ...state.transactions]
        } as Partial<CombinedState>);
    },

    unstakeGrowTokens: (amount) => {
        const state = get();
        if (amount <= 0 || amount > state.user.stakedGrowBalance) {
            throw new Error("Invalid unstake amount");
        }

        const stakingReward = calculateStakingReward(amount, 0.12, 30);

        const newTransaction: Transaction = {
            id: `TX-UNSTAKE-${Date.now().toString().slice(-6)}`,
            userId: state.user.id,
            date: new Date().toISOString().split('T')[0],
            amount: amount + stakingReward,
            type: 'Team Volume Bonus',
            status: 'completed',
            taxDeducted: 0,
            hash: generateTxHash(),
            currency: 'GROW'
        };

        set({
            user: enrichUserWithWealthMetrics({
                ...state.user,
                stakedGrowBalance: state.user.stakedGrowBalance - amount,
                growBalance: state.user.growBalance + amount + stakingReward
            }),
            transactions: [newTransaction, ...state.transactions]
        } as Partial<CombinedState>);
    },

    withdrawShopTokens: async (amount) => {
        const state = get();
        const MIN_WITHDRAWAL = 2000000; // 2M VND - mirrors withdrawal-service minimum

        if (amount <= 0 || amount < MIN_WITHDRAWAL || amount > state.user.shopBalance) {
            throw new Error(`Invalid withdrawal amount. Minimum is ${MIN_WITHDRAWAL.toLocaleString('vi-VN')} đ`);
        }

        const taxResult = calculatePIT(amount);

        const newTransaction: Transaction = {
            id: `TX-WITHDRAW-${Date.now().toString().slice(-6)}`,
            userId: state.user.id,
            date: new Date().toISOString().split('T')[0],
            amount: amount,
            type: 'Withdrawal',
            status: 'completed',
            taxDeducted: taxResult.taxAmount,
            hash: generateTxHash(),
            currency: 'SHOP'
        };

        set({
            user: enrichUserWithWealthMetrics({
                ...state.user,
                shopBalance: state.user.shopBalance - amount
            }),
            transactions: [newTransaction, ...state.transactions]
        } as Partial<CombinedState>);
    },

    simulateOrder: async (productId) => {
        const state = get();
        // Access products from the combined store state (provided by ProductSlice)
        const product = state.products.find(p => p.id === productId);

        if (!product || product.stock <= 0) throw new Error("Product unavailable");

        const bonusRevenue = product.bonusRevenue || (product.price * 0.5);
        const userRank = state.user.rank;
        // Higher rank value = lower rank (KHOI_NGHIEP=7, CTV=8 are entry-level, get 25%)
        // Lower rank value = higher rank (THIEN_LONG=1, PHUONG_HOANG=2 are top, get 21%)
        const commissionRate = (userRank >= UserRank.KHOI_NGHIEP) ? 0.25 : 0.21;
        const commission = bonusRevenue * commissionRate;

        const now = new Date();

        const newTransaction: Transaction = {
            id: `TX-${Date.now().toString().slice(-6)}`,
            userId: state.user.id,
            date: now.toISOString().split('T')[0],
            amount: commission,
            type: 'Direct Sale',
            status: 'completed',
            taxDeducted: 0,
            hash: generateTxHash(),
            currency: 'SHOP',
            metadata: {
                product_id: product.id,
                bonus_revenue: bonusRevenue
            }
        };

        const newRevenueData = [...state.revenueData];
        if (newRevenueData.length > 0) {
            const lastIdx = newRevenueData.length - 1;
            newRevenueData[lastIdx] = {
                ...newRevenueData[lastIdx],
                value: newRevenueData[lastIdx].value + product.price
            };
        }

        const updatedUser = {
            ...state.user,
            totalSales: state.user.totalSales + product.price,
            teamVolume: state.user.teamVolume + (product.price * 0.2),
            shopBalance: state.user.shopBalance + commission,
            accumulatedBonusRevenue: (state.user.accumulatedBonusRevenue || 0) + bonusRevenue
        };

        // Note: updating products state requires calling set() with products key,
        // which works because of CombinedState
        set({
            products: state.products.map(p =>
                p.id === productId
                    ? { ...p, stock: p.stock - 1, salesCount: p.salesCount + 1 }
                    : p
            ),
            user: enrichUserWithWealthMetrics(updatedUser),
            transactions: [newTransaction, ...state.transactions],
            revenueData: newRevenueData
        } as Partial<CombinedState>);

        // Trigger Reward Agent
        const beeAgent = agentRegistry.get('The Bee');
        if (beeAgent) {
            try {
                const rewardResult = await beeAgent.execute({
                    action: 'processReward',
                    transaction: newTransaction,
                    userRank: state.user.rank
                }) as { rewardAmount?: number };

                if (rewardResult?.rewardAmount) {
                    const rewardAmount = rewardResult.rewardAmount as number;
                    set((state) => ({
                        user: {
                            ...state.user,
                            growBalance: state.user.growBalance + rewardAmount
                        },
                        transactions: [
                            {
                                id: `TX-REWARD-${Date.now()}`,
                                userId: state.user.id,
                                date: new Date().toISOString().split('T')[0],
                                amount: rewardAmount,
                                type: 'Team Volume Bonus',
                                status: 'completed',
                                taxDeducted: 0,
                                hash: generateTxHash(),
                                currency: 'GROW'
                            },
                            ...state.transactions
                        ]
                    }));
                }
            } catch (e) {
                agentLogger.error('The Bee failed', e);
            }
        }
    },

    addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions]
    })),

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
            set({ transactions });
        }
    },
});
