
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
import { TOKENOMICS_CONSTANTS, WEALTH_OS_CONSTANTS, COMMISSION_CONSTANTS } from './utils/constants';

// ============================================================================
// WEALTH OS CALCULATION ENGINE
// ============================================================================

/**
 * Calculate Business Valuation (Investment-grade metric)
 * Formula: Monthly Profit * 12 (Annualized) * PE Ratio (5x for high-growth SMB)
 */
function calculateBusinessValuation(user: User): number {
  // Estimate monthly profit using conservative margin
  const monthlyProfit = user.totalSales * TOKENOMICS_CONSTANTS.PROFIT_MARGIN;
  // Annualize the monthly profit
  const annualizedProfit = monthlyProfit * TOKENOMICS_CONSTANTS.MONTHS_PER_YEAR;
  // Apply PE ratio (standard for high-growth small businesses)
  return annualizedProfit * TOKENOMICS_CONSTANTS.PE_RATIO;
}

/**
 * Calculate Equity Value (GROW Token holdings)
 */
function calculateEquityValue(growBalance: number): number {
  return growBalance * TOKENOMICS_CONSTANTS.GROW_TO_VND_RATE;
}

/**
 * Calculate monthly asset growth rate
 */
function calculateAssetGrowthRate(user: User): number {
  // Simulated growth rate based on team volume momentum
  if (user.teamVolume > WEALTH_OS_CONSTANTS.ELITE_VOLUME_THRESHOLD) {
    return WEALTH_OS_CONSTANTS.GROWTH_RATE_ELITE;
  }
  if (user.teamVolume > WEALTH_OS_CONSTANTS.ADVANCED_VOLUME_THRESHOLD) {
    return WEALTH_OS_CONSTANTS.GROWTH_RATE_ADVANCED;
  }
  if (user.teamVolume > WEALTH_OS_CONSTANTS.INTERMEDIATE_VOLUME_THRESHOLD) {
    return WEALTH_OS_CONSTANTS.GROWTH_RATE_INTERMEDIATE;
  }
  return WEALTH_OS_CONSTANTS.GROWTH_RATE_BASELINE;
}

/**
 * Enrich user with Wealth OS metrics
 */
function enrichUserWithWealthMetrics(user: User): User {
  const monthlyProfit = user.totalSales * TOKENOMICS_CONSTANTS.PROFIT_MARGIN;
  const businessValuation = calculateBusinessValuation(user);
  const equityValue = calculateEquityValue(user.growBalance + user.stakedGrowBalance);
  const cashflowValue = user.shopBalance;
  const assetGrowthRate = calculateAssetGrowthRate(user);
  const projectedAnnualProfit = monthlyProfit * TOKENOMICS_CONSTANTS.MONTHS_PER_YEAR;

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

  user: enrichUserWithWealthMetrics(CURRENT_USER), // WEALTH OS: Enrich user with valuation metrics
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

      // Update user and recalculate Wealth OS metrics
      const updatedUser = {
        ...state.user,
        totalSales: state.user.totalSales + product.price,
        teamVolume: state.user.teamVolume + (product.price * COMMISSION_CONSTANTS.TIER_MID),
        shopBalance: state.user.shopBalance + commission
      };

      return {
        products: state.products.map(p =>
          p.id === productId
            ? { ...p, stock: p.stock - 1, salesCount: p.salesCount + 1 }
            : p
        ),
        user: enrichUserWithWealthMetrics(updatedUser), // WEALTH OS: Recalculate valuation after sale
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

    // Calculate staking rewards using default APY and staking period
    const stakingReward = calculateStakingReward(
      amount,
      TOKENOMICS_CONSTANTS.DEFAULT_APY,
      TOKENOMICS_CONSTANTS.DEFAULT_STAKING_DAYS
    );

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
