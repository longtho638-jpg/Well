import { UserRank } from '@/types';

/**
 * Tính toán tỷ lệ hoa hồng dựa trên cấp bậc (Rank) — Bee 2.0
 * THIEN_LONG (1) → DAI_SU (6): 25%
 * KHOI_NGHIEP (7): 25%
 * CTV (8): 21%
 * Note: Rank value càng nhỏ cấp bậc càng cao.
 */
export function getCommissionRate(rank: UserRank): number {
  // CTV (rank 8) gets 21%
  if (rank === UserRank.CTV) {
    return 0.21;
  }
  // All other ranks (1-7) get 25%
  return 0.25;
}

/**
 * Tính toán số tiền hoa hồng
 */
export function calculateCommission(bonusRevenue: number, rank: UserRank): number {
  const rate = getCommissionRate(rank);
  return bonusRevenue * rate;
}
