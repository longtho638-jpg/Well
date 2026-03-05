import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from 'zustand';
import { createWalletSlice, WalletSlice } from './walletSlice';
import { User, UserRank, Product } from '../../types';
import { agentRegistry, BaseAgent } from '@/agents';

// Mock dependencies
vi.mock('../../utils/tokenomics', () => ({
  generateTxHash: vi.fn(() => 'mock-tx-hash'),
  calculateStakingReward: vi.fn((amount, apy, days) => Number((amount * apy * days / 365).toFixed(4))),
}));

vi.mock('../../utils/tax', () => ({
  calculatePIT: vi.fn((amount) => ({ taxAmount: amount * 0.1, netAmount: amount * 0.9 })),
}));

vi.mock('@/utils/business/wealthEngine', () => ({
  enrichUserWithWealthMetrics: vi.fn((user) => user),
}));

vi.mock('@/agents', () => ({
  agentRegistry: {
    get: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  agentLogger: {
    error: vi.fn(),
  },
}));

describe('walletSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const initialUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    roleId: 1,
    rank: UserRank.KHOI_NGHIEP,
    growBalance: 1000,
    stakedGrowBalance: 500,
    shopBalance: 2000,
    teamVolume: 0,
    totalSales: 0,
    kycStatus: true,
    joinedAt: '2025-01-01',
    referralLink: 'REF123',
    sponsorId: undefined,
    avatarUrl: 'https://example.com/avatar.jpg'
  };

  const mockProduct: Product = {
    id: 'prod-1',
    name: 'Test Product',
    price: 100,
    stock: 10,
    description: 'Desc',
    imageUrl: 'img.jpg',
    commissionRate: 0.1,
    salesCount: 0,
    bonusRevenue: 50
  };

  const createTestStore = (userOverrides = {}) => {
    return createStore<WalletSlice & { user: User; setUser: (u: User) => void; products: Product[]; revenueData: Record<string, unknown>[] }>((set, get, api) => ({
      user: { ...initialUser, ...userOverrides },
      setUser: (user) => set({ user }),
      ...createWalletSlice(set, get, api),
    }));
  };

  it('should stake grow tokens correctly', () => {
    const useStore = createTestStore();
    const { stakeGrowTokens } = useStore.getState();

    stakeGrowTokens(100);

    const state = useStore.getState();
    expect(state.user.growBalance).toBe(900);
    expect(state.user.stakedGrowBalance).toBe(600);
    expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0].type).toBe('Withdrawal'); // Based on current code logic naming
    expect(state.transactions[0].currency).toBe('GROW');
  });

  it('should throw error when staking invalid amount', () => {
    const useStore = createTestStore();
    const { stakeGrowTokens } = useStore.getState();

    expect(() => stakeGrowTokens(0)).toThrow('Invalid stake amount');
    expect(() => stakeGrowTokens(2000)).toThrow('Invalid stake amount');
  });

  it('should unstake grow tokens correctly', () => {
    const useStore = createTestStore();
    const { unstakeGrowTokens } = useStore.getState();

    unstakeGrowTokens(100);

    const state = useStore.getState();
    expect(state.user.stakedGrowBalance).toBe(400);
    // 100 principal returned + 0.9863 reward (100 * 0.12 * 30/365)
    expect(state.user.growBalance).toBe(1100.9863);
    expect(state.transactions).toHaveLength(1);
  });

  it('should throw error when unstaking invalid amount', () => {
    const useStore = createTestStore();
    const { unstakeGrowTokens } = useStore.getState();

    expect(() => unstakeGrowTokens(0)).toThrow('Invalid unstake amount');
    expect(() => unstakeGrowTokens(1000)).toThrow('Invalid unstake amount');
  });

  it('should withdraw shop tokens correctly', async () => {
    const useStore = createTestStore({ shopBalance: 5000000 });
    const { withdrawShopTokens } = useStore.getState();

    await withdrawShopTokens(2000000);

    const state = useStore.getState();
    expect(state.user.shopBalance).toBe(3000000);
    expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0].amount).toBe(2000000);
    expect(state.transactions[0].taxDeducted).toBe(200000); // 10% from mock
  });

  it('should simulate order correctly', async () => {
    const useStore = createTestStore();
    useStore.setState({ products: [mockProduct] });

    const { simulateOrder } = useStore.getState();
    await simulateOrder('prod-1');

    const state = useStore.getState();
    // Stock reduced
    expect(state.products[0].stock).toBe(9);
    // Shop balance increased by commission (25% of 50 bonus revenue = 12.5)
    expect(state.user.shopBalance).toBe(2012.5);
    expect(state.transactions).toHaveLength(1);
  });

  it('should trigger reward agent during order simulation', async () => {
    const useStore = createTestStore();
    useStore.setState({ products: [mockProduct] });

    const mockExecute = vi.fn().mockResolvedValue({ rewardAmount: 50 });
    vi.mocked(agentRegistry.get).mockReturnValue({ execute: mockExecute } as unknown as BaseAgent);

    const { simulateOrder } = useStore.getState();
    await simulateOrder('prod-1');

    expect(agentRegistry.get).toHaveBeenCalledWith('The Bee');
    expect(mockExecute).toHaveBeenCalled();

    const state = useStore.getState();
    // Reward transaction added
    const rewardTx = state.transactions.find(t => t.type === 'Team Volume Bonus' && t.currency === 'GROW');
    expect(rewardTx).toBeDefined();
    expect(rewardTx?.amount).toBe(50);
  });
});
