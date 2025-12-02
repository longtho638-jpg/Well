
import { create } from 'zustand';
import { User, Product, Transaction, Quest, ChartDataPoint, TeamMember, TeamMetrics, Referral, ReferralStats, LandingPageTemplate, UserLandingPage, TeamInsights, RedemptionItem, RedemptionOrder } from './types';
import {
  CURRENT_USER,
  PRODUCTS,
  TRANSACTIONS,
  DAILY_QUESTS,
  REVENUE_DATA,
  TEAM_MEMBERS,
  TEAM_METRICS,
  REFERRALS,
  REFERRAL_STATS,
  LANDING_PAGE_TEMPLATES,
  USER_LANDING_PAGES,
  TEAM_INSIGHTS,
  REDEMPTION_ITEMS,
  REDEMPTION_ORDERS
} from './data/mockData';
import { generateTxHash, calculateStakingReward } from './utils/tokenomics';
import { AgentState, AgentLog, AgentKPI } from './types/agentic';
import { agentRegistry } from './agents';
import { supabase } from './lib/supabase';
import { UserRank } from './types';

// ============================================================================
// WEALTH OS CALCULATION ENGINE
// ============================================================================

/**
 * Calculate Business Valuation (Investment-grade metric)
 * Formula: Monthly Profit * 12 (Annualized) * PE Ratio (5x for high-growth SMB)
 */
function calculateBusinessValuation(user: User): number {
  // Estimate monthly profit: 20% of total sales (conservative margin)
  const monthlyProfit = user.totalSales * 0.20;
  // Annualize the monthly profit
  const annualizedProfit = monthlyProfit * 12;
  // Apply PE ratio of 5x (standard for high-growth small businesses)
  const PE_RATIO = 5;
  return annualizedProfit * PE_RATIO;
}

/**
 * Calculate Equity Value (GROW Token holdings)
 * Assumption: 1 GROW = 10,000 VND market value
 */
function calculateEquityValue(growBalance: number): number {
  const GROW_TO_VND_RATE = 10000;
  return growBalance * GROW_TO_VND_RATE;
}

/**
 * Calculate monthly asset growth rate
 */
function calculateAssetGrowthRate(user: User): number {
  // Simulated growth rate based on team volume momentum
  // Higher team volume = higher growth rate
  if (user.teamVolume > 100_000_000) return 15; // 15% monthly growth
  if (user.teamVolume > 50_000_000) return 10;  // 10% monthly growth
  if (user.teamVolume > 20_000_000) return 7;   // 7% monthly growth
  return 5; // 5% baseline growth
}

/**
 * Enrich user with Wealth OS metrics
 */
function enrichUserWithWealthMetrics(user: User): User {
  const monthlyProfit = user.totalSales * 0.20; // 20% profit margin
  const businessValuation = calculateBusinessValuation(user);
  const equityValue = calculateEquityValue(user.growBalance + user.stakedGrowBalance);
  const cashflowValue = user.shopBalance;
  const assetGrowthRate = calculateAssetGrowthRate(user);
  const projectedAnnualProfit = monthlyProfit * 12;

  return {
    ...user,
    monthlyProfit,
    businessValuation,
    projectedAnnualProfit,
    equityValue,
    cashflowValue,
    assetGrowthRate,
  };
}

interface AppState {
  // Auth State
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;

  // Data Models
  user: User;
  products: Product[];
  transactions: Transaction[];
  quests: Quest[];
  revenueData: ChartDataPoint[];

  // Phase 2: Growth Features
  teamMembers: TeamMember[];
  teamMetrics: TeamMetrics;
  referrals: Referral[];
  referralStats: ReferralStats;

  // TREE MAX LEVEL: AI Landing Builder
  landingPageTemplates: LandingPageTemplate[];
  userLandingPages: UserLandingPage[];

  // TREE MAX LEVEL: AI Insights
  teamInsights: TeamInsights;

