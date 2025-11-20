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
  type: 'onboarding' | 'sales' | 'learning';
  isCompleted: boolean;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}