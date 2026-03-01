/**
 * AGI Model Tier Router — Selects optimal model tier based on task complexity.
 *
 * Tiers: fast (flash-lite) → balanced (flash) → powerful (pro)
 * Auto-selects based on conversation length, tool count, and task signals.
 * Extends the existing LiteLLM-pattern router with tiered cost-aware selection.
 */

// ─── Types ───────────────────────────────────────────────────

export type ModelTier = 'fast' | 'balanced' | 'powerful';

export interface TierContext {
  /** Number of messages in conversation history */
  messageCount?: number;
  /** Number of tools being made available */
  toolCount?: number;
  /** Whether complex multi-step reasoning is needed */
  requiresReasoning?: boolean;
  /** Explicit tier override */
  forceTier?: ModelTier;
}

export interface TierSelection {
  tier: ModelTier;
  modelName: string;
  reason: string;
}

// ─── Model Map ───────────────────────────────────────────────

const TIER_MODELS: Record<ModelTier, string> = {
  fast: 'models/gemini-2.0-flash-lite',
  balanced: 'models/gemini-2.0-flash',
  powerful: 'models/gemini-2.0-pro',
};

// ─── Thresholds ──────────────────────────────────────────────

const THRESHOLDS = {
  /** Message count above which we upgrade from fast → balanced */
  messageCountForBalanced: 3,
  /** Message count above which we upgrade from balanced → powerful */
  messageCountForPowerful: 8,
  /** Tool count above which we prefer balanced or powerful */
  toolCountForBalanced: 2,
  /** Tool count above which we prefer powerful */
  toolCountForPowerful: 4,
} as const;

// ─── Selector ────────────────────────────────────────────────

/**
 * Select the appropriate model tier based on task context.
 * Returns model name string compatible with getVibeModel().
 */
export function selectModelTier(context: TierContext = {}): TierSelection {
  const {
    messageCount = 0,
    toolCount = 0,
    requiresReasoning = false,
    forceTier,
  } = context;

  // Explicit override always wins
  if (forceTier) {
    return {
      tier: forceTier,
      modelName: TIER_MODELS[forceTier],
      reason: 'Explicit tier override',
    };
  }

  // Complex reasoning always uses powerful
  if (requiresReasoning) {
    return {
      tier: 'powerful',
      modelName: TIER_MODELS.powerful,
      reason: 'Complex reasoning required',
    };
  }

  // Upgrade to powerful for long conversations or many tools
  if (
    messageCount >= THRESHOLDS.messageCountForPowerful ||
    toolCount >= THRESHOLDS.toolCountForPowerful
  ) {
    return {
      tier: 'powerful',
      modelName: TIER_MODELS.powerful,
      reason: `High complexity: ${messageCount} messages, ${toolCount} tools`,
    };
  }

  // Upgrade to balanced for medium conversations or moderate tool use
  if (
    messageCount >= THRESHOLDS.messageCountForBalanced ||
    toolCount >= THRESHOLDS.toolCountForBalanced
  ) {
    return {
      tier: 'balanced',
      modelName: TIER_MODELS.balanced,
      reason: `Medium complexity: ${messageCount} messages, ${toolCount} tools`,
    };
  }

  // Default: fast for simple/short interactions
  return {
    tier: 'fast',
    modelName: TIER_MODELS.fast,
    reason: 'Short conversation, minimal tools',
  };
}

/**
 * Get just the model name string for a given tier context.
 * Convenience wrapper for use in streamText/generateText calls.
 */
export function getModelNameForTier(context: TierContext = {}): string {
  return selectModelTier(context).modelName;
}

export { TIER_MODELS };
