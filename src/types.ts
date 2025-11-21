export type AppView = 'dashboard' | 'marketplace' | 'wallet';

export enum UserRank {
  MEMBER = 'Member',
  PARTNER = 'Partner',
  FOUNDER_CLUB = 'Founder Club',
}

export type TransactionType = 'Direct Sale' | 'Team Volume Bonus' | 'Withdrawal';

export interface User {
  id: string;
  name: string;
  email: string;
  rank: UserRank;
  totalSales: number;
  teamVolume: number;
  avatarUrl: string;
  joinedAt: string;
  kycStatus: boolean;
  nextPayoutDate?: string;
  estimatedBonus?: number;
  referralLink?: string;
  // Gamification fields
  xp: number;
  level: number;
  badges: Badge[];
  // Performance tracking
  currentStreak: number; // Days of activity
  longestStreak: number;
  totalSalesCount: number; // Number of sales (not amount)
  teamSize: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  imageUrl: string;
  description: string;
  salesCount: number;
  stock: number;
}

export interface Transaction {
  id: string;
  userId?: string;
  date: string;
  amount: number;
  type: TransactionType;
  status: 'pending' | 'completed';
  taxDeducted?: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  reward?: number; // VND reward
  type: 'onboarding' | 'sales' | 'learning' | 'social' | 'milestone';
  isCompleted: boolean;
  progress?: number; // 0-100 percentage
  requirement?: number; // e.g., "sell 5 products"
  expiresAt?: string; // ISO date for daily/weekly quests
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'sales' | 'social' | 'learning' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: number;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  reward: number; // XP or bonus points
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatarUrl: string;
  rank: UserRank;
  score: number; // Could be sales, team volume, or XP
  change: number; // Position change from last week (-2, +5, etc.)
  badges: string[]; // Badge IDs
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  target: number;
  current: number;
  unit: 'sales' | 'revenue' | 'recruits' | 'products';
  deadline: string;
  aiSuggested: boolean;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
}

export interface AICoachingSession {
  id: string;
  userId: string;
  timestamp: string;
  topic: 'sales_strategy' | 'performance_analysis' | 'goal_setting' | 'product_knowledge' | 'general';
  userMessage: string;
  aiResponse: string;
  suggestions?: string[];
  actionItems?: string[];
}

export interface PerformanceMetrics {
  conversionRate: number;
  averageOrderValue: number;
  customerRetention: number;
  teamGrowthRate: number;
  topProducts: string[];
  bestPerformingDay: string;
  improvementAreas: string[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
}