/**
 * AGI Tool Registry Types & Rank Helpers
 * Shared types for commerce tools + distributor rank progression logic.
 */

// ─── Tool Result Types ───────────────────────────────────────

export interface ProductSearchResult {
  products: Array<{ id: string; name: string; price: number; stock: number; category: string }>;
  total: number;
}

export interface ProductDetailResult {
  id: string;
  name: string;
  description: string;
  price: number;
  commissionRate: number;
  stock: number;
}

export interface OrderResult {
  orderId: string;
  status: 'pending' | 'confirmed' | 'failed';
  totalAmount: number;
  estimatedCommission: number;
}

export interface CommissionResult {
  distributorId: string;
  orderId: string;
  amount: number;
  rate: number;
  tier: string;
}

export interface DistributorRankResult {
  distributorId: string;
  currentRank: string;
  nextRank: string | null;
  pointsToNextRank: number;
  totalPoints: number;
}

// ─── Rank Progression ────────────────────────────────────────

const RANK_ORDER = ['Member', 'Silver', 'Gold', 'Diamond', 'Crown', 'Founder'];
const RANK_THRESHOLDS: Record<string, number> = {
  Member: 0, Silver: 5000, Gold: 15000, Diamond: 50000, Crown: 150000, Founder: 500000,
};

export function getNextRank(current: string): { next: string | null; pointsNeeded: number } {
  const idx = RANK_ORDER.indexOf(current);
  if (idx < 0 || idx >= RANK_ORDER.length - 1) return { next: null, pointsNeeded: 0 };
  const next = RANK_ORDER[idx + 1];
  return { next, pointsNeeded: RANK_THRESHOLDS[next] ?? 0 };
}
