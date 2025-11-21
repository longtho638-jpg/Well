/**
 * English Translations
 *
 * All English text content centralized here for easy management
 * and future i18n expansion.
 */

export const en = {
  // Common
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    viewAll: 'View All',
    learnMore: 'Learn More',
  },

  // Authentication
  auth: {
    login: 'Login',
    logout: 'Logout',
    signup: 'Sign Up',
    signupNow: 'Sign Up Now',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember Me',
    welcomeBack: 'Welcome Back!',
  },

  // Navigation
  nav: {
    overview: 'Overview',
    dashboard: 'Dashboard',
    marketplace: 'Marketplace',
    wallet: 'Wallet',
    myWallet: 'My Wallet',
    copilot: 'AI Copilot',
    theCopilot: 'The Copilot',
    teamLeader: 'Team Leader',
    referral: 'Referral',
    settings: 'Settings',
    profile: 'Profile',
  },

  // Homepage / Landing Page
  landing: {
    hero: {
      badge: 'Recruiting First 200 Partners',
      headline: 'Health Business',
      headlineAccent: 'AI Agentic Era',
      subheadline: 'Social Commerce platform equipped with your own AI Coach, transparent products, and automated sales processes.',
      cta: 'Access Demo Dashboard',
      secondaryCta: 'Learn Our Model',
    },
    features: {
      title: 'Powerful Tools for Pioneers',
      badge: 'Why Choose WellNexus?',
      aiCoach: {
        title: 'Agentic AI Coach',
        description: 'No more loneliness. AI analyzes sales data and suggests strategies daily.',
      },
      transparency: {
        title: 'Absolute Transparency',
        description: 'Blockchain product traceability. Auto-deduct personal income tax per law.',
      },
      community: {
        title: 'Supportive Community',
        description: 'Learn from top leaders. Gamification makes selling fun and engaging.',
      },
      analytics: {
        title: 'Smart Analytics',
        description: 'Real-time dashboard with AI insights to optimize revenue.',
      },
      growth: {
        title: 'Sustainable Growth',
        description: 'Fair MLM system with transparent commissions on every transaction.',
      },
      founderClub: {
        title: 'Founder Club Elite',
        description: 'Share 2% global revenue when reaching 100M VND team volume.',
      },
    },
    painPoints: {
      lonely: {
        title: 'Lonely',
        description: 'No guidance, no roadmap.',
      },
      lackTools: {
        title: 'Lack Tools',
        description: 'Manual management, no marketing knowledge.',
      },
      trust: {
        title: 'Trust Issues',
        description: 'Low-quality products damage reputation.',
      },
    },
    stats: {
      totalIncome: 'Total Income',
    },
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    welcome: "Welcome back, let's grow together!",
    welcomeBack: 'Welcome back',
    serverTime: 'Server Time',
    personalSales: 'Personal Sales',
    teamVolume: 'Team Volume',
    payout: 'Payout',
    estimatedBonus: 'Est. Bonus',
    revenueGrowth: 'Revenue Growth',
  },

  // Copilot Page
  copilot: {
    title: 'The Copilot',
    subtitle: 'Your AI sales assistant',
    description: 'Equipped with advanced AI to help you handle customer objections, create sales scripts, and improve sales skills daily.',
    features: {
      objectionHandling: {
        title: 'Objection Handling',
        description: 'AI detects and suggests smart ways to handle objections',
      },
      scriptGeneration: {
        title: 'Sales Scripts',
        description: 'Generate professional sales scripts in seconds',
      },
      realtimeCoaching: {
        title: 'Realtime Coaching',
        description: 'Get instant feedback and improvement suggestions',
      },
    },
    stats: {
      title: "Today's Stats",
      objectionsHandled: 'Objections Handled',
      scriptsCreated: 'Scripts Created',
      conversionRate: 'Conversion Rate',
    },
    tips: {
      title: 'Tips for Effective Use',
      tip1: 'Enter real customer objections to get the most accurate suggestions',
      tip2: 'Use the "Script" feature to have ready-made scripts for each product',
      tip3: 'After each conversation, click "Coach" to get improvement feedback',
      tip4: 'Copy suggestions quickly and adjust to fit your style',
    },
  },

  // Wallet / Commission
  wallet: {
    title: 'Commission Wallet',
    withdrawableBalance: 'Withdrawable Balance',
    totalEarnings: 'Total Earnings (Gross)',
    withheldTax: 'Withheld Tax (PIT 10%)',
    earningsHistory: 'Earnings History',
    exportStatement: 'Export Statement',
    requestWithdrawal: 'Request Withdrawal',
    taxComplianceMode: 'Tax Compliance Mode',
    taxNote: 'WellNexus automatically deducts 10% PIT for income exceeding 2,000,000 VNĐ per Vietnam Law.',
    tableHeaders: {
      dateRef: 'Date & Ref',
      type: 'Type',
      grossAmount: 'Gross Amount',
      pit: 'PIT (10%)',
      netReceived: 'Net Received',
      status: 'Status',
    },
    transactionTypes: {
      directSale: 'Direct Sale',
      teamBonus: 'Team Bonus',
      withdrawal: 'Withdrawal',
    },
    statuses: {
      completed: 'Completed',
      pending: 'Pending',
      failed: 'Failed',
    },
  },

  // Sidebar / Coach
  sidebar: {
    logo: 'WellNexus',
    tagline: 'Social Commerce',
    seedStage: 'Seed Stage',
    theCoach: 'The Coach',
    dayProgress: 'Day {current}/{total}',
    getAIAdvice: 'Get AI Advice',
    loadingAdvice: 'Loading advice...',
    defaultAdvice: 'Focus on sharing your link with 3 new friends today. Sales come from connections!',
  },

  // Quests / Gamification
  quests: {
    daily: 'Daily Quests',
    weekly: 'Weekly Quests',
    completed: 'Completed',
    xpReward: '+{xp}XP',
  },

  // Products
  products: {
    marketplace: 'Marketplace',
    productDetail: 'Product Detail',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    share: 'Share',
    outOfStock: 'Out of Stock',
    inStock: 'In Stock',
    commission: 'Commission',
    earnCommission: 'Earn {amount}',
    description: 'Description',
    benefits: 'Benefits',
    ingredients: 'Ingredients',
    usage: 'Usage Instructions',
  },

  // Referral
  referral: {
    title: 'Referral',
    yourLink: 'Your referral link',
    copyLink: 'Copy Link',
    shareNow: 'Share Now',
    totalReferrals: 'Total Referrals',
    activeReferrals: 'Active',
    referralRevenue: 'Referral Revenue',
  },

  // Team Leader
  team: {
    title: 'Team Leader',
    teamPerformance: 'Team Performance',
    topPerformers: 'Top Performers',
    teamMembers: 'Team Members',
    totalSales: 'Total Sales',
  },

  // Ranks
  ranks: {
    member: 'Member',
    partner: 'Partner',
    founderClub: 'Founder Club',
  },

  // Errors & Messages
  messages: {
    error: {
      general: 'An error occurred, please try again',
      network: 'Network connection error',
      notFound: 'Not Found',
      unauthorized: "You don't have permission",
      validation: 'Invalid data',
    },
    success: {
      saved: 'Saved successfully',
      updated: 'Updated successfully',
      deleted: 'Deleted successfully',
      copied: 'Copied',
    },
  },

  // Date & Time
  datetime: {
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    days: 'days',
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
  },

  // Currency
  currency: {
    vnd: 'VND',
    usd: 'USD',
  },
};
