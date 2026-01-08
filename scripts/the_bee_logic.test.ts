
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase Client
const mockRpc = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();

const mockSupabase = {
    from: mockFrom,
    rpc: mockRpc,
};

// Mock Chaining
mockFrom.mockReturnValue({
    update: mockUpdate,
    select: vi.fn().mockReturnThis(),
    eq: mockEq,
});
mockUpdate.mockReturnValue({
    eq: mockEq,
});
mockEq.mockResolvedValue({ error: null });
mockRpc.mockResolvedValue({ error: null });

// --- THE LOGIC TO TEST (Copied & Adapted from agent-worker/index.ts) ---

async function runTheBee(payload: any, supabaseClient: any) {
    const { user_id, amount, transaction_id } = payload;

    // 1. Calculate Logic
    const rate = 0.05; // Base 5%
    const rewardAmount = Math.floor(amount * rate);

    console.log(`🐝 The Bee: Processing Reward for User ${user_id}`);
    console.log(`💰 Amount: ${amount} -> Reward: ${rewardAmount}`);

    // 2. Transactional Update
    const { error } = await supabaseClient.rpc('distribute_reward', {
        p_user_id: user_id,
        p_amount: rewardAmount,
        p_source_tx: transaction_id
    });

    if (error) throw new Error(error.message);
    return { success: true, rewardAmount };
}

// --- THE TEST SUITE ---

describe('The Bee Agent Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate 5% reward correctly', async () => {
        const payload = {
            user_id: 'user-123',
            amount: 1000000, // 1M VND
            transaction_id: 'tx-abc'
        };

        const result = await runTheBee(payload, mockSupabase);

        expect(result.rewardAmount).toBe(50000); // 5% of 1M
        expect(mockRpc).toHaveBeenCalledWith('distribute_reward', {
            p_user_id: 'user-123',
            p_amount: 50000,
            p_source_tx: 'tx-abc'
        });
    });

    it('should handle zero amount', async () => {
        const payload = { user_id: 'user-123', amount: 0, transaction_id: 'tx-zero' };
        const result = await runTheBee(payload, mockSupabase);
        expect(result.rewardAmount).toBe(0);
    });

    it('should throw error if RPC fails', async () => {
        mockRpc.mockResolvedValueOnce({ error: { message: 'RPC Failed' } });
        const payload = { user_id: 'user-123', amount: 100, transaction_id: 'tx-fail' };

        await expect(runTheBee(payload, mockSupabase)).rejects.toThrow('RPC Failed');
    });
});
