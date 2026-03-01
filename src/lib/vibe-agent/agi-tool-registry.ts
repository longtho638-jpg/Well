/**
 * AGI Tool Registry — Typed commerce tools for ReAct agent loop.
 *
 * Uses Vercel AI SDK v6 tool() with inputSchema (v6 API).
 * Execute functions return typed stub data (real API integration later).
 */

import { tool } from 'ai';
import { z } from 'zod';

// ─── Tool Result Types ───────────────────────────────────────

export interface ProductSearchResult {
  products: Array<{ id: string; name: string; price: number; stock: number }>;
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

// ─── Tool Definitions (AI SDK v6 — inputSchema) ─────────────

const searchProducts = tool({
  description: 'Search for products in the Well distributor catalog by keyword or category.',
  inputSchema: z.object({
    query: z.string().describe('Search keyword or product name'),
    category: z.string().optional().describe('Product category filter'),
    limit: z.number().optional().default(10).describe('Max results to return'),
  }),
  execute: async (input) => {
    const result: ProductSearchResult = {
      products: [
        { id: `prod-${Date.now()}-1`, name: `${input.query} Product A`, price: 250000, stock: 50 },
        { id: `prod-${Date.now()}-2`, name: `${input.query} Product B`, price: 180000, stock: 30 },
      ].slice(0, input.limit ?? 10),
      total: 2,
    };
    return result;
  },
});

const getProductDetails = tool({
  description: 'Get detailed information about a specific product including commission rates.',
  inputSchema: z.object({
    productId: z.string().describe('The product ID to fetch details for'),
  }),
  execute: async (input) => {
    const result: ProductDetailResult = {
      id: input.productId,
      name: 'Well Premium Water Filter',
      description: 'Advanced 7-stage filtration system',
      price: 4500000,
      commissionRate: 0.15,
      stock: 12,
    };
    return result;
  },
});

const createOrder = tool({
  description: 'Create a new order for a distributor with specified products and quantities.',
  inputSchema: z.object({
    distributorId: z.string().describe('The distributor placing the order'),
    productId: z.string().describe('Product ID to order'),
    quantity: z.number().min(1).describe('Number of units to order'),
    customerId: z.string().optional().describe('End customer ID if applicable'),
  }),
  execute: async (input) => {
    const totalAmount = 4500000 * input.quantity;
    const result: OrderResult = {
      orderId: `ord-${Date.now()}`,
      status: 'confirmed',
      totalAmount,
      estimatedCommission: totalAmount * 0.15,
    };
    return result;
  },
});

const calculateCommission = tool({
  description: 'Calculate commission for a distributor on a specific order.',
  inputSchema: z.object({
    distributorId: z.string().describe('The distributor ID'),
    orderId: z.string().describe('The order ID to calculate commission for'),
  }),
  execute: async (input) => {
    const result: CommissionResult = {
      distributorId: input.distributorId,
      orderId: input.orderId,
      amount: 675000,
      rate: 0.15,
      tier: 'Silver',
    };
    return result;
  },
});

const checkDistributorRank = tool({
  description: 'Check the current rank and points of a distributor in the Well network.',
  inputSchema: z.object({
    distributorId: z.string().describe('The distributor ID to check'),
  }),
  execute: async (input) => {
    const result: DistributorRankResult = {
      distributorId: input.distributorId,
      currentRank: 'Silver',
      nextRank: 'Gold',
      pointsToNextRank: 1500,
      totalPoints: 8500,
    };
    return result;
  },
});

// ─── Registry Singleton ──────────────────────────────────────

export const agiToolRegistry = {
  searchProducts,
  getProductDetails,
  createOrder,
  calculateCommission,
  checkDistributorRank,
};

export type AGIToolRegistry = typeof agiToolRegistry;
