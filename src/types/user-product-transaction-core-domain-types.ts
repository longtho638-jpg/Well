/**
 * Core domain types — user, product, transaction, quest, chart
 * Extracted from src/types.ts for file size management
 */

export type AppView = 'dashboard' | 'marketplace' | 'wallet';

export enum UserRank {
  THIEN_LONG = 1,
  PHUONG_HOANG = 2,
  DAI_SU_DIAMOND = 3,
  DAI_SU_GOLD = 4,
  DAI_SU_SILVER = 5,
  DAI_SU = 6,
  KHOI_NGHIEP = 7,
  CTV = 8,
}

export const RANK_NAMES = {
  [UserRank.THIEN_LONG]: 'ranks.thien_long',
  [UserRank.PHUONG_HOANG]: 'ranks.phuong_hoang',
  [UserRank.DAI_SU_DIAMOND]: 'ranks.dai_su_diamond',
  [UserRank.DAI_SU_GOLD]: 'ranks.dai_su_gold',
  [UserRank.DAI_SU_SILVER]: 'ranks.dai_su_silver',
  [UserRank.DAI_SU]: 'ranks.dai_su',
  [UserRank.KHOI_NGHIEP]: 'ranks.khoi_nghiep',
  [UserRank.CTV]: 'ranks.ctv',
} as const;

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
  roleId: number;
  role?: 'admin' | 'super_admin' | 'user';
  isAdmin?: boolean;
  sponsorId?: string;
  totalSales: number;
  teamVolume: number;
  avatarUrl: string;
  joinedAt: string;
  kycStatus: boolean;
  nextPayoutDate?: string;
  estimatedBonus?: number;
  referralLink?: string;
  shopBalance: number;
  growBalance: number;
  pendingCashback?: number;
  pointBalance?: number;
  stakedGrowBalance: number;
  businessValuation?: number;
  monthlyProfit?: number;
  projectedAnnualProfit?: number;
  equityValue?: number;
  cashflowValue?: number;
  assetGrowthRate?: number;
  accumulatedBonusRevenue?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  bonusRevenue?: number;
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
  status: 'pending' | 'completed' | 'failed';
  taxDeducted?: number;
  hash?: string;
  currency: TokenType;
  metadata?: {
    source_tx_id?: string;
    trigger_agent?: string;
    reward_rate?: string;
    timestamp?: string;
    [key: string]: string | number | boolean | undefined;
  };
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

export interface CartItem {
  product: Product;
  quantity: number;
}
