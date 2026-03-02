/**
 * Wallet Slice - Token Balances, Staking, Withdrawals
 * Part of Store Decomposition (Phase 17 Refactoring)
 */

import { StateCreator } from 'zustand';
import { Transaction, User } from '../../types';
import { calculatePIT } from '../../utils/tax';
import { enrichUserWithWealthMetrics } from '@/utils/business/wealthEngine';
import {
    WalletState,
    WalletActions,
    WalletSlice,
    simulateOrder,
    generateTxHash,
    calculateStakingReward,
} from './wallet-slice-state-and-action-types';

export type { WalletState, WalletActions, WalletSlice };

// ============================================================================
// SLICE CREATOR
// ============================================================================

export const createWalletSlice: StateCreator<
    WalletSlice & { user: User; setUser: (user: User) => void },
    [],
    [],
    WalletSlice
> = (set, get) => ({
    transactions: [],
    products: [],
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
        } as Partial<WalletSlice & { user: User }>);
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
        } as Partial<WalletSlice & { user: User }>);
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
        } as Partial<WalletSlice & { user: User }>);
    },

    simulateOrder: async (productId) => simulateOrder(productId, set, get),

    addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions]
    })),

    fetchProducts: async () => { /* implementation handled by combined store fetch */ },
    fetchTransactions: async () => { /* implementation handled by combined store fetch */ },
});
