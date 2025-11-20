import { User, UserRank, Product, Transaction, Quest, ChartDataPoint } from '../types';

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