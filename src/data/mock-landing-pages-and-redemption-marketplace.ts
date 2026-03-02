/**
 * Mock data: AI landing page templates, user landing pages, and redemption marketplace items/orders
 */

import { LandingPageTemplate, UserLandingPage, RedemptionItem, RedemptionOrder } from '../types';

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
      accent: '#d4af37',
    },
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
      accent: '#f59e0b',
    },
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
      accent: '#FFBF00',
    },
  },
];

export const USER_LANDING_PAGES: UserLandingPage[] = [
  {
    id: 'LP-001',
    userId: 'VN-888',
    template: 'expert',
    portraitUrl:
      'https://ui-avatars.com/api/?name=Nguyen+Van+An&background=00575A&color=fff&size=400',
    aiGeneratedBio:
      'Tôi là Nguyễn Văn An - Leader cấp Partner tại WellNexus với 3 năm kinh nghiệm trong lĩnh vực chăm sóc sức khỏe. Đội ngũ của tôi đã giúp hơn 500 khách hàng cải thiện chất lượng cuộc sống. Chuyên môn: Tư vấn giấc ngủ, quản lý căng thẳng, và xây dựng đội nhóm thành công. Hãy để tôi đồng hành cùng bạn trên hành trình chinh phục mục tiêu tài chính và sức khỏe!',
    publishedUrl: 'wellnexus.vn/lp/VN-888',
    isPublished: true,
    createdAt: '2024-05-15',
    views: 1250,
    conversions: 45,
  },
];

export const REDEMPTION_ITEMS: RedemptionItem[] = [
  {
    id: 'REDEEM-001',
    name: 'iPhone 16 Pro Max 256GB',
    description:
      'Flagship mới nhất từ Apple - Titanium Design, A18 Pro Chip, Camera System cực đỉnh',
    imageUrl:
      'https://images.unsplash.com/photo-1695048064677-aa40ca7c5e43?w=800&auto=format',
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
      'Bảo hành chính hãng 12 tháng',
    ],
  },
  {
    id: 'REDEEM-002',
    name: 'Tour Du Lịch Bali 5 Ngày 4 Đêm',
    description:
      'Kỳ nghỉ thiên đường tại Bali - Resort 5 sao, vé máy bay, tour tham quan, đầy đủ tiện ích',
    imageUrl:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format',
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
      'Tour tham quan Ubud + Tanah Lot',
    ],
  },
  {
    id: 'REDEEM-003',
    name: 'Khóa Học CEO Mastery Program',
    description:
      'Chương trình đào tạo lãnh đạo doanh nghiệp đẳng cấp quốc tế - 6 tháng intensive training',
    imageUrl:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format',
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
      'Tài liệu độc quyền trị giá $5,000',
    ],
  },
  {
    id: 'REDEEM-004',
    name: 'MacBook Pro M4 Max 16" 1TB',
    description:
      'Laptop chuyên nghiệp cho Creator - M4 Max Chip, 48GB RAM, hiệu năng đỉnh cao',
    imageUrl:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format',
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
      'Màn hình Liquid Retina XDR 16.2"',
    ],
  },
  {
    id: 'REDEEM-005',
    name: 'Trải Nghiệm Michelin Star Dining',
    description:
      'Bữa tối sang trọng tại nhà hàng Michelin 2 sao - Dành cho 2 người, menu 12 món đặc biệt',
    imageUrl:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format',
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
      'Ảnh lưu niệm chuyên nghiệp',
    ],
  },
  {
    id: 'REDEEM-006',
    name: 'Tesla Model 3 Test Drive + Consultation',
    description:
      'Trải nghiệm lái thử Tesla Model 3 trong 3 ngày + Tư vấn mua xe điện miễn phí',
    imageUrl:
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format',
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
      'Voucher giảm 50M khi quyết định mua',
    ],
  },
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
    trackingNumber: 'WN-CEO-2024-001',
  },
];
