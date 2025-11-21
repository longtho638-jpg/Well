import { User, UserRank, Product, Transaction, Quest, ChartDataPoint, TeamMember, TeamMetrics, Referral, ReferralStats } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'PROD-119',
    name: 'Combo ANIMA 119',
    price: 1500000,
    commissionRate: 0.25,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    description: 'Energy & Focus Supplement. Boosts daily performance naturally. Best seller.',
    salesCount: 124,
    stock: 50,
  },
  {
    id: 'PROD-120',
    name: 'WellNexus Starter Kit',
    price: 3500000,
    commissionRate: 0.20,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
    description: 'Business Starter Kit. Everything you need to launch your journey.',
    salesCount: 85,
    stock: 20,
  },
  {
    id: 'PROD-121',
    name: 'Immune Boost Pack',
    price: 900000,
    commissionRate: 0.15,
    imageUrl: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=400&q=80',
    description: 'Daily Vitamin C+ for family health protection.',
    salesCount: 56,
    stock: 100,
  }
];

export const CURRENT_USER: User = {
  id: 'VN-888',
  name: 'Nguyen Van An',
  email: 'an.nguyen@wellnexus.vn',
  rank: UserRank.PARTNER,
  totalSales: 16000000,
  teamVolume: 45000000,
  avatarUrl: 'https://ui-avatars.com/api/?name=Nguyen+Van+An&background=00575A&color=fff',
  joinedAt: '2024-01-15',
  kycStatus: true,
  nextPayoutDate: '15/06/2024',
  estimatedBonus: 2400000,
  referralLink: 'wellnexus.vn/ref/VN-888',
};

export const DAILY_QUESTS: Quest[] = [
  {
    id: 'Q1',
    title: 'Connect',
    description: 'Share referral link with 5 friends',
    xp: 50,
    type: 'sales',
    isCompleted: false,
  },
  {
    id: 'Q2',
    title: 'Educate',
    description: 'Read "Compliance 101" article',
    xp: 20,
    type: 'learning',
    isCompleted: true,
  },
];

export const REVENUE_DATA: ChartDataPoint[] = [
  { name: 'Mon', value: 2000000 },
  { name: 'Tue', value: 4500000 },
  { name: 'Wed', value: 3000000 },
  { name: 'Thu', value: 8000000 },
  { name: 'Fri', value: 5500000 },
  { name: 'Sat', value: 9000000 },
  { name: 'Sun', value: 12000000 },
];

export const TRANSACTIONS: Transaction[] = [
    {
        id: 'TX-01',
        userId: 'VN-888',
        date: '2024-05-20',
        amount: 5000000,
        type: 'Team Volume Bonus',
        status: 'completed',
        taxDeducted: 500000
    },
    {
        id: 'TX-02',
        userId: 'VN-888',
        date: '2024-05-22',
        amount: 375000,
        type: 'Direct Sale',
        status: 'completed',
        taxDeducted: 0
    },
];

