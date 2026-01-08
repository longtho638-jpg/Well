import { User, UserRank, Product, Transaction, Quest, ChartDataPoint, TeamMember, TeamMetrics, Referral, ReferralStats, LandingPageTemplate, UserLandingPage, AtRiskMember, TeamInsights, RedemptionItem, RedemptionOrder } from '../types';
import { generateTxHash } from '../utils/tokenomics';

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
  rank: UserRank.DAI_SU,
  roleId: 6, // Added roleId
  totalSales: 16000000,
  teamVolume: 45000000,
  avatarUrl: 'https://ui-avatars.com/api/?name=Nguyen+Van+An&background=00575A&color=fff',
  joinedAt: '2024-01-15',
  kycStatus: true,
  nextPayoutDate: '15/06/2024',
  estimatedBonus: 2400000,
  referralLink: 'wellnexus.vn/ref/VN-888',
  // Token Balances (Initial state)
  shopBalance: 5000000,      // 5M VND available in SHOP tokens
  growBalance: 1500,         // 1,500 GROW tokens from completed quests
  stakedGrowBalance: 500,    // 500 GROW tokens locked in staking
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
    taxDeducted: 500000,
    hash: generateTxHash(),
    currency: 'SHOP'
  },
  {
    id: 'TX-02',
    userId: 'VN-888',
    date: '2024-05-22',
    amount: 375000,
    type: 'Direct Sale',
    status: 'completed',
    taxDeducted: 0,
    hash: generateTxHash(),
    currency: 'SHOP'
  },
];

// ===== PHASE 2: TEAM & REFERRAL DATA =====

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
    sponsorId: 'VN-888'
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
    sponsorId: 'VN-888'
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
    sponsorId: 'VN-888'
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
    sponsorId: 'VN-888'
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
    level: 1, // F1
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
    level: 1, // F1
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
    level: 2, // F2
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
    level: 2, // F2
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

// ===== TREE MAX LEVEL: AI LANDING BUILDER =====

export const LANDING_PAGE_TEMPLATES: LandingPageTemplate[] = [
  {
    id: 'TPL-ELEGANT',
    type: 'elegant',
    name: 'Sang Trọng',
    description: 'Thiết kế tinh tế, chuyên nghiệp cho doanh nhân thành đạt',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format',
    colorScheme: {
      primary: '#1e293b',
      secondary: '#f1f5f9',
      accent: '#d4af37'
    }
  },
  {
    id: 'TPL-DYNAMIC',
    type: 'dynamic',
    name: 'Năng Động',
    description: 'Phong cách hiện đại, trẻ trung, tràn đầy năng lượng',
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format',
    colorScheme: {
      primary: '#6366f1',
      secondary: '#f0f9ff',
      accent: '#f59e0b'
    }
  },
  {
    id: 'TPL-EXPERT',
    type: 'expert',
    name: 'Chuyên Gia',
    description: 'Thể hiện uy tín và chuyên môn cao trong lĩnh vực',
    imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format',
    colorScheme: {
      primary: '#00575A',
      secondary: '#f3f4f6',
      accent: '#FFBF00'
    }
  }
];

export const USER_LANDING_PAGES: UserLandingPage[] = [
  {
    id: 'LP-001',
    userId: 'VN-888',
    template: 'expert',
    portraitUrl: 'https://ui-avatars.com/api/?name=Nguyen+Van+An&background=00575A&color=fff&size=400',
    aiGeneratedBio: 'Tôi là Nguyễn Văn An - Leader cấp Partner tại WellNexus với 3 năm kinh nghiệm trong lĩnh vực chăm sóc sức khỏe. Đội ngũ của tôi đã giúp hơn 500 khách hàng cải thiện chất lượng cuộc sống. Chuyên môn: Tư vấn giấc ngủ, quản lý căng thẳng, và xây dựng đội nhóm thành công. Hãy để tôi đồng hành cùng bạn trên hành trình chinh phục mục tiêu tài chính và sức khỏe!',
    publishedUrl: 'wellnexus.vn/lp/VN-888',
    isPublished: true,
    createdAt: '2024-05-15',
    views: 1250,
    conversions: 45
  }
];

