export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

export const seoConfig: Record<string, SEOConfig> = {
  '/': {
    title: 'WellNexus - Nền tảng Phân phối Sản phẩm Sức khỏe',
    description: 'Hệ thống phân phối đa cấp với hoa hồng minh bạch, sản phẩm chất lượng cao, và công nghệ hiện đại. Tham gia WellNexus hôm nay.',
    keywords: ['wellnexus', 'phân phối', 'sức khỏe', 'hoa hồng', 'MLM'],
    ogImage: 'https://wellnexus.vn/og-home.png',
  },
  '/dashboard/marketplace': {
    title: 'Sản phẩm - WellNexus',
    description: 'Khám phá bộ sưu tập sản phẩm sức khỏe cao cấp với chứng nhận quốc tế, giá cạnh tranh và chương trình hoa hồng hấp dẫn.',
    keywords: ['sản phẩm sức khỏe', 'thực phẩm chức năng', 'wellnexus'],
    ogImage: 'https://wellnexus.vn/og-products.png',
  },
  '/dashboard/wallet': {
    title: 'Hệ thống Hoa hồng - WellNexus',
    description: 'Hệ thống hoa hồng 9 cấp minh bạch, tự động tính toán, và thanh toán nhanh chóng. Theo dõi thu nhập real-time.',
    keywords: ['hoa hồng', 'thu nhập thụ động', 'MLM', 'wellnexus'],
    ogImage: 'https://wellnexus.vn/og-commission.png',
  },
  '/login': {
    title: 'Đăng nhập - WellNexus',
    description: 'Đăng nhập vào tài khoản WellNexus để quản lý đơn hàng, theo dõi hoa hồng và truy cập dashboard.',
    noindex: true, // Don't index auth pages
  },
  '/admin': {
    title: 'Admin Dashboard - WellNexus',
    description: 'WellNexus Admin Panel',
    noindex: true,
  },
};

export const defaultSEO: SEOConfig = {
  title: 'WellNexus',
  description: 'Nền tảng phân phối sản phẩm sức khỏe cao cấp',
  ogImage: 'https://wellnexus.vn/og-default.png',
};