// ===== PHASE 2: TEAM & REFERRAL DATA =====

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'VN-1001',
    name: 'Trần Thị Mai',
    email: 'mai.tran@example.com',
    rank: UserRank.PARTNER,
    joinedAt: '2024-02-10',
    avatarUrl: 'https://ui-avatars.com/api/?name=Tran+Thi+Mai&background=6366f1&color=fff',
    personalSales: 12000000,
    teamVolume: 28000000,
    activeDownlines: 5,
    monthlyGrowth: 15.5,
    lastActive: '2024-05-23',
    sponsorId: 'VN-888'
  },
  {
    id: 'VN-1002',
    name: 'Lê Văn Hùng',
    email: 'hung.le@example.com',
    rank: UserRank.MEMBER,
    joinedAt: '2024-03-15',
    avatarUrl: 'https://ui-avatars.com/api/?name=Le+Van+Hung&background=8b5cf6&color=fff',
    personalSales: 8500000,
    teamVolume: 8500000,
    activeDownlines: 0,
    monthlyGrowth: 25.3,
    lastActive: '2024-05-23',
    sponsorId: 'VN-888'
  },
  {
    id: 'VN-1003',
    name: 'Phạm Minh Tuấn',
    email: 'tuan.pham@example.com',
    rank: UserRank.PARTNER,
    joinedAt: '2024-01-20',
    avatarUrl: 'https://ui-avatars.com/api/?name=Pham+Minh+Tuan&background=ec4899&color=fff',
    personalSales: 15000000,
    teamVolume: 35000000,
    activeDownlines: 7,
    monthlyGrowth: 10.2,
    lastActive: '2024-05-22',
    sponsorId: 'VN-888'
  },
  {
    id: 'VN-1004',
    name: 'Nguyễn Thị Hoa',
    email: 'hoa.nguyen@example.com',
    rank: UserRank.MEMBER,
    joinedAt: '2024-04-05',
    avatarUrl: 'https://ui-avatars.com/api/?name=Nguyen+Thi+Hoa&background=f59e0b&color=fff',
    personalSales: 5200000,
    teamVolume: 5200000,
    activeDownlines: 0,
    monthlyGrowth: 45.8,
    lastActive: '2024-05-23',
    sponsorId: 'VN-888'
  },
  {
    id: 'VN-1005',
    name: 'Đỗ Quang Minh',
    email: 'minh.do@example.com',
    rank: UserRank.MEMBER,
    joinedAt: '2024-04-20',
    avatarUrl: 'https://ui-avatars.com/api/?name=Do+Quang+Minh&background=10b981&color=fff',
    personalSales: 3800000,
    teamVolume: 3800000,
    activeDownlines: 0,
    monthlyGrowth: 30.5,
    lastActive: '2024-05-21',
    sponsorId: 'VN-888'
  }
];

export const TEAM_METRICS: TeamMetrics = {
  totalMembers: 5,
  activeMembers: 4,
  totalTeamVolume: 80500000,
  monthlyGrowth: 22.5,
  averageSalesPerMember: 16100000,
  topPerformers: [TEAM_MEMBERS[2], TEAM_MEMBERS[0], TEAM_MEMBERS[1]]
};

export const REFERRALS: Referral[] = [
  {
    id: 'REF-001',
    referrerId: 'VN-888',
    referredUserId: 'VN-1001',
    referredName: 'Trần Thị Mai',
    referredEmail: 'mai.tran@example.com',
    status: 'active',
    createdAt: '2024-02-10',
    registeredAt: '2024-02-10',
    firstPurchaseAt: '2024-02-12',
    totalRevenue: 12000000,
    referralBonus: 1200000
  },
  {
    id: 'REF-002',
    referrerId: 'VN-888',
    referredUserId: 'VN-1002',
    referredName: 'Lê Văn Hùng',
    referredEmail: 'hung.le@example.com',
    status: 'active',
    createdAt: '2024-03-15',
    registeredAt: '2024-03-15',
    firstPurchaseAt: '2024-03-18',
    totalRevenue: 8500000,
    referralBonus: 850000
  },
  {
    id: 'REF-003',
    referrerId: 'VN-888',
    referredName: 'Võ Thị Lan',
    referredEmail: 'lan.vo@example.com',
    status: 'pending',
    createdAt: '2024-05-20',
    totalRevenue: 0,
    referralBonus: 0
  },
  {
    id: 'REF-004',
    referrerId: 'VN-888',
    referredUserId: 'VN-1004',
    referredName: 'Nguyễn Thị Hoa',
    referredEmail: 'hoa.nguyen@example.com',
    status: 'active',
    createdAt: '2024-04-05',
    registeredAt: '2024-04-05',
    firstPurchaseAt: '2024-04-07',
    totalRevenue: 5200000,
    referralBonus: 520000
  }
];

export const REFERRAL_STATS: ReferralStats = {
  totalReferrals: 4,
  activeReferrals: 3,
  conversionRate: 75,
  totalBonus: 2570000,
  monthlyReferrals: 1,
  referralLink: 'wellnexus.vn/ref/VN-888'
};