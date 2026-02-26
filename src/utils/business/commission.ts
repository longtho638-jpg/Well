import { UserRank } from '@/types';

/**
 * Tính toán tỷ lệ hoa hồng dựa trên cấp bậc (Rank)
 * THIEN_LONG (1) -> DAI_SU (6): Top ranks (21%)
 * KHOI_NGHIEP (7): Entry level (25%)
 * CTV (8): Entry level (25%)
 * Note: Rank value càng nhỏ cấp bậc càng cao.
 */
export function getCommissionRate(rank: UserRank): number {
  // Cấp bậc khởi nghiệp (7) và CTV (8) nhận 25%
  if (rank >= UserRank.KHOI_NGHIEP) {
    return 0.25;
  }

  // Các cấp bậc cao hơn nhận 21%
  return 0.21;
}

/**
 * Tính toán số tiền hoa hồng
 */
export function calculateCommission(bonusRevenue: number, rank: UserRank): number {
  const rate = getCommissionRate(rank);
  return bonusRevenue * rate;
}