  // TREE MAX LEVEL: Redemption Marketplace
  redemptionItems: RedemptionItem[];
  redemptionOrders: RedemptionOrder[];

  // Agent-OS State
  agentState: AgentState;

  // Agent Actions
  executeAgent: (agentName: string, input: any) => Promise<any>;
  getAgentLogs: (agentName?: string) => AgentLog[];
  getAgentKPIs: (agentName: string) => AgentKPI[];
  listAllAgents: () => any[];

  // Supabase Sync Methods & Auth Helpers
  fetchUserFromDB: () => Promise<void>;
  persistAgentLog: (log: AgentLog) => Promise<void>;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuth: boolean) => void;

  // Actions (Simulating Backend Mutations)
  completeQuest: (questId: string) => void;
  simulateOrder: (productId: string) => Promise<void>;

  // Token Actions (Dual Token System)
  stakeGrowTokens: (amount: number) => void;
  unstakeGrowTokens: (amount: number) => void;
  withdrawShopTokens: (amount: number) => Promise<void>;

  // TREE MAX LEVEL: Landing Page Actions
  createLandingPage: (template: string, portraitUrl?: string) => Promise<UserLandingPage>;
  publishLandingPage: (pageId: string) => void;

  // TREE MAX LEVEL: AI Insights Actions
  sendReminder: (memberId: string) => Promise<void>;
  sendGift: (memberId: string, voucherAmount: number) => Promise<void>;

  // TREE MAX LEVEL: Redemption Actions
  redeemItem: (itemId: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial State
  isAuthenticated: false, // Default to false to show Landing Page first

  user: enrichUserWithWealthMetrics(CURRENT_USER), // WEALTH OS: Enrich user with valuation metrics
  products: PRODUCTS,
  transactions: TRANSACTIONS,
  quests: DAILY_QUESTS,
  revenueData: REVENUE_DATA,

  // Phase 2: Growth Features
  teamMembers: TEAM_MEMBERS,
  teamMetrics: TEAM_METRICS,
  referrals: REFERRALS,
  referralStats: REFERRAL_STATS,

  // TREE MAX LEVEL: Initial State
  landingPageTemplates: LANDING_PAGE_TEMPLATES,
  userLandingPages: USER_LANDING_PAGES,
  teamInsights: TEAM_INSIGHTS,
  redemptionItems: REDEMPTION_ITEMS,
  redemptionOrders: REDEMPTION_ORDERS,

  // Agent-OS Initial State
  agentState: {
    activeAgents: new Map(),
    agentLogs: [],
    agentMetrics: new Map(),
  },

  // Auth Actions
  login: () => set({ isAuthenticated: true }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, user: enrichUserWithWealthMetrics(CURRENT_USER) }); 
  },

  // Quest Actions - FIXED: Cộng GROW tokens khi complete quest
  completeQuest: (questId) => set((state) => {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || quest.isCompleted) return state;

    // Quest rewards GROW tokens (XP converted to GROW 1:1)
    const growReward = quest.xp;

    // Create transaction record for GROW reward
    const newTransaction: Transaction = {
      id: `TX-QUEST-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      date: new Date().toISOString().split('T')[0],
      amount: growReward,
      type: 'Team Volume Bonus', // Using existing type for quest rewards
      status: 'completed',
      taxDeducted: 0, // No tax on GROW tokens
      hash: generateTxHash(),
      currency: 'GROW'
    };

    return {
      quests: state.quests.map(q =>
        q.id === questId ? { ...q, isCompleted: true } : q
      ),
      user: {
        ...state.user,
        growBalance: state.user.growBalance + growReward
      },
      transactions: [newTransaction, ...state.transactions]
    };
  }),

  // Sales Actions - FIXED: Cộng SHOP tokens khi bán hàng
  simulateOrder: async (productId) => {
    const state = get();
    const product = state.products.find(p => p.id === productId);

    if (!product || product.stock <= 0) throw new Error("Product unavailable");

    const commission = product.price * product.commissionRate;
    const now = new Date();

    // Transaction for SHOP token commission
    const newTransaction: Transaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      date: now.toISOString().split('T')[0],
      amount: commission,
      type: 'Direct Sale',
      status: 'completed',
      taxDeducted: 0, // Tax calculated separately
      hash: generateTxHash(),
      currency: 'SHOP'
    };

    set((state) => {
      const newRevenueData = [...state.revenueData];
      if (newRevenueData.length > 0) {
         const lastIdx = newRevenueData.length - 1;
         newRevenueData[lastIdx] = {
             ...newRevenueData[lastIdx],
             value: newRevenueData[lastIdx].value + product.price
         };
      }

      // Update user and recalculate Wealth OS metrics
      const updatedUser = {
        ...state.user,
        totalSales: state.user.totalSales + product.price,
        teamVolume: state.user.teamVolume + (product.price * 0.2),
        shopBalance: state.user.shopBalance + commission
      };

      return {
        products: state.products.map(p =>
          p.id === productId
            ? { ...p, stock: p.stock - 1, salesCount: p.salesCount + 1 }
            : p
        ),
        user: enrichUserWithWealthMetrics(updatedUser), // WEALTH OS: Recalculate valuation after sale
        transactions: [newTransaction, ...state.transactions],
        revenueData: newRevenueData
      };
    });

    // AGENTIC WORKFLOW: Trigger "The Bee" Reward Engine
    const beeAgent = agentRegistry.get('The Bee');
    if (beeAgent) {
        const currentState = get();
        try {
            const rewardResult = await beeAgent.execute({
                action: 'processReward',
                transaction: newTransaction,
                userRank: currentState.user.rank
            });

            if (rewardResult && rewardResult.rewardAmount) {
                // Update User Balance with Rewards (GROW Tokens / Points)
                set((state) => ({
                    user: {
                        ...state.user,
                        growBalance: state.user.growBalance + rewardResult.rewardAmount
                    },
                    // Optionally add a transaction record for the reward
                    transactions: [
                        {
                            id: `TX-REWARD-${Date.now()}`,
                            userId: state.user.id,
                            date: new Date().toISOString().split('T')[0],
                            amount: rewardResult.rewardAmount,
                            type: 'Team Volume Bonus', // Categorize as Bonus
                            status: 'completed',
                            taxDeducted: 0,
                            hash: generateTxHash(),
                            currency: 'GROW'
                        },
                        ...state.transactions
                    ]
                }));
                
                // Log agent execution
                const newLogs = beeAgent.getLogs();
                set((state) => ({
                    agentState: {
                        ...state.agentState,
                        agentLogs: [...state.agentState.agentLogs, ...newLogs]
                    }
                }));
            }
        } catch (e) {
            console.error("The Bee failed to distribute reward:", e);
        }
    }
  },

  // Staking Actions - NEW: Stake GROW tokens
  stakeGrowTokens: (amount) => set((state) => {
    if (amount <= 0 || amount > state.user.growBalance) {
      throw new Error("Invalid stake amount");
    }

    const newTransaction: Transaction = {
      id: `TX-STAKE-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      date: new Date().toISOString().split('T')[0],
      amount: amount,
      type: 'Withdrawal', // Using existing type for staking action
      status: 'completed',
      taxDeducted: 0,
      hash: generateTxHash(),
      currency: 'GROW'
    };

    return {
      user: {
        ...state.user,
        growBalance: state.user.growBalance - amount,
        stakedGrowBalance: state.user.stakedGrowBalance + amount
      },
      transactions: [newTransaction, ...state.transactions]
    };
  }),

  // Unstaking Actions - NEW: Unstake GROW tokens with rewards
  unstakeGrowTokens: (amount) => set((state) => {
    if (amount <= 0 || amount > state.user.stakedGrowBalance) {
      throw new Error("Invalid unstake amount");
    }

    // Calculate staking rewards (example: 12% APY for 30 days)
    const stakingReward = calculateStakingReward(amount, 0.12, 30);

    const newTransaction: Transaction = {
      id: `TX-UNSTAKE-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      date: new Date().toISOString().split('T')[0],
      amount: amount + stakingReward,
      type: 'Team Volume Bonus', // Using existing type for rewards
      status: 'completed',
      taxDeducted: 0,
      hash: generateTxHash(),
      currency: 'GROW'
    };

    return {
      user: {
        ...state.user,
        stakedGrowBalance: state.user.stakedGrowBalance - amount,
        growBalance: state.user.growBalance + amount + stakingReward
      },
      transactions: [newTransaction, ...state.transactions]
    };
  }),

  // Withdrawal Actions - NEW: Withdraw SHOP tokens to bank
  withdrawShopTokens: async (amount) => {
    const state = get();

    if (amount <= 0 || amount > state.user.shopBalance) {
      throw new Error("Invalid withdrawal amount");
    }

    const newTransaction: Transaction = {
      id: `TX-WITHDRAW-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      date: new Date().toISOString().split('T')[0],
      amount: amount,
      type: 'Withdrawal',
      status: 'completed',
      taxDeducted: 0, // Tax deducted in backend
      hash: generateTxHash(),
      currency: 'SHOP'
    };

    set((state) => ({
      user: {
        ...state.user,
        shopBalance: state.user.shopBalance - amount
      },
      transactions: [newTransaction, ...state.transactions]
    }));
  },

  // ============================================================================
  // TREE MAX LEVEL: ACTION IMPLEMENTATIONS
  // ============================================================================

  // AI Landing Builder: Create Landing Page
  createLandingPage: async (template, portraitUrl) => {
    const state = get();

    // Simulate AI bio generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiGeneratedBio = `Tôi là ${state.user.name} - ${state.user.rank} tại WellNexus với kinh nghiệm ${Math.floor(Math.random() * 5) + 1} năm trong lĩnh vực chăm sóc sức khỏe. Đội ngũ của tôi đã giúp hàng trăm khách hàng cải thiện chất lượng cuộc sống. Chuyên môn: Tư vấn sức khỏe, phát triển đội nhóm, và kinh doanh bền vững. Hãy để tôi đồng hành cùng bạn trên hành trình chinh phục mục tiêu!`;

    const newPage: UserLandingPage = {
      id: `LP-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      template: template as any,
      portraitUrl,
      aiGeneratedBio,
      publishedUrl: `wellnexus.vn/lp/${state.user.id}`,
      isPublished: false,
      createdAt: new Date().toISOString().split('T')[0],
      views: 0,
      conversions: 0
    };

    set((state) => ({
      userLandingPages: [...state.userLandingPages, newPage]
    }));

    return newPage;
  },

  // AI Landing Builder: Publish Landing Page
  publishLandingPage: (pageId) => set((state) => ({
    userLandingPages: state.userLandingPages.map(page =>
      page.id === pageId ? { ...page, isPublished: true } : page
    )
  })),

  // AI Insights: Send Reminder to At-Risk Member
  sendReminder: async (memberId) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In real app, this would send notification/email
    console.log(`Reminder sent to member ${memberId}`);
  },

  // AI Insights: Send Gift Voucher to At-Risk Member
  sendGift: async (memberId, voucherAmount) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In real app, this would create a voucher and send it
    console.log(`Gift voucher of ${voucherAmount} VND sent to member ${memberId}`);
  },

  // Redemption: Redeem GROW Tokens for Item
  redeemItem: async (itemId) => {
    const state = get();
    const item = state.redemptionItems.find(i => i.id === itemId);

    if (!item) throw new Error("Item not found");
    if (!item.isAvailable) throw new Error("Item not available");
    if (item.stock <= 0) throw new Error("Out of stock");
    if (state.user.growBalance < item.growCost) throw new Error("Insufficient GROW tokens");

    // Create redemption order
    const newOrder: RedemptionOrder = {
      id: `RO-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      itemId: item.id,
      itemName: item.name,
      growSpent: item.growCost,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Create transaction for GROW token spend
    const newTransaction: Transaction = {
      id: `TX-REDEEM-${Date.now().toString().slice(-6)}`,
      userId: state.user.id,
      date: new Date().toISOString().split('T')[0],
      amount: item.growCost,
      type: 'Withdrawal',
      status: 'completed',
      taxDeducted: 0,
      hash: generateTxHash(),
      currency: 'GROW'
    };

    set((state) => ({
      user: {
        ...state.user,
        growBalance: state.user.growBalance - item.growCost
      },
      redemptionItems: state.redemptionItems.map(i =>
        i.id === itemId
          ? { ...i, stock: i.stock - 1, redemptionCount: i.redemptionCount + 1 }
          : i
      ),
      redemptionOrders: [...state.redemptionOrders, newOrder],
      transactions: [newTransaction, ...state.transactions]
    }));

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
  },

  // ============================================================================
  // AGENT-OS ACTIONS
  // ============================================================================

  /**
   * Execute an agent action.
   */
  executeAgent: async (agentName, input) => {
    const agent = agentRegistry.get(agentName);
    if (!agent) {
      throw new Error(`Agent "${agentName}" not found in registry`);
    }

    try {
      const output = await agent.execute(input);

      // Update logs in store
      const newLogs = agent.getLogs();
      set((state) => ({
        agentState: {
          ...state.agentState,
          agentLogs: [...state.agentState.agentLogs, ...newLogs],
        },
      }));

      return output;
    } catch (error) {
      console.error(`[AgentOS] Error executing ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * Get logs for a specific agent or all agents.
   */
  getAgentLogs: (agentName) => {
    const logs = get().agentState.agentLogs;
    return agentName
      ? logs.filter((log) => log.agentName === agentName)
      : logs;
  },

  /**
   * Get KPIs for a specific agent.
   */
  getAgentKPIs: (agentName) => {
    const agent = agentRegistry.get(agentName);
    return agent ? agent.getKPIs() : [];
  },

  /**
   * List all registered agents.
   */
  listAllAgents: () => {
    return agentRegistry.listAll();
  },

  // ============================================================================
  // SUPABASE SYNC METHODS
  // ============================================================================

  setUser: (user) => set({ user: user || CURRENT_USER }),
  setIsAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),

  /**
   * Fetch user from Supabase (called after auth)
   */
  fetchUserFromDB: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (data) {
      // Map Supabase user to app User type
      const user: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        rank: data.rank as any, // Casting to UserRank, assuming DB matches
        totalSales: data.total_sales,
        teamVolume: data.team_volume,
        shopBalance: data.shop_balance,
        growBalance: data.grow_balance,
        stakedGrowBalance: data.staked_grow_balance,
        avatarUrl: data.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        joinedAt: new Date(data.created_at).toISOString().split('T')[0],
        kycStatus: false, // Default, assuming not in DB yet or default false
        monthlyProfit: 0, // Calculated via enrich
        businessValuation: 0, // Calculated via enrich
        projectedAnnualProfit: 0, // Calculated via enrich
        equityValue: 0, // Calculated via enrich
        cashflowValue: 0, // Calculated via enrich
        assetGrowthRate: 0, // Calculated via enrich
      };
      
      set({ user: enrichUserWithWealthMetrics(user), isAuthenticated: true });
    }
  },

  /**
   * Persist agent log to Supabase
   */
  persistAgentLog: async (log: AgentLog) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
        await supabase.from('agent_logs').insert([{
        agent_name: log.agentName,
        action: log.action,
        input: log.inputs,
        output: log.outputs,
        user_id: session.user.id
        }]);
    }
  }
}));
