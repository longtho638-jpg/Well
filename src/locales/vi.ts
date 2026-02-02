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
    products: 'Sản Phẩm',
    partner: 'Partner',
    ventureDescription: 'Gia nhập đội ngũ 200+ Co-Founders',
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
    darkMode: 'Giao diện tối',
    lightMode: 'Giao diện sáng',
  },

  // Landing Page - AST Migration Keys
  landingpage: {
    ultimate_level_wellness: 'ULTIMATE LEVEL WELLNESS',
    hu_n_luy_n_vi_n_ai: 'Huấn luyện viên AI',
    h_ng_d_n_c_nh_n_h_a_b_i_gemi: 'Hướng dẫn cá nhân hóa bởi Gemini',
    thu_nh_p_th_ng: 'Thu nhập thụ động',
    theo_d_i_hoa_h_ng_t_ng_v_p: 'Theo dõi hoa hồng tăng vọt theo thời gian thực',
    '12_450': '12.450.000đ',
    thu_nh_p_tb_partner: 'Thu nhập TB/Partner',
    c_ng_ng: 'Cộng đồng',
    tham_gia_c_ng_1_000_founders: 'Tham gia cùng 1.000+ Founders thành công',
    m_r_ng_to_n_c_u: 'Mở rộng toàn cầu',
    s_n_s_ng_chinh_ph_c_th_tr_ng: 'Sẵn sàng chinh phục thị trường Đông Nam Á',
    m_kh_a_khi_t: 'Mở khóa khi đạt ',
    xem_t_m_nh_n: 'Xem tầm nhìn',
    giai_o_n_hi_n_t_i: 'Giai đoạn hiện tại',
    tham_gia_ngay_ch_c_n_157_sl: 'Tham gia ngay - Chỉ còn 157 slot',
    c_u_chuy_n_th_nh_c_ng: 'Câu chuyện thành công',
    partner_n_i_g_v_wellnexus: 'Partner nói gì về WellNexus',
    h_ng_ng_n_partner_thay_i: 'Hàng ngàn Partner đã thay đổi cuộc sống với WellNexus',
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
      ipoPathway: 'Lộ trình IPO Pathway',
      currentProgress: 'Tiến độ hiện tại',
      teamVolume: 'Doanh số đội nhóm',
      portfolioValue: 'Portfolio Value',
      target: 'Mục tiêu',
      remaining: 'Còn lại',
      daysLeft: '{days} ngày',
      onTrack: 'Đúng tiến độ',
      needsBoost: 'Cần tăng tốc',
    },

    // Business Valuation (WEALTH OS)
    valuation: {
      title: 'Định Giá Doanh Nghiệp',
      subtitle: 'Business Valuation (PE Ratio 5x)',
      formula: 'Công thức định giá',
      assetBreakdown: 'Cơ cấu tài sản',
      cashflow: 'Dòng tiền (Cashflow)',
      equity: 'Vốn chủ sở hữu (Equity)',
      projectedAnnual: 'Lợi nhuận dự phóng',
      upgradePortfolio: 'Nâng cấp Portfolio',
      peRatio: 'PE Ratio',
      monthlyProfit: 'Lợi nhuận tháng',
      annualizedRevenue: 'Doanh thu hàng năm',
      assetGrowth: 'Tăng trưởng tài sản',
      valuationMethod: 'Phương pháp định giá: DCF & Comparable',
    },

    // Stats Grid (WEALTH OS: Investment Language)
    stats: {
      totalSales: 'Tổng Dòng Tiền (Cashflow)',
      teamVolume: 'Portfolio Volume',
      commission: 'Lợi Nhuận (Net Profit)',
      rank: 'Investor Tier',
      growth: 'Asset Growth',
      thisMonth: 'Tháng này',
      vsLastMonth: 'MoM Growth',
    },

    // Commission Widget
    commission: {
      title: 'Hoa Hồng',
      subtitle: 'Thu nhập theo thời gian thực',
      today: 'Hôm nay',
      thisWeek: 'Tuần này',
      thisMonth: 'Tháng này',
      breakdown: 'Chi tiết thu nhập',
      directSales: 'Bán hàng trực tiếp',
      teamVolume: 'Doanh số đội nhóm',
      total: 'Tổng thu nhập',
      withdraw: 'Rút tiền',
      viewDetails: 'Xem chi tiết',
    },

    // Revenue Chart (WEALTH OS: Asset Performance)
    revenue: {
      title: '7 ngày Asset Performance',
      subtitle: 'Biểu đồ tăng trưởng tài sản',
      total: 'Tổng',
      average: 'Trung bình',
      peak: 'Cao nhất',
    },

    // Revenue Breakdown (WEALTH OS: Income Streams)
    revenueBreakdown: {
      title: 'Nguồn Thu Nhập (Income Streams)',
      directSales: 'Direct Income',
      teamBonus: 'Portfolio Bonus',
      referral: 'Referral Income',
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
    },
    // Merged keys
    system_online: 'Hệ thống Online',
  },

  // Wallet Page (WEALTH OS: Asset Management)
  wallet: {
    title: 'Asset Management',
    subtitle: 'Quản lý danh mục tài sản của bạn',

    // Token Balances (WEALTH OS: Portfolio Components)
    balance: {
      available: 'Liquid Assets (Khả dụng)',
      locked: 'Locked Assets (Đang khóa)',
      staked: 'Staked for Yield (Đang stake)',
      total: 'Total Portfolio Value',
      shopToken: 'SHOP Token - Cashflow',
      growToken: 'GROW Token - Equity',
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
    },
    // Merged keys
    '12': '12%',
    '90': '90',
    '12_0': '12.0%',
    '12_5': '12.5%',
    apy_staking: 'APY Staking',
    blockchain_explorer: 'Blockchain Explorer',
    currency: 'Currency',
    governance_token: 'Governance Token',
    t_ng_t_i_s_n: 'Tổng tài sản',
    th_ng_n_y: 'Tháng này',
    n_p_shop: 'Nạp SHOP',
    'vnd_stablecoin_1_1000': 'VND Stablecoin 1:1000',
  },

  // Cart/Checkout
  cart: {
    empty: 'Giỏ hàng trống',
    yourOrder: 'Đơn hàng của bạn',
    quantity: 'SL',
    subtotal: 'Tạm tính',
    shipping: 'Phí vận chuyển',
    shippingFree: 'Miễn phí',
    total: 'Tổng cộng',
    viewCart: 'Xem giỏ hàng',
    checkout: 'Thanh toán',
    removeItem: 'Xóa sản phẩm',
  },

    checkout: {
      title: 'Thanh Toán',
      backToShop: 'Quay lại cửa hàng',
      guestInfo: 'Thông tin khách hàng',
      shippingAddress: 'Địa chỉ giao hàng',
      placeOrder: 'Đặt hàng ngay',
      processing: 'Đang xử lý...',
      terms: 'Bằng việc đặt hàng, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của WellNexus.',
      success: 'Đặt hàng thành công! Đơn hàng của bạn đã được ghi nhận.',
      error: 'Có lỗi xảy ra khi xử lý đơn hàng. Vui lòng thử lại.',
      form: {
        fullName: 'Họ và tên',
        phone: 'Số điện thoại',
        email: 'Email (Để nhận thông báo đơn hàng)',
        city: 'Tỉnh / Thành phố',
        district: 'Quận / Huyện',
        ward: 'Phường / Xã',
        street: 'Địa chỉ chi tiết',
        note: 'Ghi chú (Tùy chọn)',
        notePlaceholder: 'Giao hàng trong giờ hành chính...',
        fullNamePlaceholder: 'Nguyễn Văn A',
        phonePlaceholder: '0901234567',
        emailPlaceholder: 'example@email.com',
        cityPlaceholder: 'TP. Hồ Chí Minh',
        districtPlaceholder: 'Quận 1',
        wardPlaceholder: 'Phường Bến Nghé',
        streetPlaceholder: 'Số 123, Đường Nguyễn Huệ',
      },
      validation: {
        fullNameRequired: 'Họ tên phải có ít nhất 2 ký tự',
        emailInvalid: 'Email không hợp lệ',
        phoneInvalid: 'Số điện thoại không hợp lệ',
        streetRequired: 'Địa chỉ phải chi tiết hơn (số nhà, tên đường)',
        wardRequired: 'Phường/Xã là bắt buộc',
        districtRequired: 'Quận/Huyện là bắt buộc',
        cityRequired: 'Tỉnh/Thành phố là bắt buộc',
      },
      successPage: {
        title: 'Đặt hàng thành công!',
        message: 'Cảm ơn bạn đã mua hàng tại WellNexus. Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận đơn hàng.',
        continueShopping: 'Tiếp tục mua sắm',
        backToHome: 'Về trang chủ',
      }
    },

    // Marketplace Page
    marketplace: {
    title: 'Cửa hàng',
    subtitle: 'Sản phẩm chất lượng cao',
    searchPlaceholder: 'Tìm kiếm sản phẩm...',
    filterBy: 'Lọc theo',
    sortBy: 'Sắp xếp theo',
    noProductsFound: 'Không tìm thấy sản phẩm',
    aiRecommended: 'AI Đề xuất',
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
    aiRecommendation: {
      title: 'AI Opportunity Radar',
      loading: 'Đang phân tích {count} tín hiệu thị trường...',
      live: 'Trực tiếp',
      suggestion: 'Dựa trên xu hướng thị trường hiện tại và lịch sử bán hàng của bạn, **{productName}** là sản phẩm hot nhất hiện nay! Hoa hồng cao đến {commission}%.',
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
    },
    // Quick Purchase Modal
    quickBuy: {
      title: 'Mua Nhanh',
      subtitle: 'Thanh toán tốc hành cho nhu cầu thiết yếu',
      recent: 'Gần đây',
      favorites: 'Yêu thích',
      noItems: 'Không tìm thấy mục {tab} nào',
      noRecent: 'Lịch sử mua hàng sẽ hiển thị tại đây',
      noFavorites: 'Đánh dấu yêu thích để truy cập nhanh',
      vatIncluded: 'Giá đã bao gồm VAT',
      viewFullMarketplace: 'Xem tất cả sản phẩm →',
      buyNow: 'Mua Ngay',
      purchased: 'Đã Mua!',
      commission: 'Hoa hồng: {rate}%',
    },
  },

  // Team Dashboard (WEALTH OS: Portfolio Management)
  team: {
    title: 'Portfolio Management',
    subtitle: 'Quản lý mạng lưới đối tác & scaling tài sản',
    leaderDashboard: 'Partner Network Dashboard',
    description: 'Theo dõi performance đối tác, mở rộng thị phần, và tối ưu hóa tăng trưởng portfolio.',

    // Metrics (WEALTH OS: Investment Metrics)
    metrics: {
      totalMembers: 'Active Partners',
      teamVolume: 'Network Portfolio Value',
      averageSales: 'Avg. Profit / Partner',
      topPerformers: 'Top Earners',
      active: 'Active',
    },

    // Charts
    charts: {
      teamPerformance: 'Hiệu Suất Team (Top 5)',
      rankDistribution: 'Phân Bổ Rank',
      personalSales: 'Personal Sales',
      teamVolumeChart: 'Team Volume',
    },

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
      teamMembers: 'Team Members',
      search: 'Tìm kiếm...',
      searchPlaceholder: 'Tìm thành viên...',
      name: 'Họ tên',
      member: 'Thành Viên',
      rank: 'Rank',
      personalSales: 'Personal Sales',
      teamVolume: 'Team Volume',
      downlines: 'Downlines',
      growth: 'Tăng Trưởng',
      actions: 'Hành Động',
      lastActive: 'Hoạt động gần nhất',
      viewProfile: 'Xem hồ sơ',
      sendMessage: 'Nhắn tin',
    },

    // Filters & Sorts
    filters: {
      allRanks: 'Tất cả Rank',
      sortSales: 'Sắp xếp: Sales',
      sortGrowth: 'Sắp xếp: Tăng trưởng',
      sortTeam: 'Sắp xếp: Team Volume',
      export: 'Export',
    },

    // Actions
    actions: {
      sendEmail: 'Send email',
      call: 'Call',
      moreActions: 'More actions',
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
    title: 'Giới Thiệu & Kiếm Tiền',
    subtitle: 'Referral Tracking System',
    description: 'Chia sẻ link giới thiệu và nhận hoa hồng từ mỗi người bạn giới thiệu thành công!',

    // Tabs
    tabs: {
      overview: 'Tổng quan',
      referrals: 'Danh sách',
    },

    // Referral Stats
    stats: {
      totalReferrals: 'Tổng Giới Thiệu',
      activeReferrals: 'Đang hoạt động',
      active: 'Active',
      conversionRate: 'Tỉ Lệ Chuyển Đổi',
      totalRevenue: 'Tổng Doanh Thu',
      totalBonus: 'Tổng Thưởng',
      monthlyReferrals: 'Giới thiệu tháng này',
    },

    // Referral Link
    link: {
      title: 'Link Giới Thiệu Của Bạn',
      description: 'Chia sẻ link này với bạn bè để họ tham gia WellNexus',
      copy: 'Sao chép',
      copied: 'Đã sao chép!',
      share: 'Chia sẻ',
      shareVia: 'Chia sẻ qua',
      email: 'Email',
      sms: 'SMS',
      facebook: 'Facebook',
      twitter: 'Twitter',
      more: 'Thêm',
      qrCode: 'Mã QR',
    },

    // Chart
    chart: {
      title: 'Xu Hướng Giới Thiệu',
      referrals: 'Giới thiệu',
      revenue: 'Doanh thu',
    },

    // Referrals List
    list: {
      title: 'Danh sách giới thiệu',
      name: 'Họ Tên',
      email: 'Email',
      status: 'Trạng Thái',
      revenue: 'Doanh Thu',
      bonus: 'Thưởng',
      registeredAt: 'Ngày Đăng Ký',
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
    title: 'The Copilot',
    subtitle: 'Trợ lý bán hàng AI của bạn',
    description: 'Được trang bị AI tiên tiến để giúp bạn xử lý từ chối khách hàng, tạo kịch bản bán hàng, và cải thiện kỹ năng sales mỗi ngày.',

    // Features
    features: {
      objectionHandling: {
        title: 'Xử Lý Từ Chối',
        description: 'AI phát hiện và gợi ý cách xử lý từ chối thông minh',
      },
      salesScript: {
        title: 'Kịch Bản Bán Hàng',
        description: 'Tạo script bán hàng chuyên nghiệp trong vài giây',
      },
      realtimeCoaching: {
        title: 'Coaching Realtime',
        description: 'Nhận phản hồi và gợi ý cải thiện ngay lập tức',
      }
    },

    // Stats
    stats: {
      title: 'Thống Kê Hôm Nay',
      objectionsHandled: 'Từ chối xử lý',
      scriptsCreated: 'Script tạo',
      conversionRate: 'Tỉ lệ chuyển đổi',
    },

    // Tips
    tips: {
      title: 'Tips Để Sử Dụng Hiệu Quả',
      tip1: 'Nhập câu phản đối thật của khách hàng để nhận gợi ý chính xác nhất',
      tip2: 'Sử dụng tính năng "Script" để có sẵn kịch bản cho từng sản phẩm',
      tip3: 'Sau mỗi cuộc trò chuyện, bấm "Coach" để nhận phản hồi cải thiện',
      tip4: 'Copy gợi ý nhanh và điều chỉnh cho phù hợp với phong cách của bạn',
    },

    // Conversation
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
    title: 'Bảng Xếp Hạng',
    subtitle: 'Top 10 Partners xuất sắc nhất tháng này',

    // Stats
    highestSales: 'Doanh số cao nhất',
    yourPosition: 'Vị trí của bạn',
    yourGrowTokens: 'GROW Tokens của bạn',
    topHundredPlus: 'Top 100+',

    // Table Headers
    rank: 'Hạng',
    partner: 'Partner',
    shopSales: 'SHOP (Doanh số)',
    growToken: 'GROW (Token)',

    // Labels
    you: 'Bạn',
    challenge: 'Thách đấu',
    partnerIdLabel: 'Partner ID: {id}',
    rankLabel: 'Hạng #{rank}',
    toTop10: 'Còn {count} vị trí nữa để lọt Top 10!',
    keepPushing: 'Keep pushing! 💪',

    // Info Footer
    noteLabel: '💡 Lưu ý:',
    noteText: 'Bảng xếp hạng được cập nhật theo thời gian thực. SHOP tokens tính theo tổng doanh số bán hàng, GROW tokens là phần thưởng hiệu suất.',
    lastUpdate: 'Cập nhật lần cuối: {time}',

    // Challenge Modal
    challengeTitle: 'Thử Thách!',
    challengeSubtitle: 'Vượt qua đối thủ của bạn',
    yourGoal: 'Mục tiêu của bạn:',
    goalText: 'Hãy nỗ lực thêm {amount} doanh số để vượt qua {name}!',
    motivation1: '💪 Bạn có thể làm được điều này!',
    motivation2: '🔥 Mỗi đơn hàng đưa bạn gần hơn với mục tiêu',
    motivation3: '🚀 Tiếp tục phấn đấu để leo hạng!',
    readyToFight: 'Sẵn sàng chiến đấu! 💪',
  },

  // Marketing Tools
  marketing: {
    title: 'Marketing Tools',
    subtitle: 'Công cụ hỗ trợ bán hàng và marketing chuyên nghiệp',

    // Stats Overview
    stats: {
      giftCards: 'Gift Cards',
      contentTemplates: 'Content Templates',
      affiliateLink: 'Affiliate Link',
      active: 'Active',
    },

    // Gift Cards Section
    giftCards: {
      title: 'Gift Cards',
      subtitle: 'Tạo mã giảm giá cho khách hàng',
      createNew: 'Tạo mã mới',
      createTitle: 'Tạo Gift Card mới',
      codeLabel: 'Mã giảm giá',
      codePlaceholder: 'VD: AN-200K',
      valueLabel: 'Giá trị giảm',
      typeLabel: 'Loại',
      typeFixed: 'Số tiền cố định (VND)',
      typePercentage: 'Phần trăm (%)',
      createButton: 'Tạo ngay',
      cancel: 'Hủy',
      usageCount: 'Lượt sử dụng:',
      createdDate: 'Ngày tạo:',
    },

    // Content Library Section
    contentLibrary: {
      title: 'Content Library',
      subtitle: 'Thư viện nội dung mẫu để chia sẻ',
      categories: {
        product: '📦 Sản phẩm',
        testimonial: '⭐ Review',
        tips: '💡 Tips',
        promotion: '🎉 Khuyến mãi',
      },
      copyText: 'Copy text',
      copied: 'Đã copy',
      downloadImage: 'Tải ảnh',
    },

    // Affiliate Link & QR Code Section
    affiliate: {
      title: 'Affiliate Link & QR Code',
      subtitle: 'Link giới thiệu cá nhân của bạn',
      linkLabel: 'Link giới thiệu của bạn',
      stats: {
        title: 'Thống kê',
        clicks: 'Lượt click:',
        signups: 'Đăng ký mới:',
        conversion: 'Tỷ lệ chuyển đổi:',
      },
      tip: '💡 Tip: Chia sẻ link này trên Facebook, Zalo, hoặc website cá nhân của bạn để nhận hoa hồng từ mỗi đơn hàng!',
      partnerLabel: 'WellNexus Partner',
      downloadQR: 'Tải QR Code',
      share: 'Chia sẻ',
      qrTip: 'In QR code này ra giấy và dán tại cửa hàng, hoặc chia sẻ online để khách hàng dễ dàng truy cập!',
      shareTitle: 'QR Code của tôi - WellNexus',
      shareText: 'Quét QR code này để truy cập link giới thiệu của tôi!',
    },
    templates: {
      t1: {
        title: 'Giới thiệu ANIMA 119',
        content: '🌿 ANIMA 119 - Giải pháp vàng cho giấc ngủ ngon!\n\n✨ Bạn đang gặp khó khăn với giấc ngủ?\n✨ Thường xuyên lo âu, căng thẳng?\n✨ Muốn cải thiện sức khỏe thần kinh?\n\n💊 ANIMA 119 là câu trả lời hoàn hảo:\n✅ Giúp ngủ sâu, ngủ ngon\n✅ Giảm stress, lo âu\n✅ Cân bằng cảm xúc\n✅ 100% thành phần tự nhiên\n\n💰 Giá: 15.900.000đ\n🎁 Ưu đãi đặc biệt cho khách hàng mới!\n\n📱 Liên hệ ngay để được tư vấn miễn phí!',
      },
      t2: {
        title: 'Câu chuyện thành công',
        content: '💪 Câu chuyện của chị Mai - 35 tuổi\n\n"Trước đây, tôi thường xuyên mất ngủ, mệt mỏi suốt ngày. Sau 2 tuần sử dụng ANIMA 119, tôi đã có những đêm ngủ ngon hơn rất nhiều. Cảm ơn ANIMA đã giúp tôi lấy lại sức khỏe!"\n\n🌟 Bạn cũng có thể thay đổi cuộc sống như chị Mai!\n\n📞 Inbox để được tư vấn và nhận ưu đãi đặc biệt!',
      },
      t3: {
        title: 'Tips sức khỏe',
        content: '🌙 5 Tips để có giấc ngủ ngon:\n\n1️⃣ Tắt điện thoại trước khi ngủ 30 phút\n2️⃣ Uống trà thảo mộc\n3️⃣ Tạo không gian ngủ thoải mái\n4️⃣ Tập yoga hoặc thiền trước khi ngủ\n5️⃣ Sử dụng ANIMA 119 để hỗ trợ giấc ngủ sâu\n\n💚 Chăm sóc sức khỏe là chăm sóc bản thân!\n\n#SứcKhỏe #GiấcNgủNgon #ANIMA',
      },
      t4: {
        title: 'Khuyến mãi đặc biệt',
        content: '🎉 FLASH SALE - Chỉ 3 ngày!\n\n🔥 GIẢM 20% toàn bộ sản phẩm ANIMA\n🎁 Tặng kèm quà tặng trị giá 500.000đ\n🚚 Miễn phí vận chuyển toàn quốc\n\n⏰ Chương trình kết thúc sau:\n📅 72 giờ nữa!\n\n💰 Đặt hàng ngay:\n👉 Nhắn tin để được hỗ trợ\n👉 Số lượng có hạn!\n\n#FlashSale #KhuyếnMãi #ANIMA',
      },
    },
  },

  // Marketing Tools (AI Landing Builder)
  marketingtools: {
    ai_landing_builder: 'AI Landing Builder',
    new: 'Mới',
    t_o_trang_tuy_n_d_ng_chuy_n_ng: 'Tạo trang tuyển dụng chuyên nghiệp trong tích tắc',
    ch_n_template: 'Chọn Template',
    upload_nh_ch_n_dung: 'Upload Ảnh Chân Dung',
    nh_t_i_l_n: 'Ảnh đã tải lên',
    click_thay_i: 'Click để thay đổi',
    click_t_i_nh_l_n: 'Click để tải ảnh lên',
    jpg_png_t_i_a_5mb: 'JPG, PNG (Tối đa 5MB)',
    ai_ang_vi_t_c_u_chuy_n: 'AI đang viết câu chuyện...',
    ai_vi_t_c_u_chuy_n_c_a_t_i: 'AI, viết câu chuyện của tôi',
    preview_landing_page: 'Xem trước Landing Page',
    link_landing_page: 'Link Landing Page:',
    l_t_xem: 'Lượt xem',
    chuy_n_i: 'Chuyển đổi',
    t_l: 'Tỷ lệ',
    xu_t_b_n_ngay: 'Xuất bản ngay',
    landing_page_xu_t_b_n: 'Landing Page đã xuất bản!',
    link_s_n_s_ng_chia_s: 'Link đã sẵn sàng để chia sẻ với ứng viên',
    ch_n_template_v_click_ai_vi: 'Chọn template và click "AI viết câu chuyện" để bắt đầu',
    ai_s_t_o_landing_page_chuy_n: 'AI sẽ tạo Landing Page chuyên nghiệp dựa trên profile của bạn',
    landing_pages_t_o: 'Landing Pages đã tạo (',
    live: 'LIVE',
    views: 'Views',
    conversions: 'Conversions',
  },

  // Health Coach
  healthCoach: {
    title: 'Health Coach AI',
    subtitle: 'Trợ lý sức khỏe thông minh - Tư vấn sản phẩm cá nhân hóa',

    // Chat Messages
    greeting: 'Xin chào! Tôi là **WellNexus Health Coach** 🌿\n\nHãy chia sẻ với tôi về tình trạng sức khỏe hoặc triệu chứng bạn đang gặp phải. Tôi sẽ tư vấn combo sản phẩm phù hợp nhất cho bạn.\n\n**Ví dụ:** "Tôi hay bị mất ngủ và đau đầu" hoặc "Tôi thường xuyên cảm thấy mệt mỏi".',

    greetingResponse: 'Xin chào! Tôi là **WellNexus Health Coach** - trợ lý sức khỏe AI của bạn. 🌿\n\nHãy mô tả các triệu chứng hoặc vấn đề sức khỏe bạn đang gặp, tôi sẽ tư vấn sản phẩm phù hợp nhất.\n\n**Ví dụ:** "Tôi hay bị mất ngủ, đau đầu" hoặc "Tôi cảm thấy mệt mỏi, hay bị ốm".',

    fallbackResponse: 'Cảm ơn bạn đã chia sẻ. Để tư vấn chính xác hơn, bạn có thể mô tả cụ thể hơn các triệu chứng không?\n\n**Gợi ý:** Hãy cho tôi biết bạn đang gặp vấn đề gì (ví dụ: mất ngủ, đau đầu, mệt mỏi, hay bị ốm...)',

    sleepStressResponse: 'Dựa trên các triệu chứng bạn mô tả (mất ngủ, đau đầu, căng thẳng), tôi khuyên dùng **Combo ANIMA Thư Giãn**. Combo này được thiết kế đặc biệt để cải thiện giấc ngủ và giảm căng thẳng thần kinh.',

    fatigueResponse: 'Triệu chứng mệt mỏi và sức đề kháng kém có thể do cơ thể thiếu dinh dưỡng. Tôi gợi ý **Combo Năng Lượng & Miễn Dịch** để phục hồi sức khỏe.',

    // Product Combos
    comboRelaxation: 'Combo ANIMA Thư Giấc',
    comboEnergy: 'Combo Năng Lượng & Miễn Dịch',

    reasonRelaxation: 'ANIMA 119 giúp ổn định hệ thần kinh, cải thiện giấc ngủ. Immune Boost bổ sung năng lượng và tăng sức đề kháng.',
    reasonEnergy: 'Starter Kit cung cấp dinh dưỡng toàn diện, Immune Boost tăng cường miễn dịch và giảm mệt mỏi.',

    // UI Elements
    totalLabel: 'Tổng cộng:',
    orderNow: 'Tạo đơn ngay',
    orderSuccess: '✅ Đã tạo đơn hàng thành công!\n\n**{comboName}** ({totalPrice}) đã được thêm vào lịch sử giao dịch của bạn.\n\nBạn có thể kiểm tra tại trang **Ví Hoa Hồng**. Cảm ơn bạn đã tin dùng ANIMA! 🎉',

    placeholder: 'Mô tả triệu chứng của bạn... (VD: Tôi hay bị mất ngủ, đau đầu)',
    send: 'Gửi',

    quickSuggestionsLabel: 'Gợi ý câu hỏi:',
    suggestions: {
      sleep: 'Tôi hay bị mất ngủ',
      fatigue: 'Tôi cảm thấy mệt mỏi',
      immunity: 'Tăng cường miễn dịch',
    },

    // Footer Disclaimers
    disclaimerTech: '💡 Health Coach AI sử dụng công nghệ phân tích triệu chứng để đề xuất sản phẩm phù hợp.',
    disclaimerMedical: 'Lưu ý: Đây là công cụ hỗ trợ, không thay thế tư vấn y tế chuyên nghiệp.',
  },

  // Health Check (Health Quiz)
  healthCheck: {
    // Dimensions
    dimensions: {
      sleep: 'Giấc ngủ',
      stress: 'Căng thẳng',
      energy: 'Năng lượng',
      exercise: 'Vận động',
      goal: 'Mục tiêu',
    },

    // Quiz Questions
    questions: {
      sleep: {
        question: 'Bạn thường ngủ bao nhiêu tiếng mỗi đêm?',
        options: {
          under5: 'Dưới 5 tiếng',
          _5to6: '5-6 tiếng',
          _6to7: '6-7 tiếng',
          _7to8: '7-8 tiếng',
          over8: 'Trên 8 tiếng',
        }
      },
      stress: {
        question: 'Bạn có hay bị stress hoặc lo âu không?',
        options: {
          veryOften: 'Rất thường xuyên',
          often: 'Thường xuyên',
          sometimes: 'Thỉnh thoảng',
          rarely: 'Hiếm khi',
          never: 'Không bao giờ',
        }
      },
      energy: {
        question: 'Mức năng lượng của bạn trong ngày như thế nào?',
        options: {
          veryTired: 'Rất mệt mỏi',
          tired: 'Thường xuyên mệt',
          normal: 'Bình thường',
          energetic: 'Tràn đầy năng lượng',
          veryEnergetic: 'Luôn năng động',
        }
      },
      exercise: {
        question: 'Bạn tập thể dục bao nhiêu lần mỗi tuần?',
        options: {
          never: 'Không bao giờ',
          _1to2: '1-2 lần/tuần',
          _3to4: '3-4 lần/tuần',
          _5plus: '5+ lần/tuần',
        }
      },
      goal: {
        question: 'Mục tiêu sức khỏe chính của bạn là gì?',
        options: {
          betterSleep: 'Cải thiện giấc ngủ',
          reduceStress: 'Giảm stress',
          increaseEnergy: 'Tăng năng lượng',
          boostImmunity: 'Tăng cường miễn dịch',
          overallHealth: 'Sức khỏe tổng thể',
        }
      }
    },

    // Quiz Interface
    questionProgress: 'Câu hỏi {current} / {total}',
    back: 'Quay lại',
    next: 'Tiếp theo',
    viewResults: 'Xem kết quả',
    timeInfo: '⏱️ Chỉ mất 2 phút để hoàn thành • 🔒 Thông tin của bạn được bảo mật',

    // Results Page
    resultsTitle: 'Kết Quả Đánh Giá',
    yourHealthScore: 'Điểm sức khỏe của bạn',

    // Score Labels
    scoreLabels: {
      excellent: 'Xuất sắc',
      good: 'Tốt',
      average: 'Trung bình',
      needsImprovement: 'Cần cải thiện',
    },

    // Score Descriptions
    scoreDescriptions: {
      excellent: 'Tuyệt vời! Bạn đang duy trì lối sống rất khỏe mạnh. Hãy tiếp tục!',
      good: 'Sức khỏe của bạn ở mức tốt, nhưng vẫn có thể cải thiện thêm.',
      average: 'Sức khỏe của bạn cần được quan tâm nhiều hơn. Hãy bắt đầu thay đổi ngay!',
      poor: 'Sức khỏe của bạn đang cần được cải thiện khẩn cấp. Hãy tham khảo các giải pháp dưới đây!',
    },

    // Recommendations
    recommendationsTitle: 'Gợi ý sản phẩm phù hợp',
    priceLabel: 'Giá',
    orderNow: 'Đặt ngay',

    // Product Benefits
    products: {
      anima119: {
        name: 'Combo ANIMA Thư Giãn',
        reason: 'Hỗ trợ ổn định hệ thần kinh, cải thiện giấc ngủ và giảm căng thẳng',
        benefits: {
          sleep: 'Giúp ngủ sâu, ngủ ngon hơn',
          stress: 'Giảm lo âu, stress',
          emotion: 'Cân bằng cảm xúc',
          memory: 'Tăng cường trí nhớ',
        }
      },
      immuneBoost: {
        name: 'Combo Năng Lượng & Miễn Dịch',
        reason: 'Tăng cường hệ miễn dịch và năng lượng cho cơ thể',
        benefits: {
          immunity: 'Tăng sức đề kháng',
          fatigue: 'Giảm mệt mỏi',
          antioxidant: 'Chống oxy hóa',
          recovery: 'Phục hồi sức khỏe nhanh',
        }
      },
      starterKit: {
        name: 'Starter Kit',
        reason: 'Combo dinh dưỡng toàn diện cho sức khỏe tổng thể',
        benefits: {
          nutrition: 'Bổ sung dinh dưỡng đầy đủ',
          balance: 'Cân bằng cơ thể',
          health: 'Tăng cường sức khỏe',
          allAges: 'Phù hợp mọi lứa tuổi',
        }
      }
    },

    // Consultation CTA
    consultationTitle: 'Cần tư vấn chuyên sâu hơn?',
    consultationDescription: 'Kết nối ngay với Partner của bạn qua Zalo để được tư vấn miễn phí 1-1',
    chatNow: 'Nhắn tin Zalo ngay',

    // Restart
    restartQuiz: 'Làm lại bài đánh giá →',
    // Merged keys
    add_product: 'Add Product',
    bonus_revenue_dttt_represent: 'Bonus Revenue DTTT Represents',
    commit: 'Commit',
    dttt_basis: 'DTTT Basis',
    dttt_commission_logic: 'DTTT Commission Logic',
    edit_config: 'Edit Config',
    esc: 'ESC',
    global_catalog: 'Global Catalog',
    in_stock: 'In Stock',
    inventory_management_dttt_st: 'Inventory Management DTTT Stock',
    low_stock: 'Low Stock',
    'member_21_startup_25': 'Member 21% / Startup 25%',
    member_comm: 'Member Comm',
    out_of_stock: 'Out of Stock',
    partner_comm: 'Partner Comm',
    retail_msrp: 'Retail (MSRP)',
    sku: 'SKU',
  },

  // Agent Dashboard
  agentDashboard: {
    title: 'Hệ Điều Hành Agent',
    subtitle: 'Quản lý và vận hành đội ngũ nhân sự AI',
    establishingNodeSync: 'Đang đồng bộ node...',
    intelligenceGridOptimal: 'Lưới thông minh: Tối ưu',
    operationalTier: 'Cấp độ vận hành: ',
    version: 'v1.2.0 Ổn định',
    registry: 'Registry',
    nodes: 'Nodes',
    strategicSimulatorOffline: 'Mô phỏng chiến lược Offline',
    connectToPolicyEngine: 'Kết nối Policy Engine để chạy mô phỏng thị trường thực.',
    stats: {
      totalAgents: 'Tổng số Agent',
      activeFunctions: 'Phân hệ nghiệp vụ',
      customAgents: 'Expert Agents',
    },
    grid: {
      neuralSync: 'Đang đồng bộ Neural Link...',
      statusActive: 'Hoạt động',
      statusTraining: 'Đang huấn luyện',
      statusStandby: 'Chế độ chờ',
    },
    details: {
      efficiency: 'Hiệu suất xử lý',
      accuracy: 'Độ chính xác',
      latency: 'Độ trễ phản hồi',
      capabilities: 'Khả năng nghiệp vụ',
      trainingHistory: 'Lịch sử huấn luyện',
    }
  },

  // Admin Panel
  admin: {
    title: 'Quản trị hệ thống',
    subtitle: 'Cấu hình và quản lý toàn hệ thống',

    // Sidebar
    sidebarTitle: 'Mission Control',
    adminLabel: 'Admin',
    superUser: 'Super User',

    // Tabs
    tabs: {
      overview: 'Overview',
      cms: 'CMS',
      partners: 'Partners',
      finance: 'Finance',
      strategy: 'Strategy',
    },

    // Overview Tab
    overview: {
      title: 'System Overview',
      subtitle: 'Real-time platform metrics and health status',
      totalRevenue: 'Total Revenue',
      activePartners: 'Active Partners',
      pendingPayouts: 'Pending Payouts',
      systemHealth: 'System Health',
      chartTitle: '7-Day Revenue Trend',
    },

    // CMS Tab
    cms: {
      title: 'Content Management',
      subtitle: 'Edit landing page content and marketing copy',
      heroHeadline: 'Hero Headline',
      heroSubheadline: 'Hero Subheadline',
      ctaButtonText: 'CTA Button Text',
      saveChanges: 'Save Changes',
      saveSuccess: 'CMS Content saved successfully!',
      preview: 'Preview',
    },

    // Partners Tab
    partners: {
      title: 'Partner Operations',
      subtitle: 'Manage partner accounts and KYC verification',
      tableHeaders: {
        id: 'ID',
        name: 'Name',
        rank: 'Rank',
        sales: 'Sales',
        status: 'Status',
        actions: 'Actions',
      }
    },

    // Finance Tab
    finance: {
      title: 'Finance Operations',
      subtitle: 'Manage withdrawal requests and tax compliance',
      gross: 'Gross:',
      tax: 'Tax (10%):',
      net: 'Net:',
      approve: 'Approve',
      reject: 'Reject',
      noRequests: 'No withdrawal requests at this time',
    },

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
    },

    // AST Migration Keys
    mission: 'Mission',
    control_center: 'Control Center',
    ai_sentinel_active: 'AI Sentinel Active',
    monitoring_2_4k_identity_nodes: 'Monitoring 2.4k identity nodes',
    b_ng_i_u_khi_n: 'Bảng điều khiển',
    administrator: 'Administrator',
    superuser_node: 'Superuser node',
    mission_control: 'Mission Control',
    administration: 'Administration',
    secure_session: 'Secure Session',
    // Merged keys
    analyze_all: 'Analyze All',
    automated_fraud_detection: 'Automated Fraud Detection',
    export_ledger: 'Export Ledger',
    ledger_synchronized: 'Ledger Synchronized',
    no_items_in_the_current_filter: 'No items in the current filter',
    platform_liquidity_verificatio: 'Platform Liquidity Verification',
    quarantined_items: 'Quarantined Items',
    security_batch_commit: 'Security Batch Commit',
    security_passed: 'Security Passed',
    treasury_control: 'Treasury Control',
    verifying_digital_ledgers: 'Verifying Digital Ledgers',
    // Merged keys
    action: 'Action',
    content_orchestrator: 'Content Orchestrator',
    create: 'Create',
    cross_platform_content_deliver: 'Cross-Platform Content Delivery',
    link: 'Link',
    loc: 'LOC',
    target: 'Target',
    // Merged keys
    partner_recon_crm: 'Partner Recon CRM',
    precision_orchestration_of_net: 'Precision Orchestration of Network',
    rank_intelligence: 'Rank Intelligence',
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
    },
    // Merged keys
    demo: 'Demo',
  },

  // Landing Page
  landing: {
    hero: {
      title: 'Xây dựng sự nghiệp với WellNexus',
      subtitle: 'Nền tảng kinh doanh thông minh kết hợp AI, Tokenomics và cộng đồng',
      cta: 'Bắt đầu ngay',
      learnMore: 'Tìm hiểu thêm',
    },
    featured: {
      badge: 'Nổi bật',
      title: 'Giải Pháp Sức Khỏe Toàn Diện',
      subtitle: 'Được tin dùng bởi hơn 5,000+ khách hàng và chuyên gia y tế',
      viewAll: 'Xem tất cả sản phẩm',
      addToCart: 'Thêm vào giỏ',
      price: 'Giá bán',
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
      items: {
        item1: {
          name: 'Nguyễn Minh Anh',
          role: 'Gold Partner • TP.HCM',
          content: 'Từ khi tham gia WellNexus, thu nhập của mình tăng 3 lần chỉ sau 6 tháng. Công nghệ AI giúp mình bán hàng hiệu quả hơn rất nhiều!',
        },
        item2: {
          name: 'Trần Hoàng Nam',
          role: 'Platinum Partner • Hà Nội',
          content: 'Mô hình Social Commerce của WellNexus rất khác biệt. Mình có thể xây dựng đội ngũ và có thu nhập thụ động thực sự.',
        },
        item3: {
          name: 'Lê Thanh Hà',
          role: 'Diamond Partner • Đà Nẵng',
          content: 'Team hỗ trợ rất tận tâm, sản phẩm chất lượng cao. Đây là cơ hội kinh doanh tốt nhất mình từng gặp!',
        }
      }
    },
    heroStats: {
      partnersActive: 'Partners Active',
      gmvTotal: 'GMV Total',
      yoyGrowth: 'Tăng trưởng YoY',
      slotsRemaining: 'Slots còn lại'
    },
    socialProof: {
      actions: {
        joined: 'vừa gia nhập Founders Club',
        silver: 'đạt hạng Silver Partner',
        withdraw: 'rút hoa hồng ₫12,500,000',
        team: 'xây dựng team 15 người',
        order: 'đặt hàng ₫2,800,000'
      },
      times: {
        min2: '2 phút trước',
        min5: '5 phút trước',
        min8: '8 phút trước',
        min12: '12 phút trước',
        min15: '15 phút trước'
      }
    },
    cta: {
      title: 'Sẵn sàng bắt đầu?',
      subtitle: 'Tham gia WellNexus hôm nay và xây dựng thu nhập thụ động',
      button: 'Đăng ký miễn phí',
    },
    roadmap: {
      sectionBadge: 'Lộ Trình Phát Triển',
      sectionTitle: 'The Evolution Map',
      subheadline: 'Hành trình từ Partner đến Empire Builder',
      stages: {
        seed: {
          name: 'HẠT GIỐNG',
          description: 'Tuyển 200 Founders Club, Xây dựng niềm tin',
          mission: 'Bán lẻ & Xây dựng cộng đồng',
          status: 'Đang diễn ra'
        },
        tree: {
          name: 'CÂY',
          description: 'Tự động hóa Sales với AI',
          mission: 'Scale team & Automation',
          status: 'Sắp mở khóa'
        },
        forest: {
          name: 'RỪNG',
          description: 'Marketplace & Hệ sinh thái',
          mission: 'Build ecosystem products',
          status: 'Tương lai'
        },
        empire: {
          name: 'ĐẤT',
          description: 'Venture Builder & IPO',
          mission: 'Build the empire',
          status: 'Tầm nhìn 2028'
        }
      }
    },
    whyNow: {
      sectionBadge: 'Lợi Thế Tiên Phong',
      sectionTitle: 'Tại Sao Phải Tham Gia Ngay?',
      subheadline: 'Quyền lợi đặc biệt dành cho những người đi đầu trong giai đoạn Hạt Giống',
      benefits: {
        founders: {
          title: 'Founders Club Bonus',
          description: 'Hoa hồng đặc biệt và equity allocation cho 200 Partner đầu tiên'
        },
        growth: {
          title: 'Tăng Trưởng Sớm',
          description: 'Xây dựng team từ đầu, hưởng lợi từ network effect khi hệ thống scale'
        },
        tech: {
          title: 'Công Nghệ AI Độc Quyền',
          description: 'Truy cập sớm vào Agentic OS và AI tools chỉ dành cho Founders'
        },
        market: {
          title: 'SEA Market First-Mover',
          description: 'Đi đầu trong thị trường $12B, mở rộng sang 4 quốc gia SEA'
        }
      }
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
  },

  // Agent Dashboard - AST Migration Keys
  agentdashboard: {
    establishing_node_sync: 'Establishing node sync...',
    agent_command_center: 'Agent Command Center',
    intelligence_grid_optimal: 'Intelligence Grid: Optimal',
    operational_tier: 'Operational Tier: ',
    v1_2_0_stable: 'v1.2.0 Stable',
    registry: 'Registry',
    nodes: 'Nodes',
    strategic_simulator_offline: 'Strategic Simulator Offline',
    connect_to_the_policy_engine_r: 'Connect to the Policy Engine to run real-time market simulations.',
    // Missing keys merged
    action: 'Action',
    active_now: 'Active Now',
    agent_ecosystem: 'Agent Ecosystem',
    intelligent_agents: 'Intelligent Agents',
    monitoring: 'Monitoring',
    performance: 'Performance',
    total_actions: 'Total Actions',
    total_agents: 'Total Agents',
    total_kpis: 'Total KPIs',
  },

  // Copilot Page - AST Migration Keys
  copilotpage: {
    chat_m_i: 'Chat mới',
    l_ch_s_chat: 'Lịch sử Chat',
    xem_l_ch_s_chat: 'Xem lịch sử chat',
    g_i_prompt_click_d_ng_n: 'Gợi ý Prompt - Click để dùng ngay',
    '85': '85%',
  },

  // Signup Page - AST Migration Keys
  signup: {
    early_access_2_0: 'Early Access 2.0',
  },

  // Error Boundary - AST Migration Keys
  errorboundary: {
    oops_something_went_wrong: 'Oops! Something went wrong',
    we_ve_encountered_an_unexpecte: 'We encountered an unexpected error. Please try again.',
    error_details_dev_only: 'Error Details (Dev Only)',
    reload_page: 'Reload Page',
    go_home: 'Go Home',
  },

  // Rank Progress Bar - AST Migration Keys
  rankprogressbar: {
    rank_upgrade_progress: 'Tiến độ nâng hạng',
    upgrade_to: 'Nâng lên ',
    kh_i_nghi_p: 'Khởi nghiệp',
    '25_commission': '- Hoa hồng 25%',
    complete: 'Hoàn thành',
    remaining: 'Còn lại',
    after_upgrade: 'Sau nâng hạng',
    '25_rate': '25% Hoa hồng',
    almost_there_just: 'Sắp đạt rồi! Chỉ còn ',
    more_to_kh_i_nghi_p_rank: ' nữa để lên hạng Khởi nghiệp!',
  },

  // Withdrawal Modal - AST Migration Keys
  withdrawalmodal: {
    request_submitted: 'Yêu cầu đã gửi!',
    your_withdrawal_request_has_be: 'Yêu cầu rút tiền đã được gửi thành công.',
    processing_time_1_3_business: 'Thời gian xử lý: 1-3 ngày làm việc',
    available_balance: 'Số dư khả dụng',
    '25': '25%',
    '50': '50%',
    '75': '75%',
    max: 'Max',
    bank_account_details: 'Thông tin tài khoản ngân hàng',
    processing_time: 'Thời gian xử lý',
    withdrawal_requests_are_proces: 'Yêu cầu rút tiền được xử lý trong 1-3 ngày làm việc.',
    cancel: 'Hủy',
    submit_request: 'Gửi yêu cầu',
  },

  // East Asia Brand - AST Migration Keys
  eastasiabrand: {
    wellnexus: 'WellNexus',
    v_ch_ng_t_i: 'Về chúng tôi',
    s_n_ph_m: 'Sản phẩm',
    i_t_c: 'Đối tác',
    b_t_u: 'Bắt đầu',
  },

  // Sidebar - AST Migration Keys
  sidebar: {
    wellnexus: 'WellNexus',
    social_commerce: 'Social Commerce',
    the_coach: 'The Coach',
    day_3_30: 'Day 3/30',
    xp: 'XP',
    get_ai_advice: 'Get AI Advice',
  },

  // Live Activities Ticker - AST Migration Keys
  liveactivitiesticker: {
    recent: '',
    nodes: ' activities',
  },

  // Referral QR Code - AST Migration Keys
  referralqrcode: {
    visual_id_key: 'Visual ID Key',
    wellnexus_network: 'WellNexus Network',
    scanning_initiates_sync: 'Scanning initiates sync',
    commit_to_local_storage: 'Commit to Local Storage',
    recommended_for_high_conversio: 'Recommended for high conversion',
  },

  // Referral Trend Chart - AST Migration Keys
  referraltrendchart: {
    propagation_velocity: 'Propagation Velocity',
    growth_yield_trajectory: 'Growth & Yield Trajectory',
  },

  // Affiliate Link Section - AST Migration Keys
  affiliatelinksection: {
    '4_9': '4.9%',
  },

  // Button Component
  button: {
    loading: 'Đang tải...',
  },

  // Premium Navigation - AST Migration Keys
  premiumnavigation: {
    wellnexus: 'WellNexus',
    social_commerce_2_0: 'Social Commerce 2.0',
    premium_member: 'Premium Member',
    hot: 'HOT',
    premium_member_1: 'Premium Member',
    dashboard: 'Dashboard',
    ng_xu_t: 'Đăng xuất',
    b_t_u_ngay: 'Bắt đầu ngay',
    newsletter: 'Newsletter',
    nh_n_th_ng_tin: 'Nhận thông tin ',
    c_quy_n: 'độc quyền',
    ng_k_nh_n_tin_t_c_u: 'Đăng ký nhận tin tức và ưu đãi độc quyền',
    ng_k: 'Đăng ký',
    ng_k_1: 'Đăng ký',
    wellnexus_1: 'WellNexus',
    social_commerce_2_0_1: 'Social Commerce 2.0',
    h_sinh_th_i_social_commerce_t: 'Hệ sinh thái Social Commerce tiên tiến nhất Việt Nam',
    hello_wellnexus_vn: 'hello@wellnexus.vn',
    '84_901_234_567': '+84 901 234 567',
    q1_tp_hcm_vietnam: 'Q1, TP. HCM, Vietnam',
    wellnexus_all_rights_reserved: 'WellNexus. All rights reserved.',
    made_with_in_vietnam: 'Made with ❤️ in Vietnam',
    ssl_secured: 'SSL Secured',
    top_10_east_asia: 'Top 10 East Asia',
  },

  // ======================================
  // AUTO-GENERATED SECTIONS (Batch Fix v2)
  // 115 sections, 736 keys
  // ======================================

  // achievementgrid
  achievementgrid: {
    ecosystem_standing: 'Ecosystem Standing',
  },

  // adminsecuritysettings
  adminsecuritysettings: {
    '100': '100',
    '15_ph_t': '15 phút',
    '1_gi': '1 giờ',
    '2_gi': '2 giờ',
    '30_ph_t': '30 phút',
    b_o_m_t_t_i_kho_n: 'Bảo mật tài khoản',
    b_t_2fa_t_ng_i_m: 'Bật 2FA tăng điểm',
    c_nh_b_o_ng_nh_p: 'Cảnh báo đăng nhập',
    h_y: 'Hủy',
    ho_t_ng: 'Hoạt động',
    i_l_n_cu_i: 'đã lần cuối',
    i_m_b_o_m_t: 'Điểm bảo mật',
    i_m_t_kh_u: 'Đổi mật khẩu',
    l_ch_s_ng_nh_p: 'Lịch sử đăng nhập',
    m_t_kh_u: 'Mật khẩu',
    nh_n_th_ng_b_o_khi_c_ng_nh: 'Nhận thông báo khi có đăng nhập',
    ph_t: 'phút',
    qu_n_l_c_i_t_b_o_m_t_c_a_b: 'Quản lý cài đặt bảo mật của bạn',
    qu_t_m_qr_v_i_ng_d_ng_x_c_th: 'Quét mã QR với ứng dụng xác thực',
    t_ng_ng_xu_t_sau: 'Tự động đăng xuất sau',
    th_i_gian_phi_n: 'Thời gian phiên',
    thi_t_l_p_2fa: 'Thiết lập 2FA',
    x_c_nh_n: 'Xác nhận',
    x_c_th_c_2_y_u_t: 'Xác thực 2 yếu tố',
  },

  // agencyosdemo
  agencyosdemo: {
    '85_ai_powered_automation_comm': '85% AI Powered Automation',
    agencyos_integration: 'AgencyOS Integration',
    agent_kpis: 'Agent KPIs',
    command_categories: 'Command Categories',
    commands: 'Commands',
    execution_history: 'Execution History',
    no_commands_executed_yet_clic: 'No commands executed yet. Click to run.',
    open_command_palette_k: 'Open Command Palette (⌘K)',
  },

  // agentdetailsmodal
  agentdetailsmodal: {
    enforcement: 'Enforcement',
    intelligence_node_context: 'Intelligence Node Context',
  },

  // agentgridcard
  agentgridcard: {
    '0x': '0x',
    neural_training: 'Neural Training',
    node_id: 'Node ID',
    telemetry_stream_active: 'Telemetry Stream Active',
  },

  // airecommendation
  airecommendation: {
    '240': '240',
    users_helped: 'Users Helped',
  },

  // app
  app: {
    commission_wallet: 'Commission Wallet',
  },

  // auditlog
  auditlog: {
    all_administrators: 'All Administrators',
    analyze_all_actions: 'Analyze All Actions',
    audit_trail: 'Audit Trail',
    browser_api_gateway_node: 'Browser API Gateway Node',
    classification: 'Classification',
    close_inspection: 'Close Inspection',
    detailed_forensics_for_trace: 'Detailed Forensics For Trace',
    event_inspection: 'Event Inspection',
    export_dataset: 'Export Dataset',
    immutable_ledger_of_administra: 'Immutable Ledger of Administration',
    network_origin: 'Network Origin',
    no_telemetry_signals_detected: 'No Telemetry Signals Detected',
    operator: 'Operator',
    payload_metadata: 'Payload Metadata',
    resource_node: 'Resource Node',
    temporal_signature: 'Temporal Signature',
    timeline: 'Timeline',
    tracing: 'Tracing',
    utc_synchronization_active: 'UTC Synchronization Active',
  },

  // beeautomationsection
  beeautomationsection: {
    auto_upgrade_threshold: 'Auto Upgrade Threshold',
    bee_engine_automation: 'BEE Engine Automation',
    ctv_commission_r_8: 'CTV Commission R=8%',
    sponsor_bonus_amb: 'Sponsor Bonus (AMB)',
    vnd_sales_ctv_startup: 'VND Sales CTV Startup',
  },

  // bulkactionsbar
  bulkactionsbar: {
    activate: 'Activate',
    ban: 'Ban',
    export_csv: 'Export CSV',
    partner: 'Partner',
    selected: 'Selected',
  },

  // cartdrawer
  cartdrawer: {
    items_confirmed: 'Sản phẩm đã chọn',
    proceed_to_checkout: 'Thanh toán',
    start_adding_premium_products: 'Bắt đầu thêm sản phẩm cao cấp vào giỏ hàng',
    subtotal: 'Tạm tính',
    total: 'Tổng cộng',
    your_cart: 'Giỏ hàng',
    your_cart_is_empty: 'Giỏ hàng trống',
  },

  // chatmessage
  chatmessage: {
    verified_advice: 'Verified Advice',
  },

  // chatsidebar
  chatsidebar: {
    c_c_cu_c_h_i_tho_i: 'Các cuộc hội thoại',
    l_ch_s: 'Lịch sử',
    t_o_cu_c_h_i_tho_i_m_i: 'Tạo cuộc hội thoại mới',
  },

  // cms
  cms: {
    action: 'Action',
    content_orchestrator: 'Content Orchestrator',
    create: 'Create',
    cross_platform_content_deliver: 'Cross Platform Content Delivery',
    link: 'Link',
    loc: 'LOC',
    target: 'Target',
  },

  // commandpalette
  commandpalette: {
    agencyos_85_commands: 'AgencyOS: 85 Commands',
    all: 'All',
    error: 'Error',
    executing_command: 'Executing Command',
    no_commands_found: 'No Commands Found',
    to_open: 'to open',
  },

  // commissionsection
  commissionsection: {
    commission_architecture: 'Commission Architecture',
    max_risk_operational_margin_c: 'Max Risk Operational Margin Cap',
    total_system_payout_threshold: 'Total System Payout Threshold',
  },

  // commissionwallet
  commissionwallet: {
    '10_pit': '10% PIT',
    bonus_revenue: 'Bonus Revenue',
    commission_calculation: 'Commission Calculation',
    date_ref: 'Date/Ref',
    earnings_history: 'Earnings History',
    export_statement: 'Export Statement',
    for_income_exceeding_2_000_000: 'For Income Exceeding 2,000,000',
    gross_amount: 'Gross Amount',
    net_received: 'Net Received',
    pit_10: 'PIT 10%',
    rate: 'Rate',
    request_withdrawal: 'Request Withdrawal',
    source: 'Source',
    status: 'Status',
    tax_compliance_mode: 'Tax Compliance Mode',
    the_bee: 'The BEE',
    total_earnings_gross: 'Total Earnings (Gross)',
    type: 'Type',
    wellnexus_automatically_deduct: 'WellNexus Automatically Deducts',
    withdrawable_balance: 'Withdrawable Balance',
    withheld_tax_pit_10: 'Withheld Tax (PIT 10%)',
  },

  // contextsidebar
  contextsidebar: {
    '15': '15',
    c_i_thi_n_s_c_kh_e: 'Cải thiện sức khỏe',
    h_s_kh_ch_h_ng: 'Hồ sơ khách hàng',
    i_m_s_c_kh_e: 'Điểm sức khỏe',
    i_m_s_t_t_ti_p_t_c_duy_tr: 'Điểm số tốt, tiếp tục duy trì',
    l_ch_s_mua_h_ng: 'Lịch sử mua hàng',
    l_n_t_v_n_g_n_nh_t: 'Lần tư vấn gần nhất',
    t_v_n_ho_n_th_nh: 'Tư vấn hoàn thành',
    th_ng_tin_t_v_n: 'Thông tin tư vấn',
    tu_i: 'tuổi',
    tu_i_1: 'tuổi',
    v_n_ch_nh: 'Vấn đề chính',
  },

  // copilotcoaching
  copilotcoaching: {
    coaching_tips: 'Coaching Tips',
    ng: 'Đúng',
  },

  // copilotheader
  copilotheader: {
    ai_sales_assistant_powered_b: 'AI Sales Assistant powered by Gemini',
    coach: 'Coach',
    script: 'Script',
    the_copilot: 'The Copilot',
  },

  // copilotmessageitem
  copilotmessageitem: {
    g_i_nhanh: 'Gửi nhanh',
  },

  // copilotsuggestions
  copilotsuggestions: {
    g_i: 'Gửi',
    g_i_c_u_h_i: 'Gửi câu hỏi',
  },

  // dailyquesthub
  dailyquesthub: {
    accumulated_today: 'Accumulated Today',
    claim_reward: 'Claim Reward',
    completed: 'Completed',
    completed_1: 'Completed',
    grow: 'GROW',
    grow_1: 'GROW',
    mastered: 'Mastered',
    start_quest: 'Start Quest',
    yield: 'Lợi nhuận',
  },

  // debuggerpage
  debuggerpage: {
    empty: 'Empty',
    environment_window: 'Environment Window',
    local_storage_keys: 'Local Storage Keys',
    // Merged keys
    system_debugger: 'System Debugger',
    'v_debug_1_0': 'v.Debug 1.0',
    window_props: 'Window Props',
    zustand_store_state: 'Zustand Store State',
  },

  // finance
  finance: {
    action: 'Action',
    approve: 'Approve',
    approve_1: 'Approve',
    approved: 'Approved',
    capital_flow: 'Capital Flow',
    capital_flow_management: 'Capital Flow Management',
    export: 'Export',
    filter: 'Filter',
    gross: 'Gross',
    member: 'Member',
    net: 'Net',
    pending_1: 'Pending',
    reject: 'Reject',
    requested: 'Requested',
    status: 'Status',
    tax: 'Tax',
    total_revenue: 'Total Revenue',
    withdrawal_queue: 'Withdrawal Queue',
  },

  // founderrevenuegoal
  founderrevenuegoal: {
    '1m_founder_journey': '$1M Founder Journey',
    current_stage: 'Current Stage',
    projected_yoy_growth: 'Projected YoY Growth',
    revenue_milestone: 'Revenue Milestone',
    // Merged keys
    '1_000_000_usd': '$1,000,000 USD',
    ai_xu_t_h_nh_ng: 'AI đề xuất hành động',
    c_n_t_ng_t_c: 'Cần tăng tốc',
    doanh_thu_hi_n_t_i: 'Doanh thu hiện tại',
    'm_c_ti_u_2026': 'Mục tiêu 2026',
    of_goal: 'of Goal',
    v_t_ti_n: 'Vượt tiến độ',
  },

  // herocard
  herocard: {
    commission: 'Commission',
    h_ng_n_m: 'Hàng năm',
    live_commission: 'Live Commission',
    partner_id: 'Partner ID',
    t_ng_tr_ng: 'Tăng trưởng',
    th_ng: 'Tháng',
    total_yield: 'Total Yield',
    welcome: 'Welcome',
    // Merged keys
    '100m_vnd_revenue': '100M VND Revenue',
    achievement_logic: 'Achievement Logic',
    ecosystem_scaling: 'Ecosystem Scaling',
    founders_pathway: 'Founders Pathway',
    live: 'LIVE',
    reach: 'Reach',
    to_hit_next_milestone: 'to hit next milestone',
    to_unlock: 'to unlock',
    venture_partner_status: 'Venture Partner Status',
  },

  // heroenhancements
  heroenhancements: {
    c_tin_t_ng_b_i: 'Được tin tưởng bởi',
  },

  // inviteflowmodal
  inviteflowmodal: {
    g_i: 'Gửi',
    g_i_l_i_m_i: 'Gửi lời mời',
    ho_n_t_t: 'Hoàn tất',
    l_i_m_i_c_a_b_n: 'Lời mời của bạn',
    m_i_th_m_th_nh_vi_n: 'Mời thêm thành viên',
    nh_p_email_ng_nghi_p: 'Nhập email đồng nghiệp',
    x_c_nh_n_l_i_m_i: 'Xác nhận lời mời',
  },

  // leaderdashboard
  leaderdashboard: {
    export_report: 'Export Report',
    leader_dashboard: 'Leader Dashboard',
    network_overview: 'Network Overview',
    portfolio_management: 'Portfolio Management',
    // Merged keys
    ai_insights: 'AI Insights',
    ai_ph_t_hi_n_nh_ng_th_nh_vi_n: 'AI phát hiện những thành viên',
    ai_xu_t: 'AI đề xuất',
    all_ranks: 'All Ranks',
    c_n_ch: 'Cần chú ý',
    doanh_s: 'Doanh số',
    'doanh_s_1': 'Doanh số',
    'doanh_s_2': 'Doanh số',
    doanh_s_cao_nh_t_th_ng_n_y: 'Doanh số cao nhất tháng này',
    g_i_nh_c_nh: 'Gửi nhắc nhở',
    l_do_c_n_ch: 'Lý do cần chú ý',
    member: 'Member',
    network_health: 'Network Health',
    partner: 'Partner',
    qu_n_l_i_nh_m: 'Quản lý đội nhóm',
    s_h_th_ng: 'Sơ đồ hệ thống',
    t_l_gi_ch_n: 'Tỷ lệ giữ chân',
    t_ng_qu_kh_ch_l: 'Tổng quan khách hàng',
    th_nh_vi_n_c_n_ch: 'Thành viên cần chú ý',
    th_nh_vi_n_r_i_ro_cao: 'Thành viên rủi ro cao',
    th_nh_vi_n_r_i_ro_trung_b_nh: 'Thành viên rủi ro trung bình',
    'top_3_t_ng_t_i': 'Top 3 tổng tài',
  },

  // leadershipladder
  leadershipladder: {
    leadership_ladder: 'Leadership Ladder',
    strategic_rank_progression_map: 'Strategic Rank Progression Map',
  },

  // liveconsole
  liveconsole: {
    autonomous_agents_real_time_l: 'Autonomous Agents Real-time Log',
    intelligence_console: 'Intelligence Console',
    live: 'LIVE',
    // Merged keys
    'bee_agent_core_v4_2_0_stable': 'BEE Agent Core v4.2.0 Stable',
    bps: 'bps',
    encrypted: 'Encrypted',
    'lat_4ms': 'Lat: 4ms',
    live_operations_node_agent: 'Live Operations Node Agent',
    sync_active: 'Sync Active',
    tx: 'Tx',
    wellnexus_bee: 'WellNexus BEE',
  },

  // notification
  notification: {
    dismiss: 'Dismiss',
  },

  // ordermanagement
  ordermanagement: {
    actions: 'Actions',
    all: 'All',
    all_synced: 'All Synced',
    customer: 'Customer',
    date: 'Date',
    filters: 'Filters',
    fraud_check: 'Fraud Check',
    order: 'Order',
    order_id: 'Order ID',
    order_orchestrator: 'Order Orchestrator',
    orders: 'Orders',
    real_time_order_pipeline_manag: 'Real-time Order Pipeline Management',
    status: 'Status',
    sync: 'Sync',
    total: 'Total',
    // Merged keys
    activate_commissions: 'Activate Commissions',
    all_pending_orders_have_been_p: 'All pending orders have been processed',
    cashflow_hub: 'Cashflow Hub',
    never_approve: 'Never Approve',
    operational_risk_protocol: 'Operational Risk Protocol',
    queue_synchronized: 'Queue Synchronized',
    strict_compliance_rule: 'Strict Compliance Rule',
    syncing_global_ledgers: 'Syncing Global Ledgers',
    verify_transactions_and: 'Verify Transactions and Activate Commissions',
    without_verified_bank_clearanc: 'Without verified bank clearance',
  },

  // overview
  overview: {
    active_nodes: 'Active Nodes',
    agent_cluster: 'Agent Cluster',
    certified: 'Certified',
    core: 'Core',
    custom: 'Custom',
    identity_protocol: 'Identity Protocol',
    live_sync: 'Live Sync',
    network_foundation: 'Network Foundation',
    operational: 'Operational',
    partners_active: 'Partners Active',
    pending_operations: 'Pending Operations',
    platform_metrics: 'Platform Metrics',
    revenue_ytd: 'Revenue YTD',
    system_status: 'System Status',
    total_yield: 'Total Yield',
    // Admin Overview page keys
    mission_control: 'Mission Control',
    autonomous_ecosystem_orchestra: 'Autonomous Ecosystem Orchestra',
    ecosystem_online: 'Ecosystem Online',
    ai_action_center: 'AI Action Center',
    autonomous_recommendations: 'Autonomous Recommendations',
    queue_exhausted: 'Queue Exhausted',
    ai_agent_has_autonomously_reso: 'AI Agent has autonomously resolved all pending actions.',
    live_pulse: 'Live Pulse',
    growth_trajectory: 'Growth Trajectory',
    ecosystem_scale: 'Ecosystem Scale',
    risk: 'Risk',
    ai: 'AI: ',
    confident: '% Confident',
    resolve: 'Resolve',
    reject: 'Reject',
  },

  // partnercrm
  partnercrm: {
    partner_crm: 'Partner CRM',
    search: 'Search',
    search_partner_id_name_email: 'Search Partner ID, Name, Email',
  },

  // partnermanagement
  partnermanagement: {
    action: 'Action',
    active: 'Active',
    kyc: 'KYC',
    name: 'Name',
    partner_network: 'Partner Network',
    pending: 'Pending',
    rank: 'Rank',
    real_time_identity_node_manage: 'Real-time Identity Node Management',
    revenue: 'Revenue',
    search_id_name_email: 'Search ID, Name, Email',
    status: 'Status',
    verified: 'Verified',
  },

  // partnerprofilemodal
  partnerprofilemodal: {
    close: 'Close',
    email: 'Email',
    joined: 'Joined',
    kyc_status: 'KYC Status',
    monthly_performance: 'Monthly Performance',
    partner_details: 'Partner Details',
    pending: 'Pending',
    phone: 'Phone',
    rank: 'Rank',
    total_revenue: 'Total Revenue',
    verified: 'Verified',
  },

  // partnerrow
  partnerrow: {
    member: 'Member',
    partner: 'Partner',
  },

  // partners
  partners: {
    all_partners: 'All Partners',
    kyc: 'KYC',
    new: 'New',
    partner_network: 'Partner Network',
    real_time_identity_node_manage: 'Real-time Identity Node Management',
    search_id_name_email: 'Search ID, Name, Email',
    status: 'Status',
    verified: 'Verified',
    view_profile: 'View Profile',
  },

  // productcard
  productcard: {
    add_to_cart: 'Add to Cart',
    ai_pick: 'AI Pick',
    commission: 'Commission',
    price: 'Price',
    view_details: 'View Details',
    // Merged keys
    added: 'Added',
    buy_now: 'Buy Now',
    earn: 'Earn',
    out_of_stock: 'Out of Stock',
    share: 'Share',
    stock: 'Stock',
  },

  // productdetail
  productdetail: {
    back_to_command_registry: 'Back to Command Registry',
    identity_missing: 'Identity Missing',
    premium_tier: 'Premium Tier',
    revert_to_marketplace: 'Revert to Marketplace',
    the_requested_product_node_is: 'The Requested Product Node Is Not Available',
    verified_node: 'Verified Node',
  },

  // productgrid
  productgrid: {
    add_to_cart: 'Add to Cart',
    ai_recommended: 'AI Recommended',
    commission: 'Commission',
    price: 'Price',
  },

  // producthero
  producthero: {
    logistics_depleted: 'Logistics Depleted',
  },

  // productinfo
  productinfo: {
    '4_9_core_rating': '4.9 Core Rating',
    available_capacity: 'Available Capacity',
    bio_optic_optimization: 'Bio Optic Optimization',
    units: 'Units',
  },

  // productpricing
  productpricing: {
    market_valuation: 'Market Valuation',
    node_yield_profit: 'Node Yield (Profit)',
  },

  // products
  products: {
    add_product: 'Add Product',
    bonus_revenue_dttt_represent: 'Bonus Revenue DTTT Represents',
    commit: 'Commit',
    dttt_basis: 'DTTT Basis',
    dttt_commission_logic: 'DTTT Commission Logic',
    edit_config: 'Edit Config',
    esc: 'ESC',
    global_catalog: 'Global Catalog',
    in_stock: 'In Stock',
    inventory_management_dttt_st: 'Inventory Management DTTT Stock',
    low_stock: 'Low Stock',
    member_21_startup_25: 'Member 21% / Startup 25%',
    member_comm: 'Member Comm',
    out_of_stock: 'Out of Stock',
    partner_comm: 'Partner Comm',
    retail_msrp: 'Retail (MSRP)',
    sku: 'SKU',
  },

  // producttabs
  producttabs: {
    standard_engagement_protocol: 'Standard Engagement Protocol',
  },

  // quickactionscard
  quickactionscard: {
    c_ng_c_h_tr_kinh_doanh: 'Công cụ hỗ trợ kinh doanh',
    tip_s_d_ng_c_c_c_ng_c_n: 'Tip: Sử dụng các công cụ này',
  },

  // rankladdersection
  rankladdersection: {
    downlines: 'Downlines',
    rank_migration_ladder: 'Rank Migration Ladder',
    sales_req_vnd: 'Sales Req (VND)',
    target_rank: 'Target Rank',
    team_volume: 'Team Volume',
  },

  // recentactivitylist
  recentactivitylist: {
    view_digital_audit_trace: 'View Digital Audit Trace',
  },

  // redemptionzone
  redemptionzone: {
    grow_rewards: 'GROW Rewards',
    grow_tokens: 'GROW Tokens',
    s_d_hi_n_t_i: 'Số dư hiện tại',
    s_d_ng_grow_token_t_ch_l_y_t: 'Sử dụng GROW Token tích lũy từ hoạt động kinh doanh để đổi lấy những phần quà giá trị.',
    redeem_reward: 'Đổi quà ngay',
    not_enough_grow: 'Chưa đủ GROW',
    categories: {
      all: 'Tất cả',
      tech: 'Công nghệ',
      travel: 'Du lịch',
      courses: 'Khóa học',
    }
  },

  // referralhero
  referralhero: {
    accumulated_revenue: 'Accumulated Revenue',
    this_month: 'This Month',
  },

  // referralnetworkview
  referralnetworkview: {
    f1_sentinel_nodes: 'F1 Sentinel Nodes',
    f2_secondary_propagation: 'F2 Secondary Propagation',
    network_architecture: 'Network Architecture',
    node_val: 'Node Value',
    nodes: 'Nodes',
    nodes_1: 'Nodes',
    tier_1_tier_2_visualization: 'Tier 1 & Tier 2 Visualization',
    yield: 'Lợi nhuận',
  },

  // referralrewardslist
  referralrewardslist: {
    incentive_algorithm: 'Incentive Algorithm',
    yield_mechanics: 'Yield Mechanics',
  },

  // revenuebreakdown
  revenuebreakdown: {
    '100': '100%',
    total_yield: 'Total Yield',
  },

  // revenuechart
  revenuechart: {
    last_30_days: 'Last 30 Days',
    last_7_days: 'Last 7 Days',
    last_7_days_performance: 'Last 7 Days Performance',
    revenue_growth: 'Revenue Growth',
  },

  // revenueprogresswidget
  revenueprogresswidget: {
    annualized_run_rate_arr: 'Annualized Run Rate (ARR)',
    baseline_0: 'Baseline 0',
    benchmark: 'Benchmark',
    global_ecosystem_velocity: 'Global Ecosystem Velocity',
    monthly_liquidity_flow: 'Monthly Liquidity Flow',
    revenue_milestone: 'Revenue Milestone',
    target: 'Target',
  },

  // sessionmanager
  sessionmanager: {
    active_now: 'Active Now',
    active_sessions: 'Active Sessions',
    connected: 'Connected',
    device: 'Device',
    if_you_don_t_recognize_a_sessi: "If you don't recognize a session, revoke it immediately.",
    last_active: 'Last Active',
    security_note: 'Security Note',
    this_device: 'This Device',
  },

  // sharebuttons
  sharebuttons: {
    email: 'Email',
    facebook: 'Facebook',
    telegram: 'Telegram',
    zalo: 'Zalo',
  },

  // signupform
  signupform: {
    email_business: 'Email doanh nghiệp',
    h_v_t_n: 'Họ và tên',
    m_t_kh_u: 'Mật khẩu',
    ng_k_ngay: 'Đăng ký ngay',
    processing_account: 'Đang xử lý tài khoản',
    x_c_nh_n: 'Xác nhận',
  },

  // simulationpanel
  simulationpanel: {
    active_distribution_node: 'Active Distribution Node',
    margin: 'Margin',
    monthly_fixed: 'Monthly Fixed',
    nodes: 'Nodes',
    projected_ebitda: 'Projected EBITDA',
    projected_gmv: 'Projected GMV',
    system_payout: 'System Payout',
    target_aov: 'Target AOV',
    vc_simulation_engine: 'VC Simulation Engine',
  },

  // statsgrid
  statsgrid: {
    '10_pit': '10% PIT',
    next_cycle: 'Next Cycle',
    reserved_tier_gt_2m: 'Reserved Tier >2M',
  },

  // successanimation
  successanimation: {
    success: 'Success',
  },

  // teamcharts
  teamcharts: {
    network_health: 'Network Health',
  },

  // teammemberstable
  teammemberstable: {
    member: 'Member',
    partner: 'Partner',
  },

  // testpage
  testpage: {
    active: 'Active',
    client_status: 'Client Status',
    connectivity_check: 'Connectivity Check',
    well_test_page: 'Well Test Page',
  },

  // top3podium
  top3podium: {
    doanh_s: 'Doanh số',
    doanh_s_cao_nh_t_th_ng_n_y: 'Doanh số cao nhất tháng này',
    top_3_t_ng_t_i: 'Top 3 tổng tài',
  },

  // topproducts
  topproducts: {
    based_on_units_sold: 'Based on Units Sold',
    earn: 'Earn',
    sold: 'Sold',
    top_products: 'Top Products',
  },

  // transactioncard
  transactioncard: {
    commit_approval: 'Commit Approval',
    flagged_for_behavioral_anomaly: 'Flagged for Behavioral Anomaly',
    gross: 'Gross',
    internal_ledger_net: 'Internal Ledger (Net)',
    latency: 'Latency',
    optimal: 'Optimal',
    retention: 'Retention',
    security_engine_quarantine: 'Security Engine Quarantine',
    system_yield_injected: 'System Yield Injected',
    uid: 'UID',
  },

  // valuationcard
  valuationcard: {
    '12_5_pe_ratio': '12.5 PE Ratio',
    mom_growth: 'MoM Growth',
  },

  // venturefooter
  venturefooter: {
    strategic_ecosystem_builder: 'Strategic Ecosystem Builder',
    subscribe_for_exclusive_intake: 'Subscribe for Exclusive Intake',
  },

  // venturemarketmap
  venturemarketmap: {
    init_sea_expansion_protocol: 'Init SEA Expansion Protocol',
    total_addressable_market: 'Total Addressable Market',
    velocity: 'Velocity',
  },

  // venturenavigation
  venturenavigation: {
    apply_recruitment: 'Apply / Recruitment',
    venture_builder: 'Venture Builder',
  },

  // ventureportfolio
  ventureportfolio: {
    arr_node: 'ARR Node',
    growth: 'Growth',
    val: 'Val',
  },

  // ======================================
  // 100x DEEP CLEAN - FINAL BATCH (263 keys)
  // ======================================

  // Additional agentdashboard keys
  agentdashboardx: {
    action: 'Action',
    active_now: 'Active Now',
    agent_ecosystem: 'Agent Ecosystem',
    intelligent_agents: 'Intelligent Agents',
    monitoring: 'Monitoring',
    performance: 'Performance',
    total_actions: 'Total Actions',
    total_agents: 'Total Agents',
    total_kpis: 'Total KPIs',
  },

  // Additional cms keys
  cmsx: {
    action: 'Action',
    content_orchestrator: 'Content Orchestrator',
    create: 'Create',
    cross_platform_content_deliver: 'Cross-Platform Content Delivery',
    link: 'Link',
    loc: 'LOC',
    target: 'Target',
  },

  // Additional debuggerpage keys
  debuggerpagex: {
    system_debugger: 'System Debugger',
    v_debug_1_0: 'v.Debug 1.0',
    window_props: 'Window Props',
    zustand_store_state: 'Zustand Store State',
  },

  // Additional finance keys
  financex: {
    analyze_all: 'Analyze All',
    automated_fraud_detection: 'Automated Fraud Detection',
    export_ledger: 'Export Ledger',
    ledger_synchronized: 'Ledger Synchronized',
    no_items_in_the_current_filter: 'No items in the current filter',
    platform_liquidity_verificatio: 'Platform Liquidity Verification',
    quarantined_items: 'Quarantined Items',
    security_batch_commit: 'Security Batch Commit',
    security_passed: 'Security Passed',
    treasury_control: 'Treasury Control',
    verifying_digital_ledgers: 'Verifying Digital Ledgers',
  },

  // founderrevenuegoal keys
  founderrevenuegoalx: {
    '1_000_000_usd': '$1,000,000 USD',
    ai_xu_t_h_nh_ng: 'AI đề xuất hành động',
    c_n_t_ng_t_c: 'Cần tăng tốc',
    doanh_thu_hi_n_t_i: 'Doanh thu hiện tại',
    m_c_ti_u_2026: 'Mục tiêu 2026',
    of_goal: 'of Goal',
    v_t_ti_n: 'Vượt tiến độ',
  },

  // fraudbadge keys
  fraudbadge: {
    critical_risk: 'Critical Risk',
    suspected: 'Suspected',
    verified: 'Verified',
  },

  // Additional healthcheck keys
  healthcheckx: {
    '100': '100%',
    i_m_s_t_ng_kh_a_c_nh_s_c_kh: 'Điểm số từng khía cạnh sức khỏe',
    l_i_ch_kh_c: 'Lợi ích khác',
    ph_n_t_ch_chi_ti_t: 'Phân tích chi tiết',
    s_n_ph_m_c_ai_xu_t_d_nh: 'Sản phẩm được AI đề xuất dành cho bạn',
    u_ti_n: 'Ưu tiên',
  },

  // Additional herocard keys
  herocardx: {
    '100m_vnd_revenue': '100M VND Revenue',
    achievement_logic: 'Achievement Logic',
    ecosystem_scaling: 'Ecosystem Scaling',
    founders_pathway: 'Founders Pathway',
    live: 'LIVE',
    reach: 'Reach',
    to_hit_next_milestone: 'to hit next milestone',
    to_unlock: 'to unlock',
    venture_partner_status: 'Venture Partner Status',
  },

  // leaderdashboard keys
  leaderdashboardx: {
    ai_insights: 'AI Insights',
    ai_ph_t_hi_n_nh_ng_th_nh_vi_n: 'AI phát hiện những thành viên',
    ai_xu_t: 'AI đề xuất',
    all_ranks: 'All Ranks',
    c_n_ch: 'Cần chú ý',
    doanh_s: 'Doanh số',
    doanh_s_1: 'Doanh số',
    doanh_s_2: 'Doanh số',
    doanh_s_cao_nh_t_th_ng_n_y: 'Doanh số cao nhất tháng này',
    g_i_nh_c_nh: 'Gửi nhắc nhở',
    l_do_c_n_ch: 'Lý do cần chú ý',
    member: 'Member',
    network_health: 'Network Health',
    partner: 'Partner',
    qu_n_l_i_nh_m: 'Quản lý đội nhóm',
    s_h_th_ng: 'Sơ đồ hệ thống',
    t_l_gi_ch_n: 'Tỷ lệ giữ chân',
    t_ng_qu_kh_ch_l: 'Tổng quan khách hàng',
    th_nh_vi_n_c_n_ch: 'Thành viên cần chú ý',
    th_nh_vi_n_r_i_ro_cao: 'Thành viên rủi ro cao',
    th_nh_vi_n_r_i_ro_trung_b_nh: 'Thành viên rủi ro trung bình',
    top_3_t_ng_t_i: 'Top 3 tổng tài',
  },

  // liveconsole keys
  liveconsolex: {
    bee_agent_core_v4_2_0_stable: 'BEE Agent Core v4.2.0 Stable',
    bps: 'bps',
    encrypted: 'Encrypted',
    lat_4ms: 'Lat: 4ms',
    live_operations_node_agent: 'Live Operations Node Agent',
    sync_active: 'Sync Active',
    tx: 'Tx',
    wellnexus_bee: 'WellNexus BEE',
  },

  // login keys
  loginx: {
    demo: 'Demo',
  },

  // loginactivitylog keys
  loginactivitylog: {
    detected: 'Detected',
    device: 'Device',
    failed_login_attempt: 'Failed Login Attempt',
    if_you_don_t_recognize_these_a: "If you don't recognize these activities, secure your account immediately.",
    location: 'Location',
    login_activity: 'Login Activity',
    no_login_attempts_found: 'No login attempts found',
    recent_sign_in_attempts_to_you: 'Recent sign-in attempts to your account',
    status: 'Status',
    time: 'Time',
  },

  // marketingtools keys
  marketingtoolsx: {
    '4_9': '4.9',
    ai_ang_vi_t_c_u_chuy_n: 'AI đang viết câu chuyện',
    ai_landing_builder: 'AI Landing Builder',
    ai_s_t_o_landing_page_chuy_n: 'AI sẽ tạo Landing Page chuyên nghiệp',
    ai_vi_t_c_u_chuy_n_c_a_t_i: 'AI viết câu chuyện của tôi',
    ch_n_template: 'Chọn Template',
    ch_n_template_v_click_ai_vi: 'Chọn Template và Click AI viết',
    chuy_n_i: 'Chuyển đổi',
    click_t_i_nh_l_n: 'Click tải ảnh lên',
    click_thay_i: 'Click thay đổi',
    conversions: 'Conversions',
    jpg_png_t_i_a_5mb: 'JPG, PNG tối đa 5MB',
    l_t_xem: 'Lượt xem',
    landing_page_xu_t_b_n: 'Landing Page xuất bản',
    landing_pages_t_o: 'Landing Pages đã tạo',
    link_landing_page: 'Link Landing Page',
    link_s_n_s_ng_chia_s: 'Link sẵn sàng chia sẻ',
    live: 'LIVE',
    new: 'New',
    nh_t_i_l_n: 'Nhấn tải lên',
    preview_landing_page: 'Preview Landing Page',
    t_l: 'Tỷ lệ',
    t_o_trang_tuy_n_d_ng_chuy_n_ng: 'Tạo trang tuyển dụng chuyên nghiệp',
    upload_nh_ch_n_dung: 'Upload ảnh chân dung',
    views: 'Views',
    xu_t_b_n_ngay: 'Xuất bản ngay',
  },

  // marketplacefilters keys
  marketplacefilters: {
    b_l_c: 'Bộ lọc',
    danh_m_c: 'Danh mục',
    kho_ng_gi: 'Khoảng giá',
    t_l_i_b_l_c: 'Thiết lại bộ lọc',
  },

  // marketplaceheader keys
  marketplaceheader: {
    items_available: 'Items Available',
  },

  // networktree keys
  networktree: {
    add_member: 'Add Member',
    c_ng_t_c_vi_n_ctv: 'Cộng tác viên (CTV)',
    email: 'Email',
    full_name: 'Full Name',
    i_s: 'ID số',
    kh_i_nghi_p: 'Khởi nghiệp',
    loading_network_data: 'Loading Network Data',
    nh_p_c_y_add_member: 'Nhập đầy đủ để Add Member',
    no_data_available: 'No Data Available',
    password: 'Password',
    phone: 'Phone',
    rank: 'Rank',
    s_h_th_ng_network_tree: 'Sơ đồ hệ thống Network Tree',
    sales: 'Sales',
    sponsor: 'Sponsor',
    team: 'Team',
    visual_representation_of_your: 'Visual representation of your network',
  },

  // notificationcenter keys
  notificationcenterx: {
    actions_required: 'Actions Required',
    audit_center: 'Audit Center',
    clear_history: 'Clear History',
    no_new_activity: 'No New Activity',
    notifications: 'Notifications',
    we_ll_notify_you_when_somethin: "We'll notify you when something happens",
  },

  // onboardingquest keys
  onboardingquest: {
    ai_strategy: 'AI Strategy',
    day_3_30: 'Day 3/30',
    powered_by_gemini_ai: 'Powered by Gemini AI',
    stuck_ask_your_ai_coach_for_a: 'Stuck? Ask your AI Coach for a tip!',
    the_coach: 'The Coach',
    xp: 'XP',
  },

  // orderimagemodal keys
  orderimagemodal: {
    evidence_inspection: 'Evidence Inspection',
    external_view: 'External View',
    payment_verification_system_v3: 'Payment Verification System v3',
    security_protocol_cross_verif: 'Security Protocol: Cross Verification',
  },

  // ordermanagement keys
  ordermanagementx: {
    activate_commissions: 'Activate Commissions',
    all_pending_orders_have_been_p: 'All pending orders have been processed',
    cashflow_hub: 'Cashflow Hub',
    never_approve: 'Never Approve',
    operational_risk_protocol: 'Operational Risk Protocol',
    queue_synchronized: 'Queue Synchronized',
    strict_compliance_rule: 'Strict Compliance Rule',
    syncing_global_ledgers: 'Syncing Global Ledgers',
    verify_transactions_and: 'Verify Transactions and Activate Commissions',
    without_verified_bank_clearanc: 'Without verified bank clearance',
  },

  // ordertable keys
  ordertable: {
    approve: 'Approve',
    asset: 'Asset',
    inspect_bill: 'Inspect Bill',
    no_evidence: 'No Evidence',
    transaction_logged: 'Transaction Logged',
  },

  // partnerdetailmodal keys
  partnerdetailmodal: {
    cancel: 'Cancel',
    contact_info: 'Contact Info',
    edit_metrics: 'Edit Metrics',
    email: 'Email',
    joined: 'Joined',
    partner_details: 'Partner Details',
    rank: 'Rank',
    save_changes: 'Save Changes',
  },

  // partners keys
  partnersx: {
    partner_recon_crm: 'Partner Recon CRM',
    precision_orchestration_of_net: 'Precision Orchestration of Network',
    rank_intelligence: 'Rank Intelligence',
  },

  // partnerstable keys
  partnerstable: {
    auth_pending: 'Auth Pending',
    auth_status: 'Auth Status',
    direct_yield: 'Direct Yield',
    ecosystem_rank: 'Ecosystem Rank',
    ghost_network_detected: 'Ghost Network Detected',
    identity_node: 'Identity Node',
    no_partner_nodes_matching_curr: 'No partner nodes matching current filter',
    ops: 'Ops',
    points_buffer: 'Points Buffer',
    synchronizing_crm_ledger: 'Synchronizing CRM Ledger',
  },

  // patterns keys
  patterns: {
    th_l_i: 'Thử lại',
    x_y_ra_l_i: 'Xảy ra lỗi',
  },


  // portfoliosection keys
  portfoliosection: {
    arr: 'ARR',
    growth: 'Growth',
  },

  // productactions keys
  productactions: {
    copy_ref_node: 'Copy Ref Node',
  },

  // productcard keys
  productcardx: {
    added: 'Added',
    buy_now: 'Buy Now',
    earn: 'Earn',
    out_of_stock: 'Out of Stock',
    share: 'Share',
    stock: 'Stock',
  },

  // wallet keys
  walletx: {
    '12': '12%',
    '12_0': '12.0%',
    '12_5': '12.5%',
    '90': '90',
    apy_staking: 'APY Staking',
    blockchain_explorer: 'Blockchain Explorer',
    currency: 'Currency',
    governance_token: 'Governance Token',
    grow: 'GROW',
    grow_1: 'GROW',
    n_p_shop: 'Nạp SHOP',
    t_ng_t_i_s_n: 'Tổng tài sản',
    th_ng_n_y: 'Tháng này',
    vnd_stablecoin_1_1000: 'VND Stablecoin 1:1000',
  },

  // marketingtools - CORRECT section (40 keys from MarketingTools.tsx)
  marketingtools: {
    '4_9': '4.9',
    ai_ang_vi_t_c_u_chuy_n: 'AI đang viết câu chuyện',
    ai_landing_builder: 'AI Landing Builder',
    ai_s_t_o_landing_page_chuy_n: 'AI sẽ tạo Landing Page chuyên nghiệp',
    ai_vi_t_c_u_chuy_n_c_a_t_i: 'AI viết câu chuyện của tôi',
    ch_n_template: 'Chọn Template',
    ch_n_template_v_click_ai_vi: 'Chọn Template và Click AI viết',
    chuy_n_i: 'Chuyển đổi',
    click_t_i_nh_l_n: 'Click tải ảnh lên',
    click_thay_i: 'Click thay đổi',
    conversions: 'Conversions',
    jpg_png_t_i_a_5mb: 'JPG, PNG tối đa 5MB',
    l_t_xem: 'Lượt xem',
    landing_page_xu_t_b_n: 'Landing Page xuất bản',
    landing_pages_t_o: 'Landing Pages đã tạo',
    link_landing_page: 'Link Landing Page',
    link_s_n_s_ng_chia_s: 'Link sẵn sàng chia sẻ',
    live: 'LIVE',
    new: 'New',
    nh_t_i_l_n: 'Nhấn tải lên',
    preview_landing_page: 'Preview Landing Page',
    t_l: 'Tỷ lệ',
    t_o_trang_tuy_n_d_ng_chuy_n_ng: 'Tạo trang tuyển dụng chuyên nghiệp',
    upload_nh_ch_n_dung: 'Upload ảnh chân dung',
    views: 'Views',
    xu_t_b_n_ngay: 'Xuất bản ngay',
  },

  // notificationcenter - CORRECT section (6 keys)
  notificationcenter: {
    actions_required: 'Actions Required',
    audit_center: 'Audit Center',
    clear_history: 'Clear History',
    no_new_activity: 'No New Activity',
    notifications: 'Notifications',
    we_ll_notify_you_when_somethin: "We'll notify you when something happens",
  },

  // Policy Engine
  policyEngine: {
    title: 'Policy Engine',
    version: 'v3.1',
    synchronizingPolicyCore: 'Đang đồng bộ Policy Core',
    strategicIntegrityConfirmed: 'Toàn vẹn chiến lược đã xác nhận',
    sync: 'Đồng bộ:',
    projectionSimulator: 'Mô phỏng dự báo',
    realTime: 'Thời gian thực',
    policyChangesAreCryptographicallySigned: 'Thay đổi chính sách được ký bảo mật',
  },

  // healthcheck - CORRECT section (6 keys)
  healthcheck: {
    '100': '100%',
    i_m_s_t_ng_kh_a_c_nh_s_c_kh: 'Điểm số từng khía cạnh sức khỏe',
    l_i_ch_kh_c: 'Lợi ích khác',
    ph_n_t_ch_chi_ti_t: 'Phân tích chi tiết',
    s_n_ph_m_c_ai_xu_t_d_nh: 'Sản phẩm được AI đề xuất dành cho bạn',
    u_ti_n: 'Ưu tiên',
  },

  // useCopilot
  useCopilot: {
    greeting: 'Xin chào {name}! 👋 Tôi là **The Copilot** - trợ lý bán hàng AI của bạn.\n\nTôi sẽ giúp bạn:\n✅ Xử lý từ chối khách hàng\n✅ Gợi ý câu trả lời thông minh\n✅ Tạo kịch bản bán hàng\n\nHãy thử nhập một câu phản đối của khách hàng, ví dụ: "Sản phẩm này đắt quá!"',
    error_processing: 'Xin lỗi, tôi gặp sự cố. Vui lòng thử lại!',
    script_generated: 'Đã tạo kịch bản bán hàng',
    failed_generate: 'Không thể tạo kịch bản',
    coaching_ready: 'Coaching tips đã sẵn sàng',
    failed_coaching: 'Không thể lấy coaching',
    current_product: 'Sản phẩm hiện tại',
  },
};
