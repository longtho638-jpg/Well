/**
 * Wallet Slice - Token Balances, Staking, Withdrawals
 * Part of Store Decomposition (Phase 2 Refactoring)
 */

import { StateCreator } from 'zustand';
import { Transaction, User } from '../../types';
import { generateTxHash, calculateStakingReward } from '../../utils/tokenomics';
import { calculatePIT } from '../../utils/tax';
import { enrichUserWithWealthMetrics } from './authSlice';

// ============================================================================
// SLICE TYPES
// ============================================================================

export interface WalletState {
    transactions: Transaction[];
}

export interface WalletActions {
    stakeGrowTokens: (amount: number) => void;
    unstakeGrowTokens: (amount: number) => void;
    withdrawShopTokens: (amount: number) => Promise<void>;
    addTransaction: (transaction: Transaction) => void;
}

export type WalletSlice = WalletState & WalletActions;

// ============================================================================
// SLICE CREATOR
// ============================================================================

type WalletSliceCreator = StateCreator<
    WalletSlice & { user: User; setUser?: (user: User) => void },
    [],
    [],
    WalletSlice
>;

export const createWalletSlice: WalletSliceCreator = (set, get) => ({
    transactions: [],

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

        if (amount <= 0 || amount > state.user.shopBalance) {
            throw new Error("Invalid withdrawal amount");
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

    addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions]
    })),
});
