/**
 * Team, referral, and MLM network domain types
 * Extracted from src/types.ts for file size management
 */

import type { UserRank } from './user-product-transaction-core-domain-types';

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
  level?: number;
  createdAt: string;
  registeredAt?: string;
  firstPurchaseAt?: string;
  totalRevenue: number;
  referralBonus: number;
  rank?: string;
  avatar?: string;
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

// AI Insights - At-Risk Members
export interface AtRiskMember {
  member: TeamMember;
  riskLevel: 'high' | 'medium' | 'low';
  riskReasons: string[];
  lastActive: string;
  daysInactive: number;
  suggestedActions: string[];
}

export interface TeamInsights {
  atRiskMembers: AtRiskMember[];
  totalAtRisk: number;
  highRiskCount: number;
  mediumRiskCount: number;
  retentionRate: number;
}
