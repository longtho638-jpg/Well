
import { create } from 'zustand';
import { User, Product, Transaction, Quest, ChartDataPoint } from './types';
import { CURRENT_USER, PRODUCTS, TRANSACTIONS, DAILY_QUESTS, REVENUE_DATA } from './data/mockData';

interface AppState {
  // Data Models
  user: User;
  products: Product[];
  transactions: Transaction[];
  quests: Quest[];
  revenueData: ChartDataPoint[];

  // Actions (Simulating Backend Mutations)
  completeQuest: (questId: string) => void;
  addTransaction: (transaction: Transaction) => void;
  updateUserStats: (sales: number) => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial State loaded from Mock Data (Seed Stage)
  user: CURRENT_USER,
  products: PRODUCTS,
  transactions: TRANSACTIONS,
  quests: DAILY_QUESTS,
  revenueData: REVENUE_DATA,

  // Reducers
  completeQuest: (questId) => set((state) => ({
    quests: state.quests.map(q => 
      q.id === questId ? { ...q, isCompleted: true } : q
    ),
    // Add XP logic here if needed
  })),

  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions],
    // Recalculate totals could happen here
  })),

  updateUserStats: (sales) => set((state) => ({
    user: {
      ...state.user,
      totalSales: state.user.totalSales + sales
    }
  }))
}));
