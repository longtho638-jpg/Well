/**
 * AGI Commerce Tools — Concrete tool implementations for commerce domain.
 *
 * Provides typed tool functions consumed by the AGI Commerce Orchestrator.
 * Each tool wraps existing service logic with structured input/output.
 * Stub implementations — will be wired to real Supabase services.
 */

import { z } from 'zod';
import type {
  ProductSearchResult,
  OrderResult,
  CommissionResult,
  DistributorRankResult,
} from './agi-tool-registry';

// ─── Health Recommendation Result ────────────────────────────

export interface HealthRecommendationResult {
  recommendations: Array<{
    productId: string;
    productName: string;
    relevance: number;
    healthBenefit: string;
  }>;
  disclaimer: string;
}

// ─── Input Schemas ───────────────────────────────────────────

export const SearchProductsSchema = z.object({
  query: z.string().describe('Search keyword or product name'),
  category: z.string().optional().describe('Product category filter'),
  maxPrice: z.number().optional().describe('Maximum price filter (VND)'),
  limit: z.number().optional().default(10).describe('Max results'),
});

export const CreateOrderSchema = z.object({
  distributorId: z.string().describe('Distributor placing the order'),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  })).min(1).describe('Order line items'),
  customerId: z.string().optional().describe('End customer if applicable'),
});

export const CheckRankSchema = z.object({
  distributorId: z.string().describe('Distributor to check'),
});

export const CalculateCommissionSchema = z.object({
  distributorId: z.string().describe('Distributor earning commission'),
  orderId: z.string().describe('Order to calculate commission for'),
  orderAmount: z.number().describe('Total order amount in VND'),
});

export const HealthRecommendationSchema = z.object({
  concern: z.string().describe('Health concern or goal (e.g., "gut health", "immunity")'),
  budget: z.number().optional().describe('Budget limit in VND'),
});

// ─── Tool Implementations ────────────────────────────────────

export async function searchProducts(
  input: z.infer<typeof SearchProductsSchema>,
): Promise<ProductSearchResult> {
  // Stub — replace with Supabase query
  const products = [
    { id: 'prod-001', name: 'Well Alkaline Filter', price: 4500000, stock: 50 },
    { id: 'prod-002', name: 'Well Mineral Boost', price: 180000, stock: 200 },
    { id: 'prod-003', name: 'Well Hydrogen Generator', price: 12000000, stock: 15 },
  ];

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(input.query.toLowerCase()))
    .filter((p) => !input.maxPrice || p.price <= input.maxPrice)
    .slice(0, input.limit ?? 10);

  return { products: filtered, total: filtered.length };
}

export async function createOrder(
  input: z.infer<typeof CreateOrderSchema>,
): Promise<OrderResult> {
  // Stub — replace with real order service call
  const unitPrice = 4500000;
  const totalAmount = input.items.reduce((sum, item) => sum + unitPrice * item.quantity, 0);

  return {
    orderId: `ord-${Date.now()}`,
    status: totalAmount > 50000000 ? 'pending' : 'confirmed',
    totalAmount,
    estimatedCommission: totalAmount * 0.15,
  };
}

export async function checkDistributorRank(
  input: z.infer<typeof CheckRankSchema>,
): Promise<DistributorRankResult> {
  // Stub — replace with Supabase user lookup
  return {
    distributorId: input.distributorId,
    currentRank: 'Silver',
    nextRank: 'Gold',
    pointsToNextRank: 1500,
    totalPoints: 8500,
  };
}

export async function calculateCommission(
  input: z.infer<typeof CalculateCommissionSchema>,
): Promise<CommissionResult> {
  // Stub — replace with real commission engine (Bee 2.0)
  const rate = 0.15;
  return {
    distributorId: input.distributorId,
    orderId: input.orderId,
    amount: Math.round(input.orderAmount * rate),
    rate,
    tier: 'Silver',
  };
}

export async function getHealthRecommendation(
  input: z.infer<typeof HealthRecommendationSchema>,
): Promise<HealthRecommendationResult> {
  // Stub — replace with RAG over verified health claims
  return {
    recommendations: [
      {
        productId: 'prod-001',
        productName: 'Well Alkaline Filter',
        relevance: 0.92,
        healthBenefit: `Supports ${input.concern} through alkaline water filtration`,
      },
      {
        productId: 'prod-002',
        productName: 'Well Mineral Boost',
        relevance: 0.78,
        healthBenefit: `Essential minerals support overall ${input.concern}`,
      },
    ],
    disclaimer: 'These are product suggestions, not medical advice. Consult a healthcare professional.',
  };
}
