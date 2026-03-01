/**
 * Tests for AGI Core Engine — Tool Registry + Model Tier Router.
 * Validates: tool definitions structure, tier selection logic.
 */
import { describe, it, expect } from 'vitest';
import {
  agiToolRegistry,
  selectModelTier,
  getModelNameForTier,
  TIER_MODELS,
  type TierContext,
} from '../lib/vibe-agent/index';

// ─── AGI Tool Registry ──────────────────────────────────────

describe('AGI Tool Registry', () => {
  it('should export 5 commerce tools', () => {
    const toolNames = Object.keys(agiToolRegistry);
    expect(toolNames).toHaveLength(5);
    expect(toolNames).toContain('searchProducts');
    expect(toolNames).toContain('getProductDetails');
    expect(toolNames).toContain('createOrder');
    expect(toolNames).toContain('calculateCommission');
    expect(toolNames).toContain('checkDistributorRank');
  });

  it('each tool should have description and execute function', () => {
    for (const [name, toolDef] of Object.entries(agiToolRegistry)) {
      expect(toolDef, `${name} should exist`).toBeTruthy();
      expect(typeof (toolDef as Record<string, unknown>).description).toBe('string');
      expect(typeof (toolDef as Record<string, unknown>).execute).toBe('function');
    }
  });

  it('each tool should have inputSchema (Zod schema)', () => {
    for (const [name, toolDef] of Object.entries(agiToolRegistry)) {
      const def = toolDef as Record<string, unknown>;
      expect(def.inputSchema ?? def.parameters, `${name} should have schema`).toBeTruthy();
    }
  });

  it('registry should be usable as ToolSet for streamText', () => {
    // ToolSet is Record<string, Tool> — verify shape
    expect(typeof agiToolRegistry).toBe('object');
    expect(agiToolRegistry).not.toBeNull();
    expect(Object.keys(agiToolRegistry).length).toBeGreaterThan(0);
  });
});

// ─── AGI Model Tier Router ──────────────────────────────────

describe('AGI Model Tier Router', () => {
  it('should default to fast tier for empty context', () => {
    const selection = selectModelTier();
    expect(selection.tier).toBe('fast');
    expect(selection.modelName).toBe(TIER_MODELS.fast);
  });

  it('should select balanced for medium message count', () => {
    const ctx: TierContext = { messageCount: 4 };
    const selection = selectModelTier(ctx);
    expect(selection.tier).toBe('balanced');
  });

  it('should select powerful for high message count', () => {
    const ctx: TierContext = { messageCount: 10 };
    const selection = selectModelTier(ctx);
    expect(selection.tier).toBe('powerful');
  });

  it('should select powerful when requiresReasoning is true', () => {
    const ctx: TierContext = { requiresReasoning: true };
    const selection = selectModelTier(ctx);
    expect(selection.tier).toBe('powerful');
    expect(selection.reason).toContain('reasoning');
  });

  it('should respect forceTier override', () => {
    const ctx: TierContext = { messageCount: 100, forceTier: 'fast' };
    const selection = selectModelTier(ctx);
    expect(selection.tier).toBe('fast');
    expect(selection.reason).toContain('override');
  });

  it('should select balanced for moderate tool count', () => {
    const ctx: TierContext = { toolCount: 3 };
    const selection = selectModelTier(ctx);
    expect(selection.tier).toBe('balanced');
  });

  it('should select powerful for high tool count', () => {
    const ctx: TierContext = { toolCount: 5 };
    const selection = selectModelTier(ctx);
    expect(selection.tier).toBe('powerful');
  });

  it('getModelNameForTier should return string model name', () => {
    const name = getModelNameForTier({ forceTier: 'balanced' });
    expect(typeof name).toBe('string');
    expect(name).toBe(TIER_MODELS.balanced);
  });

  it('TIER_MODELS should have all 3 tiers', () => {
    expect(TIER_MODELS).toHaveProperty('fast');
    expect(TIER_MODELS).toHaveProperty('balanced');
    expect(TIER_MODELS).toHaveProperty('powerful');
  });
});
