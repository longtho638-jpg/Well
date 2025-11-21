/**
 * Vietnamese Translations
 *
 * All Vietnamese text content centralized here for easy management
 * and future i18n expansion.
 */

export const vi = {
  // Common
  common: {
    loading: 'Đang tải...',
    error: 'Đã xảy ra lỗi',
    success: 'Thành công',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    save: 'Lưu',
    edit: 'Chỉnh sửa',
    delete: 'Xóa',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    viewAll: 'Xem tất cả',
    learnMore: 'Tìm hiểu thêm',
  },

  // Authentication
  auth: {
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    signup: 'Đăng ký',
    signupNow: 'Đăng Ký Ngay',
    forgotPassword: 'Quên mật khẩu?',
    rememberMe: 'Ghi nhớ đăng nhập',
    welcomeBack: 'Chào mừng trở lại!',
  },

  // Navigation
  nav: {
    overview: 'Tổng quan',
    dashboard: 'Bảng điều khiển',
    marketplace: 'Kho sản phẩm',
    wallet: 'Ví hoa hồng',
    myWallet: 'Ví Của Tôi',
    copilot: 'Trợ Lý AI',
    theCopilot: 'The Copilot',
    teamLeader: 'Quản lý đội nhóm',
    referral: 'Giới Thiệu',
    settings: 'Cài đặt',
    profile: 'Hồ sơ',
  },

  // Homepage / Landing Page
  landing: {
    hero: {
      badge: 'Đang mở tuyển 200 Partner đầu tiên',
      headline: 'Kinh Doanh Sức Khỏe',
      headlineAccent: 'Thời Đại AI Agentic',
      subheadline: 'Nền tảng Social Commerce trang bị cho bạn một AI Coach riêng biệt, sản phẩm Minh bạch nguồn gốc và Quy trình bán hàng tự động hóa.',
      cta: 'Truy cập Dashboard Demo',
      secondaryCta: 'Tìm hiểu mô hình',
    },
    features: {
      title: 'Công cụ mạnh mẽ cho người tiên phong',
      badge: 'Tại sao chọn WellNexus?',
      aiCoach: {
        title: 'Agentic AI Coach',
        description: 'Không còn cô đơn. AI phân tích dữ liệu bán hàng và gợi ý chiến lược mỗi ngày.',
      },
      transparency: {
        title: 'Minh Bạch Tuyệt Đối',
        description: 'Truy xuất nguồn gốc sản phẩm bằng Blockchain. Tự động khấu trừ thuế TNCN đúng luật.',
      },
      community: {
        title: 'Cộng Đồng Hỗ Trợ',
        description: 'Học hỏi từ những Leader hàng đầu. Gamification biến việc bán hàng thành trò chơi thú vị.',
      },
      analytics: {
        title: 'Phân Tích Thông Minh',
        description: 'Dashboard theo dõi real-time với insights từ AI để tối ưu doanh thu.',
      },
      growth: {
        title: 'Tăng Trưởng Bền Vững',
        description: 'Hệ thống MLM công bằng với hoa hồng minh bạch đến từng giao dịch.',
      },
      founderClub: {
        title: 'Founder Club Elite',
        description: 'Chia sẻ 2% doanh thu toàn cầu khi đạt team volume 100 triệu VND.',
      },
    },
    painPoints: {
      lonely: {
        title: 'Cô đơn',
        description: 'Không người dẫn dắt, thiếu lộ trình.',
      },
      lackTools: {
        title: 'Thiếu công cụ',
        description: 'Quản lý thủ công, không biết Marketing.',
      },
      trust: {
        title: 'Mất niềm tin',
        description: 'Sản phẩm kém chất lượng gây mất uy tín.',
      },
    },
    stats: {
      totalIncome: 'Tổng thu nhập',
    },
  },

  // Dashboard
  dashboard: {
    title: 'Bảng điều khiển',
    welcome: 'Chào mừng trở lại, hãy cùng phát triển!',
    welcomeBack: 'Chào mừng trở lại',
    serverTime: 'Giờ Server',
    personalSales: 'Doanh số cá nhân',
    teamVolume: 'Doanh số đội nhóm',
    payout: 'Thanh toán',
    estimatedBonus: 'Thưởng dự kiến',
    revenueGrowth: 'Tăng trưởng doanh thu',
  },

  // Copilot Page
  copilot: {
    title: 'The Copilot',
    subtitle: 'Trợ lý bán hàng AI của bạn',
    description: 'Được trang bị AI tiên tiến để giúp bạn xử lý từ chối khách hàng, tạo kịch bản bán hàng, và cải thiện kỹ năng sales mỗi ngày.',
    features: {
      objectionHandling: {
        title: 'Xử Lý Từ Chối',
        description: 'AI phát hiện và gợi ý cách xử lý từ chối thông minh',
      },
      scriptGeneration: {
        title: 'Kịch Bản Bán Hàng',
        description: 'Tạo script bán hàng chuyên nghiệp trong vài giây',
      },
      realtimeCoaching: {
        title: 'Coaching Realtime',
        description: 'Nhận phản hồi và gợi ý cải thiện ngay lập tức',
      },
    },
    stats: {
      title: 'Thống Kê Hôm Nay',
      objectionsHandled: 'Từ chối xử lý',
      scriptsCreated: 'Script tạo',
      conversionRate: 'Tỉ lệ chuyển đổi',
    },
    tips: {
      title: 'Tips Để Sử Dụng Hiệu Quả',
      tip1: 'Nhập câu phản đối thật của khách hàng để nhận gợi ý chính xác nhất',
      tip2: 'Sử dụng tính năng "Script" để có sẵn kịch bản cho từng sản phẩm',
      tip3: 'Sau mỗi cuộc trò chuyện, bấm "Coach" để nhận phản hồi cải thiện',
      tip4: 'Copy gợi ý nhanh và điều chỉnh cho phù hợp với phong cách của bạn',
    },
  },

  // Wallet / Commission
  wallet: {
    title: 'Ví Hoa Hồng',
    withdrawableBalance: 'Số dư khả dụng',
    totalEarnings: 'Tổng thu nhập (Gross)',
    withheldTax: 'Thuế khấu trừ (PIT 10%)',
    earningsHistory: 'Lịch sử thu nhập',
    exportStatement: 'Xuất báo cáo',
    requestWithdrawal: 'Yêu cầu rút tiền',
    taxComplianceMode: 'Chế độ tuân thủ thuế',
    taxNote: 'WellNexus tự động khấu trừ 10% thuế TNCN cho thu nhập vượt 2.000.000 VNĐ theo luật Việt Nam.',
    tableHeaders: {
      dateRef: 'Ngày & Mã GD',
      type: 'Loại',
      grossAmount: 'Tổng tiền',
      pit: 'PIT (10%)',
      netReceived: 'Thực nhận',
      status: 'Trạng thái',
    },
    transactionTypes: {
      directSale: 'Bán trực tiếp',
      teamBonus: 'Thưởng đội nhóm',
      withdrawal: 'Rút tiền',
    },
    statuses: {
      completed: 'Hoàn thành',
      pending: 'Đang xử lý',
      failed: 'Thất bại',
    },
  },

  // Sidebar / Coach
  sidebar: {
    logo: 'WellNexus',
    tagline: 'Social Commerce',
    seedStage: 'Seed Stage',
    theCoach: 'The Coach',
    dayProgress: 'Ngày {current}/{total}',
    getAIAdvice: 'Nhận Lời Khuyên AI',
    loadingAdvice: 'Đang tải lời khuyên...',
    defaultAdvice: 'Hãy tập trung chia sẻ link cho 3 người bạn mới hôm nay. Doanh số sẽ đến từ sự kết nối!',
  },

  // Quests / Gamification
  quests: {
    daily: 'Nhiệm vụ hàng ngày',
    weekly: 'Nhiệm vụ tuần',
    completed: 'Đã hoàn thành',
    xpReward: '+{xp}XP',
  },

  // Products
  products: {
    marketplace: 'Kho Sản Phẩm',
    productDetail: 'Chi tiết sản phẩm',
    addToCart: 'Thêm vào giỏ',
    buyNow: 'Mua Ngay',
    share: 'Chia sẻ',
    outOfStock: 'Hết hàng',
    inStock: 'Còn hàng',
    commission: 'Hoa hồng',
    earnCommission: 'Kiếm {amount}',
    description: 'Mô tả',
    benefits: 'Lợi ích',
    ingredients: 'Thành phần',
    usage: 'Cách sử dụng',
  },

  // Referral
  referral: {
    title: 'Giới Thiệu',
    yourLink: 'Link giới thiệu của bạn',
    copyLink: 'Sao chép link',
    shareNow: 'Chia sẻ ngay',
    totalReferrals: 'Tổng số giới thiệu',
    activeReferrals: 'Đang hoạt động',
    referralRevenue: 'Doanh thu từ giới thiệu',
  },

  // Team Leader
  team: {
    title: 'Quản Lý Đội Nhóm',
    teamPerformance: 'Hiệu suất đội nhóm',
    topPerformers: 'Người xuất sắc',
    teamMembers: 'Thành viên',
    totalSales: 'Tổng doanh số',
  },

  // Ranks
  ranks: {
    member: 'Thành viên',
    partner: 'Partner',
    founderClub: 'Founder Club',
  },

  // Errors & Messages
  messages: {
    error: {
      general: 'Đã xảy ra lỗi, vui lòng thử lại',
      network: 'Lỗi kết nối mạng',
      notFound: 'Không tìm thấy',
      unauthorized: 'Bạn không có quyền truy cập',
      validation: 'Dữ liệu không hợp lệ',
    },
    success: {
      saved: 'Đã lưu thành công',
      updated: 'Đã cập nhật thành công',
      deleted: 'Đã xóa thành công',
      copied: 'Đã sao chép',
    },
  },

  // Date & Time
  datetime: {
    today: 'Hôm nay',
    yesterday: 'Hôm qua',
    thisWeek: 'Tuần này',
    thisMonth: 'Tháng này',
    days: 'ngày',
    hours: 'giờ',
    minutes: 'phút',
    seconds: 'giây',
  },

  // Currency
  currency: {
    vnd: 'VNĐ',
    usd: 'USD',
  },
};

export type TranslationKey = typeof vi;
