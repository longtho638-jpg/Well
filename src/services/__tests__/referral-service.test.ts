import { describe, it, expect, vi, beforeEach } from 'vitest';
import { referralService } from '../referral-service';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('ReferralService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('transformToHierarchy', () => {
    it('should return null for empty data', () => {
      const result = referralService.transformToHierarchy([]);
      expect(result).toBeNull();
    });

    it('should correctly transform flat data to tree', () => {
      const flatData = [
        {
          id: 'root',
          user_id: 'root',
          name: 'Root User',
          rank: 'diamond',
          level: 1,
          total_sales: 1000,
          personal_sales: 100,
          parent_id: null,
          created_at: '2023-01-01',
          active_downlines: 2,
          avatar_url: null,
        },
        {
          id: 'child1',
          user_id: 'child1',
          name: 'Child 1',
          rank: 'gold',
          level: 2,
          total_sales: 500,
          personal_sales: 50,
          parent_id: 'root',
          created_at: '2023-01-02',
          active_downlines: 0,
          avatar_url: null,
        },
        {
          id: 'child2',
          user_id: 'child2',
          name: 'Child 2',
          rank: 'silver',
          level: 2,
          total_sales: 300,
          personal_sales: 30,
          parent_id: 'root',
          created_at: '2023-01-03',
          active_downlines: 0,
          avatar_url: null,
        },
      ];

      const tree = referralService.transformToHierarchy(flatData);

      expect(tree).not.toBeNull();
      expect(tree?.id).toBe('root');
      expect(tree?.children).toHaveLength(2);
      expect(tree?.children?.[0].id).toBe('child1');
      expect(tree?.children?.[1].id).toBe('child2');
    });
  });

  describe('getDownlineTree', () => {
    it('should call RPC and transform data', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockData = [
        {
            id: 'user-123',
            user_id: 'user-123',
            name: 'Root',
            rank: 'diamond',
            level: 1,
            total_sales: 0,
            personal_sales: 0,
            parent_id: null,
            created_at: '2023-01-01',
            active_downlines: 0,
            avatar_url: null,
        },
      ];

      vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser } } as never);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null } as never);

      const result = await referralService.getDownlineTree();

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.rpc).toHaveBeenCalledWith('get_downline_tree', {
        p_user_id: 'user-123',
      });
      expect(result?.id).toBe('user-123');
    });

    it('should throw error if RPC fails', async () => {
        const mockUser = { id: 'user-123' };
        vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: mockUser } } as never);
        vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'RPC Error' } } as never);

        await expect(referralService.getDownlineTree()).rejects.toThrow('RPC Error');
    });
  });
});
