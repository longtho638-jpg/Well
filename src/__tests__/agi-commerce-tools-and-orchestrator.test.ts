/**
 * Tests for AGI Commerce Tools + Commerce Orchestrator.
 * Validates: tool implementations, schema validation, orchestrator status lifecycle.
 */
import { describe, it, expect } from 'vitest';
import {
  searchProducts,
  createOrder,
  checkDistributorRank,
  calculateCommission,
  getHealthRecommendation,
  SearchProductsSchema,
  CreateOrderSchema,
  CheckRankSchema,
  CalculateCommissionSchema,
  HealthRecommendationSchema,
  commerceOrchestrator,
} from '../lib/vibe-agent/index';

// ─── Commerce Tool Implementations ──────────────────────────

describe('AGI Commerce Tools', () => {
  describe('searchProducts', () => {
    it('should return matching products for query', async () => {
      const result = await searchProducts({ query: 'Alkaline', limit: 10 });
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('total');
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.products[0].name.toLowerCase()).toContain('alkaline');
    });

    it('should respect maxPrice filter', async () => {
      const result = await searchProducts({ query: 'Well', maxPrice: 200000, limit: 10 });
      for (const p of result.products) {
        expect(p.price).toBeLessThanOrEqual(200000);
      }
    });

    it('should respect limit parameter', async () => {
      const result = await searchProducts({ query: 'Well', limit: 1 });
      expect(result.products.length).toBeLessThanOrEqual(1);
    });

    it('should return empty for non-matching query', async () => {
      const result = await searchProducts({ query: 'xyznonexistent', limit: 10 });
      expect(result.products).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('createOrder', () => {
    it('should create confirmed order for normal value', async () => {
      const result = await createOrder({
        distributorId: 'd-001',
        items: [{ productId: 'prod-001', quantity: 1 }],
      });
      expect(result.status).toBe('confirmed');
      expect(result.orderId).toMatch(/^ord-/);
      expect(result.totalAmount).toBeGreaterThan(0);
      expect(result.estimatedCommission).toBeGreaterThan(0);
    });

    it('should return pending for high-value orders', async () => {
      const result = await createOrder({
        distributorId: 'd-001',
        items: [{ productId: 'prod-001', quantity: 100 }],
      });
      expect(result.status).toBe('pending');
      expect(result.totalAmount).toBeGreaterThan(50000000);
    });

    it('should calculate correct total for multiple items', async () => {
      const result = await createOrder({
        distributorId: 'd-001',
        items: [
          { productId: 'prod-001', quantity: 2 },
          { productId: 'prod-002', quantity: 3 },
        ],
      });
      expect(result.totalAmount).toBeGreaterThan(0);
    });
  });

  describe('checkDistributorRank', () => {
    it('should return rank with progression fields', async () => {
      const result = await checkDistributorRank({ distributorId: 'd-001' });
      expect(result.distributorId).toBe('d-001');
      expect(result.currentRank).toBeTruthy();
      expect(result.totalPoints).toBeGreaterThan(0);
      expect(typeof result.pointsToNextRank).toBe('number');
    });
  });

  describe('calculateCommission', () => {
    it('should calculate commission with correct rate', async () => {
      const result = await calculateCommission({
        distributorId: 'd-001',
        orderId: 'ord-001',
        orderAmount: 10000000,
      });
      expect(result.distributorId).toBe('d-001');
      expect(result.orderId).toBe('ord-001');
      expect(result.amount).toBe(1500000); // 10M * 0.15
      expect(result.rate).toBe(0.15);
    });
  });

  describe('getHealthRecommendation', () => {
    it('should return recommendations with disclaimer', async () => {
      const result = await getHealthRecommendation({ concern: 'gut health' });
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.disclaimer).toContain('not medical advice');
      expect(result.recommendations[0]).toHaveProperty('productId');
      expect(result.recommendations[0]).toHaveProperty('relevance');
      expect(result.recommendations[0].healthBenefit).toContain('gut health');
    });

    it('should include concern in health benefit text', async () => {
      const result = await getHealthRecommendation({ concern: 'immunity' });
      expect(result.recommendations[0].healthBenefit).toContain('immunity');
    });
  });
});

// ─── Zod Schema Validation ──────────────────────────────────

describe('AGI Commerce Schemas', () => {
  it('SearchProductsSchema should validate correct input', () => {
    const result = SearchProductsSchema.safeParse({ query: 'water filter' });
    expect(result.success).toBe(true);
  });

  it('SearchProductsSchema should reject empty query', () => {
    const result = SearchProductsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('CreateOrderSchema should require at least 1 item', () => {
    const result = CreateOrderSchema.safeParse({
      distributorId: 'd-001',
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('CreateOrderSchema should validate correct order', () => {
    const result = CreateOrderSchema.safeParse({
      distributorId: 'd-001',
      items: [{ productId: 'prod-001', quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });

  it('CalculateCommissionSchema should require orderAmount', () => {
    const result = CalculateCommissionSchema.safeParse({
      distributorId: 'd-001',
      orderId: 'ord-001',
    });
    expect(result.success).toBe(false);
  });

  it('CheckRankSchema should require distributorId', () => {
    const valid = CheckRankSchema.safeParse({ distributorId: 'd-001' });
    const invalid = CheckRankSchema.safeParse({});
    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it('HealthRecommendationSchema should accept optional budget', () => {
    const withBudget = HealthRecommendationSchema.safeParse({ concern: 'sleep', budget: 5000000 });
    const withoutBudget = HealthRecommendationSchema.safeParse({ concern: 'sleep' });
    expect(withBudget.success).toBe(true);
    expect(withoutBudget.success).toBe(true);
  });
});

// ─── Commerce Orchestrator ──────────────────────────────────

describe('AGI Commerce Orchestrator', () => {
  it('should expose getStatus method returning OrchestratorStatus', () => {
    const status = commerceOrchestrator.getStatus();
    expect(['idle', 'planning', 'executing', 'awaiting_approval', 'completed', 'failed']).toContain(status);
  });

  it('should start in idle state', () => {
    expect(commerceOrchestrator.getStatus()).toBe('idle');
  });

  it('should return null for getLastTrace before any execution', () => {
    expect(commerceOrchestrator.getLastTrace()).toBeNull();
  });
});
