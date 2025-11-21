
import { create } from 'zustand';
import { User, Product, Transaction, Quest, ChartDataPoint, Achievement, LeaderboardEntry, Goal } from './types';
import {
  CURRENT_USER,
  PRODUCTS,
  TRANSACTIONS,
  DAILY_QUESTS,
  REVENUE_DATA,
  ACHIEVEMENTS,
  LEADERBOARD,
  GOALS
} from './data/mockData';
import {
  subscribeToAuthState,
  signOutUser,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  getCurrentUser
} from './services/firebaseService';
import type { User as FirebaseUser } from 'firebase/auth';

interface AppState {
  // Auth State
  isAuthenticated: boolean;
  firebaseUser: FirebaseUser | null;
  login: () => void;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  setFirebaseUser: (user: FirebaseUser | null) => void;

  // Data Models
  user: User;
  products: Product[];
  transactions: Transaction[];
  quests: Quest[];
  revenueData: ChartDataPoint[];
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  goals: Goal[];

  // Actions (Simulating Backend Mutations)
  completeQuest: (questId: string) => void;
  simulateOrder: (productId: string) => Promise<void>;

  // Gamification Actions
  unlockAchievement: (achievementId: string) => void;
  updateGoalProgress: (goalId: string, progress: number) => void;
  completeGoal: (goalId: string) => void;
  addGoal: (goal: Goal) => void;

  // XP and Leveling
  addXP: (amount: number) => void;
  addBadge: (badgeId: string, badgeName: string, description: string, icon: string, rarity: 'common' | 'rare' | 'epic' | 'legendary') => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial State
  isAuthenticated: false,
  firebaseUser: null,

  user: CURRENT_USER,
  products: PRODUCTS,
  transactions: TRANSACTIONS,
  quests: DAILY_QUESTS,
  revenueData: REVENUE_DATA,
  achievements: ACHIEVEMENTS,
  leaderboard: LEADERBOARD,
  goals: GOALS,

  // Auth Actions
  login: () => set({ isAuthenticated: true }),

  logout: async () => {
    try {
      await signOutUser();
      set({ isAuthenticated: false, firebaseUser: null });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmail(email, password);
      set({ isAuthenticated: true, firebaseUser: userCredential.user });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await signUpWithEmail(email, password, displayName);
      set({ isAuthenticated: true, firebaseUser: userCredential.user });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  googleSignIn: async () => {
    try {
      const userCredential = await signInWithGoogle();
      set({ isAuthenticated: true, firebaseUser: userCredential.user });
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  },

  setFirebaseUser: (user: FirebaseUser | null) => {
    set({
      firebaseUser: user,
      isAuthenticated: !!user
    });
  },

  // Data Actions
  completeQuest: (questId) => {
    const state = get();
    const quest = state.quests.find(q => q.id === questId);

    set((state) => ({
      quests: state.quests.map(q =>
        q.id === questId ? { ...q, isCompleted: true, progress: 100 } : q
      ),
    }));

    // Award XP for completing quest
    if (quest) {
      get().addXP(quest.xp);
    }
  },

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
          teamVolume: state.user.teamVolume + (product.price * 0.2),
          totalSalesCount: state.user.totalSalesCount + 1
        },
        transactions: [newTransaction, ...state.transactions],
        revenueData: newRevenueData
      };
    });

    // Award XP for sale
    get().addXP(30);
  },

  // Gamification Actions
  unlockAchievement: (achievementId: string) => {
    set((state) => ({
      achievements: state.achievements.map(a =>
        a.id === achievementId
          ? { ...a, isUnlocked: true, unlockedAt: new Date().toISOString() }
          : a
      ),
    }));

    // Award XP for unlocking achievement
    const achievement = get().achievements.find(a => a.id === achievementId);
    if (achievement) {
      get().addXP(achievement.reward);
    }
  },

  updateGoalProgress: (goalId: string, progress: number) => {
    set((state) => ({
      goals: state.goals.map(g =>
        g.id === goalId ? { ...g, current: progress } : g
      ),
    }));

    // Auto-complete goal if target reached
    const goal = get().goals.find(g => g.id === goalId);
    if (goal && progress >= goal.target) {
      get().completeGoal(goalId);
    }
  },

  completeGoal: (goalId: string) => {
    set((state) => ({
      goals: state.goals.map(g =>
        g.id === goalId ? { ...g, status: 'completed' } : g
      ),
    }));

    // Award XP for completing goal
    get().addXP(50);
  },

  addGoal: (goal: Goal) => {
    set((state) => ({
      goals: [...state.goals, goal],
    }));
  },

  addXP: (amount: number) => {
    set((state) => {
      const newXP = state.user.xp + amount;
      const xpPerLevel = 500;
      const newLevel = Math.floor(newXP / xpPerLevel) + 1;

      return {
        user: {
          ...state.user,
          xp: newXP,
          level: newLevel
        }
      };
    });
  },

  addBadge: (badgeId: string, badgeName: string, description: string, icon: string, rarity: 'common' | 'rare' | 'epic' | 'legendary') => {
    set((state) => ({
      user: {
        ...state.user,
        badges: [
          ...state.user.badges,
          {
            id: badgeId,
            name: badgeName,
            description,
            icon,
            rarity,
            earnedAt: new Date().toISOString()
          }
        ]
      }
    }));
  },
}));

// Subscribe to Firebase auth state changes
subscribeToAuthState((firebaseUser) => {
  useStore.getState().setFirebaseUser(firebaseUser);
});
