
// ENUMS
export type UserRank = 'Member' | 'Partner' | 'Leader' | 'Founder Club';
export type TransactionType = 'Direct Sale' | 'Team Volume Bonus' | 'Withdrawal' | 'Tax Deduction';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type QuestType = 'onboarding' | 'sales' | 'learning';

// INTERFACES
export interface User {
  id: string;
  name: string;
  email: string;
  rank: UserRank;
  avatarUrl: string;
  referralLink: string;
  uplineId?: string;
  joinedAt: string;
  kycStatus: boolean;
  
  // Dynamic Stats
  totalSales: number;
  teamVolume: number;
  nextPayoutDate: string;
  estimatedBonus: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  commissionRate: number; // e.g., 0.25
  imageUrl: string;
  description: string;
  salesCount: number;
  stock: number;
}

export interface Transaction {
  id: string;
  userId: string;
  date: string;
  amount: number; // Gross Amount
  type: TransactionType;
  status: TransactionStatus;
  taxDeducted: number; // VN_PIT_10 Calculated
  relatedOrderId?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  type: QuestType;
  isCompleted: boolean;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}
