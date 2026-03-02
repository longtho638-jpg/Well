/**
 * Mock data: team members, team metrics, referrals, referral stats, at-risk analysis, and team insights
 */

import { UserRank, TeamMember, TeamMetrics, Referral, ReferralStats, AtRiskMember, TeamInsights } from '../types';

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'VN-1001',
    name: 'Trần Thị Mai',
    email: 'mai.tran@example.com',
    rank: UserRank.DAI_SU,
    joinedAt: '2024-02-10',
    avatarUrl: 'https://ui-avatars.com/api/?name=Tran+Thi+Mai&background=6366f1&color=fff',
    personalSales: 12000000,
    teamVolume: 28000000,
    activeDownlines: 5,
    monthlyGrowth: 15.5,
    lastActive: '2024-05-23',
    sponsorId: 'VN-888',
  },
  {
    id: 'VN-1002',
    name: 'Lê Văn Hùng',
    email: 'hung.le@example.com',
    rank: UserRank.CTV,
    joinedAt: '2024-03-15',
    avatarUrl: 'https://ui-avatars.com/api/?name=Le+Van+Hung&background=8b5cf6&color=fff',
    personalSales: 8500000,
    teamVolume: 8500000,
    activeDownlines: 0,
    monthlyGrowth: 25.3,
    lastActive: '2024-05-23',
    sponsorId: 'VN-888',
  },
  {
    id: 'VN-1003',
    name: 'Phạm Minh Tuấn',
    email: 'tuan.pham@example.com',
    rank: UserRank.DAI_SU,
    joinedAt: '2024-01-20',
    avatarUrl: 'https://ui-avatars.com/api/?name=Pham+Minh+Tuan&background=ec4899&color=fff',
    personalSales: 15000000,
    teamVolume: 35000000,
    activeDownlines: 7,
    monthlyGrowth: 10.2,
    lastActive: '2024-05-22',
    sponsorId: 'VN-888',
  },
  {
    id: 'VN-1004',
    name: 'Nguyễn Thị Hoa',
    email: 'hoa.nguyen@example.com',
    rank: UserRank.CTV,
    joinedAt: '2024-04-05',
    avatarUrl: 'https://ui-avatars.com/api/?name=Nguyen+Thi+Hoa&background=f59e0b&color=fff',
    personalSales: 5200000,
    teamVolume: 5200000,
    activeDownlines: 0,
    monthlyGrowth: 45.8,
    lastActive: '2024-05-23',
    sponsorId: 'VN-888',
  },
  {
    id: 'VN-1005',
    name: 'Đỗ Quang Minh',
    email: 'minh.do@example.com',
    rank: UserRank.CTV,
    joinedAt: '2024-04-20',
    avatarUrl: 'https://ui-avatars.com/api/?name=Do+Quang+Minh&background=10b981&color=fff',
    personalSales: 3800000,
    teamVolume: 3800000,
    activeDownlines: 0,
    monthlyGrowth: 30.5,
    lastActive: '2024-05-21',
    sponsorId: 'VN-888',
  },
];

export const TEAM_METRICS: TeamMetrics = {
  totalMembers: 5,
  activeMembers: 4,
  totalTeamVolume: 80500000,
  monthlyGrowth: 22.5,
  averageSalesPerMember: 16100000,
  topPerformers: [TEAM_MEMBERS[2], TEAM_MEMBERS[0], TEAM_MEMBERS[1]],
};

