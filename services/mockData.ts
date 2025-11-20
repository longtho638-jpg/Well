import { User, Product, Transaction, Quest } from '../types';

export const CURRENT_USER: User = {
  id: 'VN-888',
  name: 'Nguyen Van An',
  email: 'nguyen.van.an@example.com',
  rank: 'Partner',
  totalSales: 15500000,
  teamVolume: 45000000,
  avatarUrl: 'https://picsum.photos/200',
  referralLink: 'https://wellnexus.vn/ref/VN-888',
  joinedAt: '2024-01-15',
  kycStatus: true,
  nextPayoutDate: '2024-06-15',
  estimatedBonus: 2500000,
};

export const PRODUCTS: Product[] = [
  {
    id: 'PROD-119',
    name: 'Combo ANIMA 119',
    price: 1500000,
    commissionRate: 0.25, // 25% Direct Commission
    imageUrl: 'https://picsum.photos/400/400',
    description: 'Premium wellness supplement. Supports energy & focus. Best seller 2024.',
    stock: 50,
    salesCount: 120,
  },
  {
    id: 'PROD-120',
    name: 'WellNexus Starter Kit',
    price: 3500000,
    commissionRate: 0.20,
    imageUrl: 'https://picsum.photos/401/401',
    description: 'Everything you need to start your journey. Includes 3x ANIMA 119.',
    stock: 100,
    salesCount: 45,
  },
];

export const TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-001',
    userId: 'VN-888',
    date: '2024-05-20',
    amount: 375000, // Commission for 1.5M product
    type: 'Direct Sale',
    status: 'completed',
    taxDeducted: 0, // Under threshold
  },
  {
    id: 'TX-002',
    userId: 'VN-888',
    date: '2024-05-22',
    amount: 5000000, // Team bonus
    type: 'Team Volume Bonus',
    status: 'completed',
    taxDeducted: 500000, // 10% Tax because > 2M
  },
  {
    id: 'TX-003',
    userId: 'VN-888',
    date: '2024-05-23',
    amount: 375000,
    type: 'Direct Sale',
    status: 'pending',
    taxDeducted: 0,
  },
];

export const DAILY_QUESTS: Quest[] = [
  {
    id: 'Q1',
    title: 'Connect',
    description: 'Share your referral link with 5 friends.',
    xp: 50,
    type: 'sales',
    isCompleted: false,
  },
  {
    id: 'Q2',
    title: 'Educate',
    description: 'Read the "Compliance 101" article.',
    xp: 20,
    type: 'learning',
    isCompleted: true,
  },
];

export const SALES_DATA = [
  { name: 'Mon', sales: 1500000 },
  { name: 'Tue', sales: 3000000 },
  { name: 'Wed', sales: 0 },
  { name: 'Thu', sales: 4500000 },
  { name: 'Fri', sales: 1500000 },
  { name: 'Sat', sales: 6000000 },
  { name: 'Sun', sales: 7500000 },
];
