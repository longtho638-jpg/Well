/**
 * Vietnamese Translation Dictionary for WellNexus
 * Central source of truth for all UI text in the application
 */

export const vi = {
  // Common/Shared Text
  common: {
    loading: 'Đang tải...',
    error: 'Có lỗi xảy ra',
    success: 'Thành công',
    failed: 'Thất bại',
    save: 'Lưu',
    cancel: 'Hủy',
    close: 'Đóng',
    confirm: 'Xác nhận',
    back: 'Quay lại',
    next: 'Tiếp theo',
    submit: 'Gửi',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    copy: 'Sao chép',
    sort: 'Sắp xếp',
    viewAll: 'Xem tất cả',
    viewDetails: 'Xem chi tiết',
    currency: {
      vnd: 'đ',
      grow: 'Token',
      shop: 'SHOP',
    }
  },

  // Navigation
  nav: {
    dashboard: 'Trang chủ',
    marketplace: 'Cửa hàng',
    wallet: 'Ví tiền',
    team: 'Đội nhóm',
    copilot: 'Trợ lý AI',
    referral: 'Giới thiệu',
    healthCoach: 'Huấn luyện sức khỏe',
    leaderboard: 'Bảng xếp hạng',
    marketingTools: 'Công cụ Marketing',
    healthCheck: 'Kiểm tra hệ thống',
    admin: 'Quản trị',
    settings: 'Cài đặt',
    logout: 'Đăng xuất',
  },

  // Dashboard Page
  dashboard: {
    title: 'Trang chủ',
    welcome: 'Chào mừng trở lại, {name}!',
    serverTime: 'Giờ hệ thống',

    // Hero Card
    hero: {
      greeting: 'Xin chào, {name}!',
      roadToFounder: 'Hành trình đến Founder Club',
      currentProgress: 'Tiến độ hiện tại',
      teamVolume: 'Doanh số đội nhóm',
      target: 'Mục tiêu',
      remaining: 'Còn lại',
      daysLeft: '{days} ngày',
      onTrack: 'Đúng tiến độ',
      needsBoost: 'Cần tăng tốc',
    },

    // Stats Grid
    stats: {
      totalSales: 'Tổng doanh số',
      teamVolume: 'Doanh số đội nhóm',
      commission: 'Hoa hồng',
      rank: 'Cấp bậc',
      growth: 'Tăng trưởng',
      thisMonth: 'Tháng này',
      vsLastMonth: 'So với tháng trước',
    },

    // Revenue Chart
    revenue: {
      title: '7 ngày doanh thu',
      subtitle: 'Biểu đồ doanh thu tuần',
      total: 'Tổng',
      average: 'Trung bình',
      peak: 'Cao nhất',
    },

    // Revenue Breakdown
    revenueBreakdown: {
      title: 'Nguồn doanh thu',
      directSales: 'Bán trực tiếp',
      teamBonus: 'Thưởng đội nhóm',
      referral: 'Giới thiệu',
    },

    // Top Products
    topProducts: {
      title: 'Sản phẩm bán chạy',
      sales: '{count} đã bán',
      commission: 'Hoa hồng',
      stock: 'Còn {count}',
      outOfStock: 'Hết hàng',
      buyNow: 'Mua ngay',
    },

    // Quick Actions
    quickActions: {
      title: 'Hành động nhanh',
      shareProduct: 'Chia sẻ sản phẩm',
      shareProductDesc: 'Gửi link cho khách hàng',
      inviteTeam: 'Mời đồng đội',
      inviteTeamDesc: 'Mở rộng đội nhóm',
      viewStats: 'Xem thống kê',
      viewStatsDesc: 'Phân tích chi tiết',
      withdraw: 'Rút tiền',
      withdrawDesc: 'Chuyển về tài khoản',
      shareAchievement: 'Chia sẻ thành tích',
      shareAchievementDesc: 'Khoe thành tích của bạn',
    },

    // Daily Quest Hub
    dailyQuest: {
      title: 'Nhiệm vụ hàng ngày',
      subtitle: 'Hoàn thành để nhận GROW Token',
      progress: 'Tiến độ',
      completed: '{count}/{total} hoàn thành',
      completedAll: 'HOÀN THÀNH',
      questsProgress: '{completed}/{total} nhiệm vụ',
      tokensEarned: '{amount} GROW đã nhận',
      tokensToday: 'GROW hôm nay',
      startQuest: 'Bắt đầu',
      claiming: 'Đang nhận...',
      claim: 'Nhận thưởng',
      claimedSuccess: 'Đã nhận {amount} GROW Token!',
      questCompleted: 'Đã hoàn thành',
      types: {
        onboarding: 'Khởi động',
        sales: 'Bán hàng',
        learning: 'Học tập',
      },
      // Individual quest data
      quests: {
        dailyCheckIn: {
          title: 'Khởi động ngày mới',
          description: 'Check-in App hàng ngày',
        },
        shareHealthCheck: {
          title: 'Lan tỏa giá trị',
          description: 'Chia sẻ 1 link Health Check',
        },
        watchTraining: {
          title: 'Học tập',
          description: 'Xem 1 video đào tạo',
        }
      }
    },

    // Live Activities
    liveActivities: {
      title: 'Hoạt động trực tiếp',
      subtitle: 'Hoạt động đang diễn ra trên hệ thống',
      live: 'TRỰC TIẾP',
      updateContinuously: 'Cập nhật liên tục',
      recent: '{count} hoạt động gần đây',
      systemActive: 'Hệ thống đang sôi động!',
      new: 'MỚI',
      loading: 'Đang tải hoạt động...',
      activities: {
        earnedGrow: 'vừa nhận {amount} GROW tokens',
        rewardedGrow: 'được thưởng {amount} GROW',
        teamBonusGrow: 'kiếm được {amount} GROW từ team bonus',
        completedOrder: 'vừa chốt đơn {amount}',
        soldSuccess: 'bán thành công {amount}',
        finishedOrder: 'hoàn thành đơn hàng {amount}',
        rankedUpGold: 'vừa thăng cấp Gold',
        rankedUpPartner: 'đạt rank Partner',
        rankedUpFounder: 'lên cấp Founder Club',
        rankedUpSilver: 'thăng hạng Silver',
        withdrew: 'rút {amount} về tài khoản',
        transferredSuccess: 'chuyển {amount} thành công',
        referredPartner: 'giới thiệu thành công 1 Partner mới',
        referralBonus: 'nhận bonus giới thiệu {amount}',
        teamExpanded: 'team mở rộng thêm 1 thành viên',
      }
    },

    // Recent Activity
    recentActivity: {
      title: 'Hoạt động gần đây',
      completedQuest: 'Hoàn thành nhiệm vụ: Bán hàng đầu tiên',
      newTeamMember: 'Thành viên mới gia nhập đội nhóm',
      productShipped: 'Đã gửi sản phẩm cho khách hàng',
      reachedRank: 'Đạt cấp bậc Partner',
      hoursAgo: '{hours} giờ trước',
      daysAgo: '{days} ngày trước',
    },

    // Achievements
    achievements: {
      title: 'Thành tựu',
      topSeller: 'Người bán hàng xuất sắc',
      goalCrusher: 'Chinh phục mục tiêu',
      teamLeader: 'Trưởng nhóm',
      speedDemon: 'Tốc độ ánh sáng',
      unlocked: '{count} / {total} đã mở khóa',
      locked: 'Chưa mở khóa',
    },

    // Quick Stats
    quickStats: {
      title: 'Thống kê nhanh',
      totalTransactions: 'Tổng giao dịch',
      activeProducts: 'Sản phẩm đang bán',
      currentRank: 'Cấp bậc hiện tại',
    }
  },

  // Wallet Page
  wallet: {
    title: 'Ví tiền',
    subtitle: 'Quản lý tài chính của bạn',

    // Token Balances
    balance: {
      available: 'Số dư khả dụng',
      locked: 'Đang khóa',
      staked: 'Đang stake',
      total: 'Tổng cộng',
      shopToken: 'SHOP Token (VND)',
      growToken: 'GROW Token',
    },

    // Actions
    actions: {
      withdraw: 'Rút tiền',
      stake: 'Gửi tiết kiệm',
      unstake: 'Rút tiết kiệm',
      transfer: 'Chuyển khoản',
      history: 'Lịch sử giao dịch',
    },

    // Staking
    staking: {
      title: 'Gửi tiết kiệm (Staking)',
      subtitle: 'Khóa GROW Token để nhận lãi suất',
      apy: 'Lãi suất hàng năm',
      minimumAmount: 'Số lượng tối thiểu',
      lockPeriod: 'Thời gian khóa',
      estimatedReward: 'Lợi nhuận dự kiến',
      days: '{count} ngày',
      enterAmount: 'Nhập số lượng',
      stakeNow: 'Gửi ngay',
      unstakeNow: 'Rút ngay',
      stakingInfo: 'Thông tin staking',
      stakedAmount: 'Đã stake',
      rewards: 'Phần thưởng',
    },

    // Transaction History
    transactions: {
      title: 'Lịch sử giao dịch',
      noTransactions: 'Chưa có giao dịch nào',
      id: 'Mã giao dịch',
      date: 'Ngày',
      amount: 'Số tiền',
      type: 'Loại',
      status: 'Trạng thái',
      hash: 'Hash',
      tax: 'Thuế',
      types: {
        directSale: 'Bán trực tiếp',
        teamBonus: 'Thưởng đội nhóm',
        withdrawal: 'Rút tiền',
        quest: 'Nhiệm vụ',
        staking: 'Gửi tiết kiệm',
        unstaking: 'Rút tiết kiệm',
      },
      statusValues: {
        pending: 'Đang xử lý',
        completed: 'Hoàn thành',
        failed: 'Thất bại',
        cancelled: 'Đã hủy',
      }
    },

    // Withdrawal
    withdrawal: {
      title: 'Rút tiền',
      subtitle: 'Chuyển SHOP Token về tài khoản ngân hàng',
      amount: 'Số tiền muốn rút',
      bankAccount: 'Tài khoản ngân hàng',
      bankName: 'Tên ngân hàng',
      accountNumber: 'Số tài khoản',
      accountName: 'Tên chủ tài khoản',
      fee: 'Phí giao dịch',
      tax: 'Thuế TNCN',
      netAmount: 'Số tiền nhận được',
      minWithdrawal: 'Rút tối thiểu {amount}',
      maxWithdrawal: 'Rút tối đa {amount}',
      processingTime: 'Thời gian xử lý: 1-3 ngày làm việc',
      withdrawNow: 'Rút ngay',
      withdrawSuccess: 'Yêu cầu rút tiền thành công!',
    }
  },

  // Marketplace Page
  marketplace: {
    title: 'Cửa hàng',
    subtitle: 'Sản phẩm chất lượng cao',
    searchPlaceholder: 'Tìm kiếm sản phẩm...',
    filterBy: 'Lọc theo',
    sortBy: 'Sắp xếp theo',
    categories: {
      all: 'Tất cả',
      supplements: 'Thực phẩm chức năng',
      wellness: 'Sức khỏe',
      beauty: 'Làm đẹp',
      starter: 'Gói khởi đầu',
    },
    sort: {
      popular: 'Phổ biến nhất',
      newest: 'Mới nhất',
      priceLow: 'Giá thấp đến cao',
      priceHigh: 'Giá cao đến thấp',
      commission: 'Hoa hồng cao nhất',
    },
    product: {
      commission: 'Hoa hồng',
      sales: '{count} đã bán',
      stock: 'Còn {count}',
      outOfStock: 'Hết hàng',
      addToCart: 'Thêm vào giỏ',
      buyNow: 'Mua ngay',
      shareProduct: 'Chia sẻ',
      viewDetails: 'Xem chi tiết',
    },
    productDetail: {
      description: 'Mô tả sản phẩm',
      features: 'Tính năng',
      ingredients: 'Thành phần',
      usage: 'Cách sử dụng',
      benefits: 'Lợi ích',
      reviews: 'Đánh giá',
      rating: '{score} / 5',
      reviewCount: '{count} đánh giá',
    }
  },

  // Team Dashboard
  team: {
    title: 'Quản lý đội nhóm',
    subtitle: 'Theo dõi và hỗ trợ đội nhóm của bạn',

    // Team Overview
    overview: {
      title: 'Tổng quan đội nhóm',
      totalMembers: 'Tổng thành viên',
      activeMembers: 'Đang hoạt động',
      totalTeamVolume: 'Doanh số đội nhóm',
      monthlyGrowth: 'Tăng trưởng tháng',
      averageSales: 'Doanh số trung bình/người',
    },

    // Team Members
    members: {
      title: 'Thành viên',
      search: 'Tìm thành viên...',
      name: 'Họ tên',
      rank: 'Cấp bậc',
      personalSales: 'Doanh số cá nhân',
      teamVolume: 'Doanh số nhóm',
      downlines: 'Cấp dưới',
      growth: 'Tăng trưởng',
      lastActive: 'Hoạt động gần nhất',
      viewProfile: 'Xem hồ sơ',
      sendMessage: 'Nhắn tin',
    },

    // Top Performers
    topPerformers: {
      title: 'Thành viên xuất sắc',
      thisMonth: 'Tháng này',
      allTime: 'Tất cả thời gian',
    },

    // Team Analytics
    analytics: {
      title: 'Phân tích đội nhóm',
      recruitmentTrend: 'xu hướng tuyển dụng',
      salesTrend: 'Xu hướng doanh số',
      rankDistribution: 'Phân bố cấp bậc',
      activityHeatmap: 'Biểu đồ hoạt động',
    }
  },

  // Referral Page
  referral: {
    title: 'Chương trình giới thiệu',
    subtitle: 'Mời bạn bè và nhận thưởng',

    // Referral Stats
    stats: {
      totalReferrals: 'Tổng lượt giới thiệu',
      activeReferrals: 'Đang hoạt động',
      conversionRate: 'Tỷ lệ chuyển đổi',
      totalBonus: 'Tổng thưởng',
      monthlyReferrals: 'Giới thiệu tháng này',
    },

    // Referral Link
    link: {
      title: 'Link giới thiệu của bạn',
      copy: 'Sao chép',
      copied: 'Đã sao chép!',
      share: 'Chia sẻ',
      qrCode: 'Mã QR',
    },

    // Referrals List
    list: {
      title: 'Danh sách giới thiệu',
      name: 'Họ tên',
      email: 'Email',
      status: 'Trạng thái',
      revenue: 'Doanh thu',
      bonus: 'Thưởng',
      registeredAt: 'Ngày đăng ký',
      statuses: {
        pending: 'Đang chờ',
        registered: 'Đã đăng ký',
        active: 'Đang hoạt động',
        expired: 'Hết hạn',
      }
    },

    // Rewards
    rewards: {
      title: 'Phần thưởng giới thiệu',
      signupBonus: 'Thưởng đăng ký',
      firstPurchase: 'Thưởng mua hàng đầu',
      milestone: 'Thưởng cột mốc',
      description: {
        signup: 'Nhận ngay khi người được giới thiệu đăng ký',
        firstPurchase: 'Nhận khi người được giới thiệu mua hàng lần đầu',
        milestone: 'Nhận khi đạt mốc doanh số',
      }
    }
  },

  // Copilot (AI Sales Assistant)
  copilot: {
    title: 'Trợ lý bán hàng AI',
    subtitle: 'Trợ lý thông minh hỗ trợ bán hàng',
    startConversation: 'Bắt đầu cuộc trò chuyện',
    placeholder: 'Nhập câu hỏi của bạn...',
    send: 'Gửi',
    typing: 'Đang gõ...',
    objectionDetected: 'Phát hiện từ chối',
    suggestion: 'Gợi ý trả lời',
    useSuggestion: 'Sử dụng gợi ý này',
    objectionTypes: {
      price: 'Giá cả',
      skepticism: 'Nghi ngờ',
      competition: 'Đối thủ',
      timing: 'Thời điểm',
      need: 'Nhu cầu',
      general: 'Khác',
    }
  },

  // Leaderboard
  leaderboard: {
    title: 'Bảng xếp hạng',
    subtitle: 'Cạnh tranh với cộng đồng',
    period: {
      today: 'Hôm nay',
      week: 'Tuần này',
      month: 'Tháng này',
      allTime: 'Mọi thời điểm',
    },
    categories: {
      sales: 'Doanh số',
      commission: 'Hoa hồng',
      team: 'Đội nhóm',
      growth: 'Tăng trưởng',
    },
    rank: 'Hạng',
    name: 'Tên',
    score: 'Điểm số',
    change: 'Thay đổi',
    yourRank: 'Hạng của bạn',
    topPerformers: 'Top {count} xuất sắc',
  },

  // Marketing Tools
  marketing: {
    title: 'Công cụ Marketing',
    subtitle: 'Tự động hóa chiến dịch marketing',

    // Campaign Builder
    campaign: {
      title: 'Tạo chiến dịch',
      name: 'Tên chiến dịch',
      type: 'Loại chiến dịch',
      target: 'Đối tượng mục tiêu',
      schedule: 'Lên lịch',
      content: 'Nội dung',
      preview: 'Xem trước',
      launch: 'Phát động',
      types: {
        email: 'Email',
        sms: 'SMS',
        social: 'Mạng xã hội',
        push: 'Thông báo đẩy',
      }
    },

    // Templates
    templates: {
      title: 'Mẫu Marketing',
      useTemplate: 'Sử dụng mẫu',
      customize: 'Tùy chỉnh',
      categories: {
        welcome: 'Chào mừng',
        promotion: 'Khuyến mãi',
        announcement: 'Thông báo',
        reminder: 'Nhắc nhở',
      }
    },

    // Analytics
    analytics: {
      title: 'Phân tích chiến dịch',
      impressions: 'Lượt hiển thị',
      clicks: 'Lượt nhấp',
      conversions: 'Chuyển đổi',
      roi: 'ROI',
      engagement: 'Tương tác',
    }
  },

  // Health Coach
  healthCoach: {
    title: 'Huấn luyện sức khỏe',
    subtitle: 'Chương trình chăm sóc sức khỏe cá nhân',

    // Health Profile
    profile: {
      title: 'Hồ sơ sức khỏe',
      age: 'Tuổi',
      height: 'Chiều cao',
      weight: 'Cân nặng',
      bmi: 'Chỉ số BMI',
      bloodType: 'Nhóm máu',
      allergies: 'Dị ứng',
      conditions: 'Tình trạng sức khỏe',
      goals: 'Mục tiêu',
    },

    // Recommendations
    recommendations: {
      title: 'Đề xuất sản phẩm',
      basedOnProfile: 'Dựa trên hồ sơ của bạn',
      whyRecommended: 'Tại sao đề xuất',
      dosage: 'Liều lượng',
      timing: 'Thời gian sử dụng',
    },

    // Progress Tracking
    progress: {
      title: 'Theo dõi tiến độ',
      currentWeight: 'Cân nặng hiện tại',
      goalWeight: 'Cân nặng mục tiêu',
      weeksToGoal: 'Số tuần đến mục tiêu',
      achievements: 'Thành tựu',
    }
  },

  // Health Check (System Monitoring)
  healthCheck: {
    title: 'Kiểm tra hệ thống',
    subtitle: 'Trạng thái hoạt động hệ thống',

    // System Status
    status: {
      title: 'Trạng thái hệ thống',
      operational: 'Hoạt động bình thường',
      degraded: 'Suy giảm hiệu suất',
      down: 'Ngừng hoạt động',
      maintenance: 'Bảo trì',
    },

    // Services
    services: {
      title: 'Dịch vụ',
      api: 'API Server',
      database: 'Cơ sở dữ liệu',
      storage: 'Lưu trữ',
      payment: 'Thanh toán',
      notification: 'Thông báo',
      ai: 'Dịch vụ AI',
    },

    // Metrics
    metrics: {
      title: 'Chỉ số hệ thống',
      uptime: 'Thời gian hoạt động',
      responseTime: 'Thời gian phản hồi',
      errorRate: 'Tỷ lệ lỗi',
      activeUsers: 'Người dùng đang hoạt động',
      requestsPerSecond: 'Yêu cầu/giây',
    },

    // Incidents
    incidents: {
      title: 'Sự cố',
      noIncidents: 'Không có sự cố',
      resolved: 'Đã giải quyết',
      investigating: 'Đang điều tra',
    }
  },

  // Admin Panel
  admin: {
    title: 'Quản trị hệ thống',
    subtitle: 'Cấu hình và quản lý toàn hệ thống',

    // User Management
    users: {
      title: 'Quản lý người dùng',
      totalUsers: 'Tổng người dùng',
      activeUsers: 'Đang hoạt động',
      verifiedUsers: 'Đã xác minh',
      bannedUsers: 'Bị cấm',
      actions: {
        view: 'Xem',
        edit: 'Sửa',
        ban: 'Cấm',
        unban: 'Mở cấm',
        verify: 'Xác minh',
        delete: 'Xóa',
      }
    },

    // Product Management
    products: {
      title: 'Quản lý sản phẩm',
      addProduct: 'Thêm sản phẩm',
      editProduct: 'Sửa sản phẩm',
      deleteProduct: 'Xóa sản phẩm',
      activeProducts: 'Đang bán',
      draftProducts: 'Nháp',
    },

    // Policy Engine
    policy: {
      title: 'Hệ thống chính sách',
      subtitle: 'Quản lý quy định và chính sách',
      commission: 'Chính sách hoa hồng',
      tax: 'Chính sách thuế',
      rank: 'Chính sách cấp bậc',
      referral: 'Chính sách giới thiệu',
      rules: 'Quy tắc',
      active: 'Đang áp dụng',
      inactive: 'Không áp dụng',
      createRule: 'Tạo quy tắc',
      editRule: 'Sửa quy tắc',
    },

    // System Settings
    settings: {
      title: 'Cài đặt hệ thống',
      general: 'Chung',
      security: 'Bảo mật',
      notifications: 'Thông báo',
      integrations: 'Tích hợp',
      backup: 'Sao lưu',
    }
  },

  // Auth Pages
  auth: {
    login: {
      title: 'Đăng nhập',
      subtitle: 'Chào mừng trở lại WellNexus',
      email: 'Email',
      password: 'Mật khẩu',
      rememberMe: 'Ghi nhớ đăng nhập',
      forgotPassword: 'Quên mật khẩu?',
      loginButton: 'Đăng nhập',
      noAccount: 'Chưa có tài khoản?',
      signUp: 'Đăng ký ngay',
    },
    register: {
      title: 'Đăng ký',
      subtitle: 'Tham gia cộng đồng WellNexus',
      fullName: 'Họ và tên',
      email: 'Email',
      phone: 'Số điện thoại',
      password: 'Mật khẩu',
      confirmPassword: 'Xác nhận mật khẩu',
      referralCode: 'Mã giới thiệu (nếu có)',
      agree: 'Tôi đồng ý với',
      terms: 'Điều khoản dịch vụ',
      and: 'và',
      privacy: 'Chính sách bảo mật',
      registerButton: 'Đăng ký',
      haveAccount: 'Đã có tài khoản?',
      login: 'Đăng nhập',
    },
    forgotPassword: {
      title: 'Quên mật khẩu',
      subtitle: 'Nhập email để đặt lại mật khẩu',
      email: 'Email',
      sendReset: 'Gửi link đặt lại',
      backToLogin: 'Quay lại đăng nhập',
    }
  },

  // Landing Page
  landing: {
    hero: {
      title: 'Xây dựng sự nghiệp với WellNexus',
      subtitle: 'Nền tảng kinh doanh thông minh kết hợp AI, Tokenomics và cộng đồng',
      cta: 'Bắt đầu ngay',
      learnMore: 'Tìm hiểu thêm',
    },
    features: {
      title: 'Tính năng nổi bật',
      ai: {
        title: 'Trợ lý AI thông minh',
        description: 'Hỗ trợ bán hàng 24/7 với công nghệ AI tiên tiến',
      },
      token: {
        title: 'Hệ thống Dual Token',
        description: 'SHOP và GROW token với khả năng staking sinh lời',
      },
      compliance: {
        title: 'Tuân thủ thuế tự động',
        description: 'Tự động tính toán và báo cáo thuế theo quy định Việt Nam',
      },
      community: {
        title: 'Cộng đồng mạnh mẽ',
        description: 'Kết nối với hàng nghìn seller trên toàn quốc',
      }
    },
    testimonials: {
      title: 'Câu chuyện thành công',
    },
    cta: {
      title: 'Sẵn sàng bắt đầu?',
      subtitle: 'Tham gia WellNexus hôm nay và xây dựng thu nhập thụ động',
      button: 'Đăng ký miễn phí',
    }
  },

  // Error Messages
  errors: {
    network: 'Lỗi kết nối mạng. Vui lòng thử lại.',
    unauthorized: 'Bạn không có quyền truy cập.',
    notFound: 'Không tìm thấy trang này.',
    serverError: 'Lỗi máy chủ. Vui lòng thử lại sau.',
    validation: {
      required: 'Trường này là bắt buộc',
      email: 'Email không hợp lệ',
      phone: 'Số điện thoại không hợp lệ',
      minLength: 'Tối thiểu {min} ký tự',
      maxLength: 'Tối đa {max} ký tự',
      passwordMatch: 'Mật khẩu không khớp',
      minAmount: 'Số tiền tối thiểu {amount}',
      maxAmount: 'Số tiền tối đa {amount}',
      insufficientBalance: 'Số dư không đủ',
    }
  },

  // Success Messages
  success: {
    saved: 'Đã lưu thành công!',
    updated: 'Đã cập nhật thành công!',
    deleted: 'Đã xóa thành công!',
    sent: 'Đã gửi thành công!',
    copied: 'Đã sao chép!',
    questCompleted: 'Hoàn thành nhiệm vụ!',
    purchaseSuccess: 'Mua hàng thành công!',
    withdrawalSuccess: 'Yêu cầu rút tiền thành công!',
    stakingSuccess: 'Gửi tiết kiệm thành công!',
    unstakingSuccess: 'Rút tiết kiệm thành công!',
  }
};

// Export type for TypeScript autocomplete
export type TranslationKeys = typeof vi;
