import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWalletSlice, WalletState, WalletActions } from './walletSlice';
import { User, UserRank, Product } from '../../types';
import { agentRegistry } from '@/agents';

// Mock dependencies
vi.mock('@/utils/tokenomics', () => ({
  generateTxHash: () => 'mock-hash',
  calculateStakingReward: (amount: number) => amount * 0.1,
}));

vi.mock('@/utils/tax', () => ({
  calculatePIT: () => ({ taxAmount: 10000, netAmount: 90000 }),
}));

vi.mock('@/utils/business/wealthEngine', () => ({
  enrichUserWithWealthMetrics: (user: User) => user,
}));

vi.mock('@/agents', () => ({
  agentRegistry: {
    get: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  agentLogger: { error: vi.fn() },
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    })),
  },
}));

describe('WalletSlice', () => {
  let store: WalletState & WalletActions & { user: User; setUser: (u: User) => void; products: Product[]; revenueData: Record<string, unknown>[] };
  let set: any;
  let get: any;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    rank: UserRank.CTV,
    roleId: 8,
    totalSales: 0,
    teamVolume: 0,
    shopBalance: 5000000,
    growBalance: 1000,
    stakedGrowBalance: 500,
    avatarUrl: '',
    joinedAt: '',
    kycStatus: false,
  } as User;

  const mockProduct: Product = {
    id: 'prod-1',
    name: 'Product 1',
    price: 100000,
    stock: 10,
    salesCount: 0,
    commissionRate: 0.25,
    imageUrl: '',
    description: '',
  };

  beforeEach(() => {
    set = vi.fn((partial) => {
      // Handle function updates: set((state) => ({ ... }))
      if (typeof partial === 'function') {
        const updates = partial(store);
        Object.assign(store, updates);
      } else {
        Object.assign(store, partial);
      }
    });

    get = () => store;

    // Initialize store with mock user and products
    const slice = createWalletSlice(set, get, {} as any);
    store = {
      ...slice,
      user: mockUser,
      setUser: (u: User) => { store.user = u; },
      products: [mockProduct], // Provide products here as they come from ProductSlice
      revenueData: []
    };
  });

  it('should stake GROW tokens correctly', () => {
    store.stakeGrowTokens(100);

    expect(store.user.growBalance).toBe(900);
    expect(store.user.stakedGrowBalance).toBe(600);
    expect(store.transactions[0].type).toBe('Withdrawal');
    expect(store.transactions[0].amount).toBe(100);
  });

  it('should throw error when staking invalid amount', () => {
    expect(() => store.stakeGrowTokens(2000)).toThrow('Invalid stake amount');
  });

  it('should unstake GROW tokens correctly', () => {
    store.unstakeGrowTokens(100);

    // 100 + 10 reward (mocked)
    expect(store.user.growBalance).toBe(1110);
    expect(store.user.stakedGrowBalance).toBe(400);
    expect(store.transactions[0].type).toBe('Team Volume Bonus');
  });

  it('should withdraw SHOP tokens correctly', async () => {
    await store.withdrawShopTokens(2000000);

    expect(store.user.shopBalance).toBe(3000000);
    expect(store.transactions[0].type).toBe('Withdrawal');
    expect(store.transactions[0].taxDeducted).toBe(10000);
  });

  it('should simulate order correctly', async () => {
    await store.simulateOrder('prod-1');

    // Commission: 100000 * 0.5 (bonusRevenue) * 0.21 (CTV rank) = 10500
    // But logic says: (userRank >= KHOI_NGHIEP) ? 0.25 : 0.21
    // CTV is 8, KHOI_NGHIEP is 7. 8 >= 7 is true. So 0.25.
    // Commission = 50000 * 0.25 = 12500

    expect(store.user.shopBalance).toBe(5012500);
    expect(store.user.totalSales).toBe(100000);

    // Check product stock update
    const updatedProduct = store.products.find(p => p.id === 'prod-1');
    expect(updatedProduct?.stock).toBe(9);
    expect(updatedProduct?.salesCount).toBe(1);
  });

  it('should trigger Bee agent reward on order', async () => {
    const mockExecute = vi.fn().mockResolvedValue({ rewardAmount: 50 });
    (agentRegistry.get as any).mockReturnValue({ execute: mockExecute });

    await store.simulateOrder('prod-1');

    expect(mockExecute).toHaveBeenCalled();
    // 1000 + 50 reward
    expect(store.user.growBalance).toBe(1050);
    // Should have 2 transactions: 1 sale, 1 reward
    expect(store.transactions.length).toBe(2);
    expect(store.transactions[0].type).toBe('Team Volume Bonus'); // Reward
    expect(store.transactions[1].type).toBe('Direct Sale'); // Order
  });
});
