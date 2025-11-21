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
  // Wealth OS Metrics (Investment-Grade Data)
  businessValuation?: number;    // Valuation = Monthly Profit * 12 * PE Ratio
  monthlyProfit?: number;        // Net profit (after tax & expenses)
  projectedAnnualProfit?: number;// Annualized profit projection
  equityValue?: number;          // GROW token equity value
  cashflowValue?: number;        // SHOP token cashflow value
  assetGrowthRate?: number;      // Monthly asset growth percentage
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

// ===== TREE MAX LEVEL: AI LANDING BUILDER =====

export type LandingPageTemplateType = 'elegant' | 'dynamic' | 'expert';

export interface LandingPageTemplate {
  id: string;
  type: LandingPageTemplateType;
  name: string;
  description: string;
  imageUrl: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface UserLandingPage {
  id: string;
  userId: string;
  template: LandingPageTemplateType;
  portraitUrl?: string;
  aiGeneratedBio: string;
  customBio?: string;
  publishedUrl: string;
  isPublished: boolean;
  createdAt: string;
  views: number;
  conversions: number;
}

// ===== TREE MAX LEVEL: AI INSIGHTS (AT-RISK MEMBERS) =====

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

// ===== TREE MAX LEVEL: REDEMPTION MARKETPLACE =====

export interface RedemptionItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  growCost: number;
  category: 'electronics' | 'travel' | 'education' | 'experience';
  stock: number;
  estimatedValue: number; // VND value equivalent
  redemptionCount: number;
  isAvailable: boolean;
  highlights: string[];
}

export interface RedemptionOrder {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  growSpent: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed';
  createdAt: string;
  completedAt?: string;
  trackingNumber?: string;
}