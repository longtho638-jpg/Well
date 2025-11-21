export type AppView = 'dashboard' | 'marketplace' | 'wallet';

export enum UserRank {
  MEMBER = 'Member',
  PARTNER = 'Partner',
  FOUNDER_CLUB = 'Founder Club',
}

export type TransactionType = 'Direct Sale' | 'Team Volume Bonus' | 'Withdrawal';

export type TokenType = 'SHOP' | 'GROW';

export interface TokenBalance {
  amount: number;
  locked: number;
  staking: number;
}

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
  // Token Balances (Dual Token System)
  shopBalance: number;      // SHOP token (VND) - from sales
  growBalance: number;      // GROW token - from quests/staking
  stakedGrowBalance: number; // Locked GROW tokens in staking
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
  hash: string;
  currency: TokenType;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  type: 'onboarding' | 'sales' | 'learning';
  isCompleted: boolean;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

// ===== PHASE 2: GROWTH FEATURES =====

// The Copilot - AI Sales Assistant
export interface CopilotConversation {
  id: string;
  userId: string;
  messages: CopilotMessage[];
  productContext?: string;
  createdAt: string;
  status: 'active' | 'completed';
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  objectionType?: ObjectionType;
  suggestion?: string;
}

export type ObjectionType =
  | 'price'
  | 'skepticism'
  | 'competition'
  | 'timing'
  | 'need'
  | 'general';

export interface ObjectionTemplate {
  type: ObjectionType;
  keywords: string[];
  responses: string[];
}

// Leader Dashboard - Team Management
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  rank: UserRank;
  joinedAt: string;
  avatarUrl: string;
  personalSales: number;
  teamVolume: number;
  activeDownlines: number;
  monthlyGrowth: number;
  lastActive: string;
  sponsorId: string;
}

export interface TeamMetrics {
  totalMembers: number;
  activeMembers: number;
  totalTeamVolume: number;
  monthlyGrowth: number;
  averageSalesPerMember: number;
  topPerformers: TeamMember[];
}

// Referral System
export interface Referral {
  id: string;
  referrerId: string;
  referredUserId?: string;
  referredName?: string;
  referredEmail?: string;
  status: 'pending' | 'registered' | 'active' | 'expired';
  createdAt: string;
  registeredAt?: string;
  firstPurchaseAt?: string;
  totalRevenue: number;
  referralBonus: number;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  totalBonus: number;
  monthlyReferrals: number;
  referralLink: string;
}

export interface ReferralReward {
  id: string;
  userId: string;
  referralId: string;
  amount: number;
  type: 'signup_bonus' | 'first_purchase' | 'milestone';
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
}