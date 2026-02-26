import { UserRank } from '@/types';

// ============================================================================
// COMMISSION CALCULATIONS
// ============================================================================

export interface CommissionResult {
  saleAmount: number;
  bonusRevenue: number;
  commissionRate: number;
  commissionAmount: number;
}

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
 * Get commission rate by rank ID (alias for getCommissionRate with number input support)
 * Higher ranks get higher commission rates in some contexts, but default logic applies here.
 */
export function getCommissionRateByRank(rankId: number): number {
  // Rank commission structure
  const rates: Record<number, number> = {
      1: 0.30, // THIEN_LONG
      2: 0.28, // PHUONG_HOANG
      3: 0.27, // DAI_SU_DIAMOND
      4: 0.26, // DAI_SU_GOLD
      5: 0.25, // DAI_SU_SILVER
      6: 0.25, // DAI_SU
      7: 0.25, // KHOI_NGHIEP
      8: 0.21, // CTV
  };

  return rates[rankId] ?? 0.21;
}

/**
 * Simple commission calculation based on bonus revenue and rank
 * (Renamed from calculateCommission to avoid conflict)
 */
export function calculateSimpleCommission(bonusRevenue: number, rank: UserRank): number {
  const rate = getCommissionRate(rank);
  return bonusRevenue * rate;
}

/**
 * Calculate commission based on bonus revenue and rank (Robust version)
 * @param saleAmount - Total sale amount
 * @param bonusRevenue - Bonus revenue (DTTT) for commission calculation
 * @param rankCommissionRate - Commission rate based on user rank
 */
export function calculateCommission(
  saleAmount: number,
  bonusRevenue: number,
  rankCommissionRate: number
): CommissionResult {
  const commissionAmount = bonusRevenue * rankCommissionRate;

  return {
      saleAmount,
      bonusRevenue,
      commissionRate: rankCommissionRate,
      commissionAmount
  };
}