// ===== TREE MAX LEVEL: AI INSIGHTS (AT-RISK MEMBERS) =====

// Calculate at-risk members based on activity and sales
function calculateAtRiskMembers(): AtRiskMember[] {
  const today = new Date('2024-05-23');

  return TEAM_MEMBERS.map(member => {
    const lastActiveDate = new Date(member.lastActive);
    const daysInactive = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    const riskReasons: string[] = [];
    const suggestedActions: string[] = [];

    let riskLevel: 'high' | 'medium' | 'low' = 'low';

    // Check inactivity
    if (daysInactive >= 3) {
      riskReasons.push(`Không hoạt động ${daysInactive} ngày`);
      suggestedActions.push('Gửi tin nhắn động viên');
      riskLevel = 'high';
    } else if (daysInactive >= 2) {
      riskReasons.push(`${daysInactive} ngày chưa hoạt động`);
      suggestedActions.push('Nhắc nhở nhẹ nhàng');
      riskLevel = 'medium';
    }

    // Check sales performance
    if (member.personalSales === 0) {
      riskReasons.push('Chưa có doanh số');
      suggestedActions.push('Đào tạo kỹ năng bán hàng');
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    } else if (member.personalSales < 5000000) {
      riskReasons.push('Doanh số thấp');
      suggestedActions.push('Hỗ trợ tìm khách hàng');
    }

    // Check growth
    if (member.monthlyGrowth < 10) {
      riskReasons.push('Tăng trưởng chậm');
      suggestedActions.push('Tặng voucher khuyến khích');
    }

    // Check downlines
    if (member.activeDownlines === 0 && member.rank === UserRank.DAI_SU) {
      riskReasons.push('Chưa phát triển đội nhóm');
      suggestedActions.push('Hướng dẫn tuyển dụng');
    }

    return {
      member,
      riskLevel,
      riskReasons,
      lastActive: member.lastActive,
      daysInactive,
      suggestedActions
    };
  }).filter(arm => arm.riskReasons.length > 0) // Only return members with risks
    .sort((a, b) => {
      // Sort by risk level: high -> medium -> low
      const riskOrder = { high: 0, medium: 1, low: 2 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });
}

export const AT_RISK_MEMBERS: AtRiskMember[] = calculateAtRiskMembers();

export const TEAM_INSIGHTS: TeamInsights = {
  atRiskMembers: AT_RISK_MEMBERS,
  totalAtRisk: AT_RISK_MEMBERS.length,
  highRiskCount: AT_RISK_MEMBERS.filter(m => m.riskLevel === 'high').length,
  mediumRiskCount: AT_RISK_MEMBERS.filter(m => m.riskLevel === 'medium').length,
  retentionRate: ((TEAM_MEMBERS.length - AT_RISK_MEMBERS.filter(m => m.riskLevel === 'high').length) / TEAM_MEMBERS.length) * 100
};

// ===== TREE MAX LEVEL: REDEMPTION MARKETPLACE =====

export const REDEMPTION_ITEMS: RedemptionItem[] = [
  {
    id: 'REDEEM-001',
    name: 'iPhone 16 Pro Max 256GB',
    description: 'Flagship mới nhất từ Apple - Titanium Design, A18 Pro Chip, Camera System cực đỉnh',
    imageUrl: 'https://images.unsplash.com/photo-1695048064677-aa40ca7c5e43?w=800&auto=format',
    growCost: 50000,
    category: 'electronics',
    stock: 5,
    estimatedValue: 34990000,
    redemptionCount: 12,
    isAvailable: true,
    highlights: [
      'Chip A18 Pro 3nm siêu mạnh',
      'Camera 48MP với AI Processing',
      'Titanium Premium Design',
      'Bảo hành chính hãng 12 tháng'
    ]
  },
  {
    id: 'REDEEM-002',
    name: 'Tour Du Lịch Bali 5 Ngày 4 Đêm',
    description: 'Kỳ nghỉ thiên đường tại Bali - Resort 5 sao, vé máy bay, tour tham quan, đầy đủ tiện ích',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format',
    growCost: 20000,
    category: 'travel',
    stock: 10,
    estimatedValue: 25000000,
    redemptionCount: 34,
    isAvailable: true,
    highlights: [
      'Vé máy bay khứ hồi Vietnam Airlines',
      'Resort 5 sao view biển',
      'Hướng dẫn viên tiếng Việt',
      'Tour tham quan Ubud + Tanah Lot'
    ]
  },
  {
    id: 'REDEEM-003',
    name: 'Khóa Học CEO Mastery Program',
    description: 'Chương trình đào tạo lãnh đạo doanh nghiệp đẳng cấp quốc tế - 6 tháng intensive training',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format',
    growCost: 5000,
    category: 'education',
    stock: 20,
    estimatedValue: 15000000,
    redemptionCount: 67,
    isAvailable: true,
    highlights: [
      '6 tháng học intensive với CEO thực chiến',
      'Chứng chỉ quốc tế được công nhận',
      'Networking với 500+ doanh nhân',
      'Tài liệu độc quyền trị giá $5,000'
    ]
  },
  {
    id: 'REDEEM-004',
    name: 'MacBook Pro M4 Max 16" 1TB',
    description: 'Laptop chuyên nghiệp cho Creator - M4 Max Chip, 48GB RAM, hiệu năng đỉnh cao',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format',
    growCost: 75000,
    category: 'electronics',
    stock: 3,
    estimatedValue: 89990000,
    redemptionCount: 8,
    isAvailable: true,
    highlights: [
      'M4 Max Chip 40-core GPU',
      '48GB Unified Memory',
      '1TB SSD siêu nhanh',
      'Màn hình Liquid Retina XDR 16.2"'
    ]
  },
  {
    id: 'REDEEM-005',
    name: 'Trải Nghiệm Michelin Star Dining',
    description: 'Bữa tối sang trọng tại nhà hàng Michelin 2 sao - Dành cho 2 người, menu 12 món đặc biệt',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format',
    growCost: 3000,
    category: 'experience',
    stock: 15,
    estimatedValue: 8000000,
    redemptionCount: 89,
    isAvailable: true,
    highlights: [
      'Menu degustación 12 món cao cấp',
      'Wine pairing từ sommelier chuyên nghiệp',
      'Không gian riêng tư VIP',
      'Ảnh lưu niệm chuyên nghiệp'
    ]
  },
  {
    id: 'REDEEM-006',
    name: 'Tesla Model 3 Test Drive + Consultation',
    description: 'Trải nghiệm lái thử Tesla Model 3 trong 3 ngày + Tư vấn mua xe điện miễn phí',
    imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format',
    growCost: 2000,
    category: 'experience',
    stock: 8,
    estimatedValue: 5000000,
    redemptionCount: 45,
    isAvailable: true,
    highlights: [
      'Lái thử Tesla Model 3 trong 3 ngày',
      'Tư vấn chuyên sâu về xe điện',
      'Hỗ trợ thủ tục mua xe',
      'Voucher giảm 50M khi quyết định mua'
    ]
  }
];

export const REDEMPTION_ORDERS: RedemptionOrder[] = [
  {
    id: 'RO-001',
    userId: 'VN-888',
    itemId: 'REDEEM-003',
    itemName: 'Khóa Học CEO Mastery Program',
    growSpent: 5000,
    status: 'completed',
    createdAt: '2024-04-15',
    completedAt: '2024-04-16',
    trackingNumber: 'WN-CEO-2024-001'
  }
];