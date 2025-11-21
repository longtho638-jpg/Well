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
    }
  },

  // Team Dashboard
  team: {
    title: 'Quản lý đội nhóm',
    subtitle: 'Theo dõi và hỗ trợ đội nhóm của bạn',
    leaderDashboard: 'Leader Dashboard',
    description: 'Theo dõi hiệu suất đội nhóm, phát triển team members, và đạt mục tiêu chung.',

    // Metrics
    metrics: {
      totalMembers: 'Tổng Thành Viên',
      teamVolume: 'Team Volume',
      averageSales: 'Trung Bình / Người',
      topPerformers: 'Top Performers',
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
    }
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
        reason: 'Hỗ trợ ổn định hệ thần kinh, cải thiện giấc ngủ và giảm căng thẳng',
        benefits: {
          sleep: 'Giúp ngủ sâu, ngủ ngon hơn',
          stress: 'Giảm lo âu, stress',
          emotion: 'Cân bằng cảm xúc',
          memory: 'Tăng cường trí nhớ',
        }
      },
      immuneBoost: {
        reason: 'Tăng cường hệ miễn dịch và năng lượng cho cơ thể',
        benefits: {
          immunity: 'Tăng sức đề kháng',
          fatigue: 'Giảm mệt mỏi',
          antioxidant: 'Chống oxy hóa',
          recovery: 'Phục hồi sức khỏe nhanh',
        }
      },
      starterKit: {
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
