/**
 * Wallet slice — state/action types and simulateOrder helper.
 * Extracted to keep walletSlice.ts under 200 LOC.
 */

import type { Transaction, Product, User } from '../../types';
import { UserRank } from '../../types';
import { generateTxHash, calculateStakingReward } from '../../utils/tokenomics';
import { enrichUserWithWealthMetrics } from '@/utils/business/wealthEngine';
import { agentRegistry } from '@/agents';
import { agentLogger } from '@/utils/logger';

export interface WalletState {
    transactions: Transaction[];
    products: Product[];
    revenueData: Array<{ name: string; value: number }>;
}

export interface WalletActions {
    stakeGrowTokens: (amount: number) => void;
    unstakeGrowTokens: (amount: number) => void;
    withdrawShopTokens: (amount: number) => Promise<void>;
    addTransaction: (transaction: Transaction) => void;
    simulateOrder: (productId: string) => Promise<void>;
    fetchProducts: () => Promise<void>;
    fetchTransactions: () => Promise<void>;
}

export type WalletSlice = WalletState & WalletActions;

type SetFn = (updater: Partial<WalletSlice & { user: User }> | ((s: WalletSlice & { user: User }) => Partial<WalletSlice & { user: User }>)) => void;
type GetFn = () => WalletSlice & { user: User };

/**
 * simulateOrder — extracted from walletSlice to keep it under 200 LOC.
 */
export async function simulateOrder(
    productId: string,
    set: SetFn,
    get: GetFn
): Promise<void> {
    const state = get();
    const product = state.products.find((p: Product) => p.id === productId);
    if (!product || product.stock <= 0) throw new Error('Product unavailable');

    const bonusRevenue = product.bonusRevenue || (product.price * 0.5);
    const userRank = state.user.rank;
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
        metadata: { product_id: product.id, bonus_revenue: bonusRevenue }
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

    set({
        products: state.products.map((p: Product) =>
            p.id === productId ? { ...p, stock: p.stock - 1, salesCount: p.salesCount + 1 } : p
        ),
        user: enrichUserWithWealthMetrics(updatedUser),
        transactions: [newTransaction, ...state.transactions],
        revenueData: newRevenueData
    } as Partial<WalletSlice & { user: User }>);

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
                set((s) => ({
                    user: { ...s.user, growBalance: s.user.growBalance + rewardAmount },
                    transactions: [
                        {
                            id: `TX-REWARD-${Date.now()}`,
                            userId: s.user.id,
                            date: new Date().toISOString().split('T')[0],
                            amount: rewardAmount,
                            type: 'Team Volume Bonus',
                            status: 'completed',
                            taxDeducted: 0,
                            hash: generateTxHash(),
                            currency: 'GROW'
                        },
                        ...s.transactions
                    ]
                }));
            }
        } catch (e) {
            agentLogger.error('The Bee failed', e);
        }
    }
}

// Re-export tokenomics helpers used by walletSlice.ts
export { generateTxHash, calculateStakingReward };
