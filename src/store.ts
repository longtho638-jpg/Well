
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

  // Data Actions
  completeQuest: (questId) => set((state) => ({
    quests: state.quests.map(q => 
      q.id === questId ? { ...q, isCompleted: true } : q
    ),
  })),

  simulateOrder: async (productId) => {
    const state = get();
    const product = state.products.find(p => p.id === productId);
    
    if (!product || product.stock <= 0) throw new Error("Product unavailable");

    const commission = product.price * product.commissionRate;
    const now = new Date();
    
    const newTransaction: Transaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      date: now.toISOString().split('T')[0],
      amount: commission,
      type: 'Direct Sale',
      status: 'completed',
      taxDeducted: 0 
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
          teamVolume: state.user.teamVolume + (product.price * 0.2)
        },
        transactions: [newTransaction, ...state.transactions],
        revenueData: newRevenueData
      };
    });
  }
}));
