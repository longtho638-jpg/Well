/**
 * English Translation Dictionary for WellNexus
 * Central source of truth for all UI text in the application
 */

export const en = {
  // Common/Shared Text
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    failed: 'Failed',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    search: 'Search',
    filter: 'Filter',
    copy: 'Copy',
    sort: 'Sort',
    viewAll: 'View All',
    viewDetails: 'View Details',
    notSupportedYet: 'Coming Soon',
    blocked: 'Blocked',
    currency: {
      vnd: '₫',
      grow: 'Token',
      shop: 'SHOP',
    },
    location: {
      vietnam: 'Vietnam',
    },
    rank: {
      daisu: 'Ambassador',
      ctv: 'Collaborator',
    }
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    network: 'Network',
    products: 'Products',
    partner: 'Partner',
    ventureDescription: 'Join 200+ Co-Founders',
    marketplace: 'Marketplace',
    wallet: 'Wallet',
    team: 'Team',
    copilot: 'AI Copilot',
    referral: 'Referral',
    healthCoach: 'Health Coach',
    leaderboard: 'Leaderboard',
    marketingTools: 'Marketing Tools',
    healthCheck: 'Health Check',
    admin: 'Admin',
    settings: 'Settings',
    logout: 'Logout',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    company: 'Company',
    aboutUs: 'About Us',
    careers: 'Careers',
    ventureProgram: 'Venture Program',
    withdrawal: 'Withdrawal',
  },

  // Landing Page - AST Migration Keys
  landingpage: {
    ultimate_level_wellness: 'ULTIMATE LEVEL WELLNESS',
    hu_n_luy_n_vi_n_ai: 'AI Coach',
    h_ng_d_n_c_nh_n_h_a_b_i_gemi: 'Personalized guidance by Gemini',
    thu_nh_p_th_ng: 'Passive Income',
    theo_d_i_hoa_h_ng_t_ng_v_p: 'Real-time commission tracking',
    '12_450': '12,450,000₫',
    thu_nh_p_tb_partner: 'Avg Income/Partner',
    c_ng_ng: 'Community',
    tham_gia_c_ng_1_000_founders: 'Join 1,000+ successful Founders',
    m_r_ng_to_n_c_u: 'Global Expansion',
    s_n_s_ng_chinh_ph_c_th_tr_ng: 'Ready to conquer Southeast Asia',
    m_kh_a_khi_t: 'Unlock when reaching ',
    xem_t_m_nh_n: 'View vision',
    giai_o_n_hi_n_t_i: 'Current stage',
    tham_gia_ngay_ch_c_n_157_sl: 'Join now - Only 157 slots left',
    c_u_chuy_n_th_nh_c_ng: 'Success stories',
    partner_n_i_g_v_wellnexus: 'What Partners say',
    h_ng_ng_n_partner_thay_i: 'Thousands transformed with WellNexus',
  },

  // Dashboard Page
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome back, {name}!',
    serverTime: 'Server Time',

    hero: {
      greeting: 'Hello, {name}!',
      description: 'Track your business growth in real-time',
      shareButton: 'Share Referral Link',
    },

    stats: {
      totalRevenue: 'Total Revenue',
      totalCommission: 'Total Commission',
      activeMembers: 'Active Members',
      conversionRate: 'Conversion Rate',
      pendingOrders: 'Pending Orders',
      completedOrders: 'Completed Orders',
    },

    quickActions: {
      title: 'Quick Actions',
      addMember: 'Add Member',
      viewReports: 'View Reports',
      manageProducts: 'Manage Products',
    },
  },

  // Auth
  auth: {
    login: {
      title: 'Welcome Back',
      subtitle: 'Sign in to your account',
      email: 'Email',
      password: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      loginButton: 'Sign In',
      noAccount: "Don't have an account?",
      signUp: 'Sign Up',
      or: 'Or',
    },
    signup: {
      title: 'Create Account',
      subtitle: 'Join WellNexus',
      fullName: 'Full Name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      referralCode: 'Referral Code',
      agreeToTerms: 'I agree to Terms',
      signupButton: 'Create Account',
      haveAccount: 'Already have account?',
      signIn: 'Sign In',
    },
    register: {
      password: 'Password',
    },
    password: {
      strength: {
        weak: 'Weak',
        fair: 'Fair',
        good: 'Good',
        strong: 'Strong',
      },
      requirements: {
        length: 'At least 8 characters',
        uppercase: 'One uppercase letter',
        lowercase: 'One lowercase letter',
        number: 'One number',
        special: 'One special character',
      },
    },
  },

  // Landing Page - Full Structure
  landing: {
    hero: {
      badge: 'VENTURE BUILDER PLATFORM',
      title: 'Build Your Health Empire',
      subtitle: 'AI-Powered MLM for Wellness',
      cta: 'Start Building',
      learnMore: 'Learn More',
    },

    features: {
      sectionBadge: 'Core Features',
      sectionTitle: 'Everything You Need',
      aiCoach: {
        title: 'AI Health Coach',
        description: 'Personalized Gemini AI guidance',
      },
      commission: {
        title: 'Real-time Tracking',
        description: 'Monitor growth metrics live',
      },
      community: {
        title: 'Global Community',
        description: '1,000+ wellness entrepreneurs',
      },
      marketplace: {
        title: 'Integrated Marketplace',
        description: 'Curated wellness products',
      },
    },

    roadmap: {
      sectionBadge: 'Development Roadmap',
      sectionTitle: 'Evolution Map',
      subheadline: 'Partner to Empire Builder',
      unlock_at: 'Unlock at ',
      view_vision: 'View vision',
      current_stage: 'Current stage',
      stages: {
        seed: {
          name: 'SEED',
          description: '200 Founders Club',
          mission: 'Retail & Community',
          status: 'In Progress',
          benefits: {
            income: 'Active sales income',
            founder: 'Founders commission',
            ai: 'Basic AI tools',
            support: '1-on-1 support',
          }
        },
        tree: {
          name: 'TREE',
          description: 'Scale & AI',
          mission: 'Passive income streams',
          status: 'Q2 2026',
          benefits: {
            passive: 'Multi-level income',
            ai: 'Full AI Coach',
            team: 'Team dashboard',
            rewards: 'Performance bonuses',
          }
        },
        forest: {
          name: 'FOREST',
          description: 'Nationwide ecosystem',
          mission: 'Sustainable business',
          status: 'Q4 2026',
          benefits: {
            ecosystem: 'Full ecosystem',
            leadership: 'Leadership bonuses',
            training: 'Advanced training',
            recognition: 'Top performer awards',
          }
        },
        empire: {
          name: 'EMPIRE',
          description: 'Co-ownership',
          mission: 'Become stakeholder',
          status: 'Future Vision',
          benefits: {
            market: 'Marketplace ownership',
            data: 'Data monetization',
            equity: 'Equity participation',
          }
        },
        metropolis: {
          name: 'METROPOLIS',
          description: 'Global franchise',
          mission: 'International markets',
          status: 'Future Vision',
          benefits: {
            franchise: 'Global franchise',
            global: '10+ countries',
            diversified: 'Product portfolio',
            legacy: 'Lasting legacy',
          }
        },
      },
    },

    testimonials: {
      sectionBadge: 'Success Stories',
      sectionTitle: 'What Partners Say',
      subheadline: 'Transformed lives',
    },

    cta: {
      sectionBadge: 'Ready to Start?',
      title: 'Join the Revolution',
      subtitle: 'Limited spots - 157 left',
      primaryButton: 'Become Partner',
      secondaryButton: 'Schedule Demo',
    },

    footer: {
      description: 'AI health venture platform',
      quickLinks: {
        title: 'Quick Links',
        home: 'Home',
        about: 'About',
        features: 'Features',
        pricing: 'Pricing',
        contact: 'Contact',
      },
      legal: {
        title: 'Legal',
        privacy: 'Privacy',
        terms: 'Terms',
        compliance: 'Compliance',
      },
      contact: {
        title: 'Contact',
        email: 'Email',
        phone: 'Phone',
        address: 'Address',
        placeholder: 'comm_channel@secure.vn',
      },
      subscribe_for_exclusive_intake: 'Subscribe Updates',
      copyright: '© 2026 WellNexus // Zero Debt',
      privacy: 'Privacy',
      terms: 'Terms',
    },
  },

  // Network
  network: {
    title: 'My Network',
    totalMembers: 'Total Members',
    activeMembers: 'Active',
    newThisMonth: 'New This Month',
    searchPlaceholder: 'Search...',
    filterAll: 'All',
    filterActive: 'Active',
    filterInactive: 'Inactive',
    viewDetails: 'Details',
    addMember: 'Add Member',
  },

  // Withdrawal
  withdrawal: {
    title: 'Withdrawal',
    availableBalance: 'Available',
    minimumAmount: 'Min: 100,000₫',
    selectBank: 'Select Bank',
    accountNumber: 'Account Number',
    accountName: 'Account Name',
    amount: 'Amount',
    note: 'Note',
    submitRequest: 'Submit Request',
    history: 'History',
    status: {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
    },
    errors: {
      insufficientBalance: 'Insufficient balance',
      belowMinimum: 'Below minimum',
      invalidAccount: 'Invalid account',
      selectBank: 'Select bank',
    },
  },

  // Commission Wallet
  commissionWallet: {
    title: 'Commission Wallet',
    totalEarned: 'Total Earned',
    availableBalance: 'Available',
    pendingCommission: 'Pending',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    withdraw: 'Withdraw',
    history: 'History',
    date: 'Date',
    type: 'Type',
    amount: 'Amount',
    status: 'Status',
    types: {
      commission: 'Commission',
      bonus: 'Bonus',
      withdrawal: 'Withdrawal',
      refund: 'Refund',
    },
  },

  // Products
  products: {
    title: 'Products',
    searchPlaceholder: 'Search products...',
    categories: 'Categories',
    allProducts: 'All Products',
    priceRange: 'Price Range',
    sortBy: 'Sort By',
    newest: 'Newest',
    priceLowToHigh: 'Price: Low to High',
    priceHighToLow: 'Price: High to Low',
    popularity: 'Popularity',
    addToCart: 'Add to Cart',
    viewDetails: 'View Details',
    outOfStock: 'Out of Stock',
    inStock: 'In Stock',
  },

  // useStatsGrid Hook
  useStatsGrid: {
    tbd: 'TBD',
  },

  // useHeroCard Hook
  useHeroCard: {
    share_title: 'Share Title',
    share_text: 'Share Text',
  },
};
