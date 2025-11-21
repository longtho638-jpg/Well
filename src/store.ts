
import { create } from 'zustand';
import { User, Product, Transaction, Quest, ChartDataPoint, TeamMember, TeamMetrics, Referral, ReferralStats } from './types';
import {
  CURRENT_USER,
  PRODUCTS,
  TRANSACTIONS,
  DAILY_QUESTS,
  REVENUE_DATA,
  TEAM_MEMBERS,
  TEAM_METRICS,
  REFERRALS,
  REFERRAL_STATS
} from './data/mockData';
import { generateTxHash, calculateStakingReward } from './utils/tokenomics';

interface AppState {
  // Auth State
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;

  // Data Models
  user: User;
  products: Product[];
  transactions: Transaction[];
  quests: Quest[];
  revenueData: ChartDataPoint[];

  // Phase 2: Growth Features
  teamMembers: TeamMember[];
  teamMetrics: TeamMetrics;
  referrals: Referral[];
  referralStats: ReferralStats;

  // Actions (Simulating Backend Mutations)
  completeQuest: (questId: string) => void;
  simulateOrder: (productId: string) => Promise<void>;

  // Token Actions (Dual Token System)
  stakeGrowTokens: (amount: number) => void;
  unstakeGrowTokens: (amount: number) => void;
  withdrawShopTokens: (amount: number) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial State
  isAuthenticated: false, // Default to false to show Landing Page first

  user: CURRENT_USER,
  products: PRODUCTS,
  transactions: TRANSACTIONS,
  quests: DAILY_QUESTS,
  revenueData: REVENUE_DATA,

  // Phase 2: Growth Features
  teamMembers: TEAM_MEMBERS,
  teamMetrics: TEAM_METRICS,
  referrals: REFERRALS,
  referralStats: REFERRAL_STATS,

  // Auth Actions
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),

  // Quest Actions - FIXED: Cộng GROW tokens khi complete quest
  completeQuest: (questId) => set((state) => {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || quest.isCompleted) return state;

    // Quest rewards GROW tokens (XP converted to GROW 1:1)
    const growReward = quest.xp;

    // Create transaction record for GROW reward
    const newTransaction: Transaction = {
      id: `TX-QUEST-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      date: new Date().toISOString().split('T')[0],
      amount: growReward,
      type: 'Team Volume Bonus', // Using existing type for quest rewards
      status: 'completed',
      taxDeducted: 0, // No tax on GROW tokens
      hash: generateTxHash(),
      currency: 'GROW'
    };

    return {
      quests: state.quests.map(q =>
        q.id === questId ? { ...q, isCompleted: true } : q
      ),
      user: {
        ...state.user,
        growBalance: state.user.growBalance + growReward
      },
      transactions: [newTransaction, ...state.transactions]
    };
  }),

  // Sales Actions - FIXED: Cộng SHOP tokens khi bán hàng
  simulateOrder: async (productId) => {
    const state = get();
    const product = state.products.find(p => p.id === productId);

    if (!product || product.stock <= 0) throw new Error("Product unavailable");

    const commission = product.price * product.commissionRate;
    const now = new Date();

    // Transaction for SHOP token commission
    const newTransaction: Transaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      date: now.toISOString().split('T')[0],
      amount: commission,
      type: 'Direct Sale',
      status: 'completed',
      taxDeducted: 0, // Tax calculated separately
      hash: generateTxHash(),
      currency: 'SHOP'
    };

    set((state) => {
      const newRevenueData = [...state.revenueData];
      if (newRevenueData.length > 0) {
         const lastIdx = newRevenueData.length - 1;
         newRevenueData[lastIdx] = {
             ...newRevenueData[lastIdx],
             value: newRevenueData[lastIdx].value + product.price
         };
      }

      return {
        products: state.products.map(p =>
          p.id === productId
            ? { ...p, stock: p.stock - 1, salesCount: p.salesCount + 1 }
            : p
        ),
        user: {
          ...state.user,
          totalSales: state.user.totalSales + product.price,
          teamVolume: state.user.teamVolume + (product.price * 0.2),
          shopBalance: state.user.shopBalance + commission // FIXED: Cộng SHOP token
        },
        transactions: [newTransaction, ...state.transactions],
        revenueData: newRevenueData
      };
    });
  },

  // Staking Actions - NEW: Stake GROW tokens
  stakeGrowTokens: (amount) => set((state) => {
    if (amount <= 0 || amount > state.user.growBalance) {
      throw new Error("Invalid stake amount");
    }

    const newTransaction: Transaction = {
      id: `TX-STAKE-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      date: new Date().toISOString().split('T')[0],
      amount: amount,
      type: 'Withdrawal', // Using existing type for staking action
      status: 'completed',
      taxDeducted: 0,
      hash: generateTxHash(),
      currency: 'GROW'
    };

    return {
      user: {
        ...state.user,
        growBalance: state.user.growBalance - amount,
        stakedGrowBalance: state.user.stakedGrowBalance + amount
      },
      transactions: [newTransaction, ...state.transactions]
    };
  }),

  // Unstaking Actions - NEW: Unstake GROW tokens with rewards
  unstakeGrowTokens: (amount) => set((state) => {
    if (amount <= 0 || amount > state.user.stakedGrowBalance) {
      throw new Error("Invalid unstake amount");
    }

    // Calculate staking rewards (example: 12% APY for 30 days)
    const stakingReward = calculateStakingReward(amount, 0.12, 30);

    const newTransaction: Transaction = {
      id: `TX-UNSTAKE-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      date: new Date().toISOString().split('T')[0],
      amount: amount + stakingReward,
      type: 'Team Volume Bonus', // Using existing type for rewards
      status: 'completed',
      taxDeducted: 0,
      hash: generateTxHash(),
      currency: 'GROW'
    };

    return {
      user: {
        ...state.user,
        stakedGrowBalance: state.user.stakedGrowBalance - amount,
        growBalance: state.user.growBalance + amount + stakingReward
      },
      transactions: [newTransaction, ...state.transactions]
    };
  }),

  // Withdrawal Actions - NEW: Withdraw SHOP tokens to bank
  withdrawShopTokens: async (amount) => {
    const state = get();

    if (amount <= 0 || amount > state.user.shopBalance) {
      throw new Error("Invalid withdrawal amount");
    }

    const newTransaction: Transaction = {
      id: `TX-WITHDRAW-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      date: new Date().toISOString().split('T')[0],
      amount: amount,
      type: 'Withdrawal',
      status: 'completed',
      taxDeducted: 0, // Tax deducted in backend
      hash: generateTxHash(),
      currency: 'SHOP'
    };

    set((state) => ({
      user: {
        ...state.user,
        shopBalance: state.user.shopBalance - amount
      },
      transactions: [newTransaction, ...state.transactions]
    }));
  }
}));
