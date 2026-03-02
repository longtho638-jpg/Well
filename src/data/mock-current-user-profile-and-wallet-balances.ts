/**
 * Mock data: current authenticated user profile, wallet balances, and referral link
 */

import { User, UserRank } from '../types';

export const CURRENT_USER: User = {
  id: 'VN-888',
  name: 'Nguyen Van An',
  email: 'user@example.com',
  rank: UserRank.DAI_SU,
  roleId: 6,
  totalSales: 16000000,
  teamVolume: 45000000,
  avatarUrl: 'https://ui-avatars.com/api/?name=Nguyen+Van+An&background=00575A&color=fff',
  joinedAt: '2024-01-15',
  kycStatus: true,
  nextPayoutDate: '15/06/2024',
  estimatedBonus: 2400000,
  referralLink: 'wellnexus.vn/ref/VN-888',
  shopBalance: 5000000,
  growBalance: 1500,
  stakedGrowBalance: 500,
};
