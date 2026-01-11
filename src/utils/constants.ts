/**
 * Application Constants and Config
 * Phase 15: Regex and Config
 */

// ============================================================================
// APP CONFIG
// ============================================================================

export const APP_CONFIG = {
    name: 'WellNexus',
    version: '1.0.0-seed',
    description: 'Social Commerce Platform for Wellness Products',
    url: 'https://wellnexus.vn',

    // Feature flags
    features: {
        darkMode: true,
        offlineMode: true,
        analytics: true,
        notifications: true,
        ai: true,
    },

    // Limits
    limits: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxImageSize: 5 * 1024 * 1024, // 5MB
        maxMessageLength: 5000,
        pageSize: 20,
    },

    // Timeouts (ms)
    timeouts: {
        api: 30000,
        upload: 60000,
        session: 30 * 60 * 1000, // 30 minutes
        cache: 5 * 60 * 1000, // 5 minutes
    },
} as const;

// ============================================================================
// MLM CONSTANTS
// ============================================================================

export const MLM_CONFIG = {
    ranks: [
        { id: 1, name: 'Starter', minVolume: 0, commission: 5 },
        { id: 2, name: 'Bronze', minVolume: 5_000_000, commission: 8 },
        { id: 3, name: 'Silver', minVolume: 20_000_000, commission: 12 },
        { id: 4, name: 'Gold', minVolume: 50_000_000, commission: 15 },
        { id: 5, name: 'Platinum', minVolume: 100_000_000, commission: 18 },
        { id: 6, name: 'Diamond', minVolume: 250_000_000, commission: 22 },
        { id: 7, name: 'Crown', minVolume: 500_000_000, commission: 25 },
        { id: 8, name: 'Royal', minVolume: 1_000_000_000, commission: 30 },
    ],

    teamBonusLevels: [10, 5, 3, 2, 1], // % for levels 1-5

    withdrawalMinimum: 500_000, // 500k VND
    withdrawalFee: 0.02, // 2%
} as const;

// ============================================================================
// ROUTES
// ============================================================================

export const ROUTES = {
    home: '/',
    login: '/login',
    signup: '/signup',
    dashboard: '/dashboard',
    marketplace: '/marketplace',
    network: '/network',
    wallet: '/wallet',
    shop: '/shop',
    profile: '/profile',
    settings: '/settings',
    admin: '/admin',

    // Admin subroutes
    adminOverview: '/admin/overview',
    adminContent: '/admin/content',
    adminPartners: '/admin/partners',
    adminFinance: '/admin/finance',
    adminOrders: '/admin/orders',
    adminProducts: '/admin/products',
    adminStrategy: '/admin/strategy',
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API = {
    base: import.meta.env.VITE_API_URL || 'https://api.wellnexus.vn',

    auth: {
        login: '/auth/login',
        signup: '/auth/signup',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        verify: '/auth/verify',
    },

    users: {
        me: '/users/me',
        profile: '/users/profile',
        network: '/users/network',
    },

    products: {
        list: '/products',
        detail: (id: string) => `/products/${id}`,
    },

    orders: {
        list: '/orders',
        create: '/orders',
        detail: (id: string) => `/orders/${id}`,
    },

    wallet: {
        balance: '/wallet/balance',
        transactions: '/wallet/transactions',
        withdraw: '/wallet/withdraw',
    },
} as const;

// ============================================================================
// VIETNAMESE MESSAGES
// ============================================================================

export const MESSAGES = {
    success: {
        login: 'Đăng nhập thành công!',
        signup: 'Đăng ký thành công!',
        logout: 'Đã đăng xuất',
        save: 'Đã lưu thành công!',
        delete: 'Đã xóa thành công!',
        order: 'Đặt hàng thành công!',
        withdraw: 'Yêu cầu rút tiền đã được gửi!',
    },

    error: {
        generic: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        network: 'Lỗi kết nối mạng.',
        auth: 'Phiên đăng nhập hết hạn.',
        notFound: 'Không tìm thấy.',
        permission: 'Bạn không có quyền thực hiện thao tác này.',
        validation: 'Vui lòng kiểm tra lại thông tin.',
    },

    loading: {
        default: 'Đang tải...',
        saving: 'Đang lưu...',
        uploading: 'Đang tải lên...',
    },
} as const;

// ============================================================================
// COLORS
// ============================================================================

export const COLORS = {
    brand: {
        primary: '#10B981',
        secondary: '#6366F1',
        accent: '#F59E0B',
    },

    status: {
        success: '#22C55E',
        warning: '#EAB308',
        error: '#EF4444',
        info: '#3B82F6',
    },

    ranks: {
        1: '#9CA3AF', // Starter (gray)
        2: '#CD7F32', // Bronze
        3: '#C0C0C0', // Silver
        4: '#FFD700', // Gold
        5: '#E5E4E2', // Platinum
        6: '#B9F2FF', // Diamond
        7: '#FFD700', // Crown
        8: '#8B0000', // Royal
    },
} as const;
