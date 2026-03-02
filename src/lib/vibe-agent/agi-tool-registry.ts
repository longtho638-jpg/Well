/**
 * AGI Tool Registry — Typed commerce tools for ReAct agent loop.
 *
 * Uses Vercel AI SDK v6 tool() with inputSchema (v6 API).
 * Execute functions query real Supabase data via existing services.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { getNextRank } from './agi-tool-registry-types-and-rank-helpers';
import type { ProductSearchResult, ProductDetailResult, OrderResult, CommissionResult, DistributorRankResult } from './agi-tool-registry-types-and-rank-helpers';

export type { ProductSearchResult, ProductDetailResult, OrderResult, CommissionResult, DistributorRankResult };

// ─── Tool Definitions (AI SDK v6 — inputSchema) ─────────────

const searchProducts = tool({
  description: 'Search for products in the Well distributor catalog by keyword or category.',
  inputSchema: z.object({
    query: z.string().describe('Search keyword or product name'),
    category: z.string().optional().describe('Product category filter'),
    limit: z.number().optional().default(10).describe('Max results to return'),
  }),
  execute: async (input): Promise<ProductSearchResult> => {
    let query = supabase.from('products').select('id, name, price, stock, category').eq('is_active', true);
    if (input.query) query = query.ilike('name', `%${input.query}%`);
    if (input.category) query = query.ilike('category', `%${input.category}%`);
    const { data, error } = await query.limit(input.limit ?? 10);
    if (error) throw new Error(`Product search failed: ${error.message}`);
    return {
      products: (data ?? []).map(p => ({
        id: p.id as string, name: p.name as string,
        price: (p.price as number) ?? 0, stock: (p.stock as number) ?? 0,
        category: (p.category as string) ?? 'uncategorized',
      })),
      total: data?.length ?? 0,
    };
  },
});

const getProductDetails = tool({
  description: 'Get detailed information about a specific product including commission rates.',
  inputSchema: z.object({ productId: z.string().describe('The product ID to fetch details for') }),
  execute: async (input): Promise<ProductDetailResult> => {
    const { data, error } = await supabase.from('products')
      .select('id, name, description, price, commission_rate, stock').eq('id', input.productId).single();
    if (error) throw new Error(`Product not found: ${error.message}`);
    return {
      id: data.id as string, name: data.name as string,
      description: (data.description as string) ?? '', price: (data.price as number) ?? 0,
      commissionRate: (data.commission_rate as number) ?? 0.15, stock: (data.stock as number) ?? 0,
    };
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
  execute: async (input): Promise<OrderResult> => {
    const { data: product, error: pe } = await supabase.from('products')
      .select('price, commission_rate, stock').eq('id', input.productId).single();
    if (pe) throw new Error(`Product not found: ${pe.message}`);
    if ((product.stock as number) < input.quantity) throw new Error('Insufficient stock');

    const totalAmount = (product.price as number) * input.quantity;
    const commRate = (product.commission_rate as number) ?? 0.15;

    const { data: order, error: oe } = await supabase.from('orders').insert({
      user_id: input.distributorId, product_id: input.productId,
      quantity: input.quantity, total_amount: totalAmount,
      status: 'pending', customer_id: input.customerId ?? null,
    }).select('id').single();
    if (oe) throw new Error(`Order creation failed: ${oe.message}`);

    return { orderId: order.id as string, status: 'pending', totalAmount, estimatedCommission: totalAmount * commRate };
  },
});

const calculateCommission = tool({
  description: 'Calculate commission for a distributor on a specific order.',
  inputSchema: z.object({
    distributorId: z.string().describe('The distributor ID'),
    orderId: z.string().describe('The order ID to calculate commission for'),
  }),
  execute: async (input): Promise<CommissionResult> => {
    const { data: order, error: oe } = await supabase.from('orders')
      .select('total_amount, product_id').eq('id', input.orderId).single();
    if (oe) throw new Error(`Order not found: ${oe.message}`);

    const { data: product } = await supabase.from('products')
      .select('commission_rate').eq('id', order.product_id).single();
    const rate = (product?.commission_rate as number) ?? 0.15;

    const { data: user } = await supabase.from('users')
      .select('rank').eq('id', input.distributorId).single();

    return {
      distributorId: input.distributorId, orderId: input.orderId,
      amount: (order.total_amount as number) * rate, rate,
      tier: (user?.rank as string) ?? 'Member',
    };
  },
});

const checkDistributorRank = tool({
  description: 'Check the current rank and points of a distributor in the Well network.',
  inputSchema: z.object({ distributorId: z.string().describe('The distributor ID to check') }),
  execute: async (input): Promise<DistributorRankResult> => {
    const { data, error } = await supabase.from('users')
      .select('rank, total_sales').eq('id', input.distributorId).single();
    if (error) throw new Error(`Distributor not found: ${error.message}`);

    const currentRank = (data.rank as string) ?? 'Member';
    const totalPoints = (data.total_sales as number) ?? 0;
    const { next, pointsNeeded } = getNextRank(currentRank);

    return {
      distributorId: input.distributorId, currentRank, nextRank: next,
      pointsToNextRank: Math.max(0, pointsNeeded - totalPoints), totalPoints,
    };
  },
});

// ─── Registry Singleton ──────────────────────────────────────

export const agiToolRegistry = {
  searchProducts, getProductDetails, createOrder, calculateCommission, checkDistributorRank,
};

export type AGIToolRegistry = typeof agiToolRegistry;
