export enum UserRank {
  MEMBER = 'Member',
  PARTNER = 'Partner',
  FOUNDER_CLUB = 'Founder Club',
}

export interface User {
  id: string;
  name: string;
  rank: UserRank;
  totalSales: number; // Personal Sales
  teamVolume: number; // Group Volume
  avatarUrl: string;
  nextPayoutDate: string;
  estimatedBonus: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  commissionRate: number; 
  imageUrl: string;
  description: string;
  salesCount: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'Direct Sale' | 'Team Bonus' | 'Withdrawal';
  status: 'pending' | 'completed';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  isCompleted: boolean;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}