export const REFERRALS: Referral[] = [
  {
    id: 'REF-001',
    referrerId: 'VN-888',
    referredUserId: 'VN-1001',
    referredName: 'Trần Thị Mai',
    referredEmail: 'mai.tran@example.com',
    status: 'active',
    level: 1,
    createdAt: '2024-02-10',
    registeredAt: '2024-02-10',
    firstPurchaseAt: '2024-02-12',
    totalRevenue: 12000000,
    referralBonus: 1200000,
  },
  {
    id: 'REF-002',
    referrerId: 'VN-888',
    referredUserId: 'VN-1002',
    referredName: 'Lê Văn Hùng',
    referredEmail: 'hung.le@example.com',
    status: 'active',
    level: 1,
    createdAt: '2024-03-15',
    registeredAt: '2024-03-15',
    firstPurchaseAt: '2024-03-18',
    totalRevenue: 8500000,
    referralBonus: 850000,
  },
  {
    id: 'REF-003',
    referrerId: 'VN-888',
    referredName: 'Võ Thị Lan',
    referredEmail: 'lan.vo@example.com',
    status: 'pending',
    level: 2,
    createdAt: '2024-05-20',
    totalRevenue: 0,
    referralBonus: 0,
  },
  {
    id: 'REF-004',
    referrerId: 'VN-888',
    referredUserId: 'VN-1004',
    referredName: 'Nguyễn Thị Hoa',
    referredEmail: 'hoa.nguyen@example.com',
    status: 'active',
    level: 2,
    createdAt: '2024-04-05',
    registeredAt: '2024-04-05',
    firstPurchaseAt: '2024-04-07',
    totalRevenue: 5200000,
    referralBonus: 520000,
  },
];

export const REFERRAL_STATS: ReferralStats = {
  totalReferrals: 4,
  activeReferrals: 3,
  conversionRate: 75,
  totalBonus: 2570000,
  monthlyReferrals: 1,
  referralLink: 'wellnexus.vn/ref/VN-888',
};

function calculateAtRiskMembers(): AtRiskMember[] {
  const today = new Date('2024-05-23');

  return TEAM_MEMBERS.map((member) => {
    const lastActiveDate = new Date(member.lastActive);
    const daysInactive = Math.floor(
      (today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const riskReasons: string[] = [];
    const suggestedActions: string[] = [];
    let riskLevel: 'high' | 'medium' | 'low' = 'low';

    if (daysInactive >= 3) {
      riskReasons.push(`Không hoạt động ${daysInactive} ngày`);
      suggestedActions.push('Gửi tin nhắn động viên');
      riskLevel = 'high';
    } else if (daysInactive >= 2) {
      riskReasons.push(`${daysInactive} ngày chưa hoạt động`);
      suggestedActions.push('Nhắc nhở nhẹ nhàng');
      riskLevel = 'medium';
    }

    if (member.personalSales === 0) {
      riskReasons.push('Chưa có doanh số');
      suggestedActions.push('Đào tạo kỹ năng bán hàng');
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    } else if (member.personalSales < 5000000) {
      riskReasons.push('Doanh số thấp');
      suggestedActions.push('Hỗ trợ tìm khách hàng');
    }

    if (member.monthlyGrowth < 10) {
      riskReasons.push('Tăng trưởng chậm');
      suggestedActions.push('Tặng voucher khuyến khích');
    }

    if (member.activeDownlines === 0 && member.rank === UserRank.DAI_SU) {
      riskReasons.push('Chưa phát triển đội nhóm');
      suggestedActions.push('Hướng dẫn tuyển dụng');
    }

    return { member, riskLevel, riskReasons, lastActive: member.lastActive, daysInactive, suggestedActions };
  })
    .filter((arm) => arm.riskReasons.length > 0)
    .sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });
}

export const AT_RISK_MEMBERS: AtRiskMember[] = calculateAtRiskMembers();

export const TEAM_INSIGHTS: TeamInsights = {
  atRiskMembers: AT_RISK_MEMBERS,
  totalAtRisk: AT_RISK_MEMBERS.length,
  highRiskCount: AT_RISK_MEMBERS.filter((m) => m.riskLevel === 'high').length,
  mediumRiskCount: AT_RISK_MEMBERS.filter((m) => m.riskLevel === 'medium').length,
  retentionRate:
    ((TEAM_MEMBERS.length - AT_RISK_MEMBERS.filter((m) => m.riskLevel === 'high').length) /
      TEAM_MEMBERS.length) *
    100,
};
