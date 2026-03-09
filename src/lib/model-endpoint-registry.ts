/**
 * AI Model Endpoint Registry - Phase 6
 *
 * Defines and categorizes AI model API endpoints that require license + quota validation.
 * Used by RaaS Gateway to intercept and validate requests before forwarding to upstream.
 *
 * Features:
 * - Endpoint pattern matching for major AI providers
 * - Tier-based access control (Free/Pro/Enterprise)
 * - Model categorization (basic/premium/enterprise)
 *
 * Usage:
 *   import { modelEndpointRegistry, isProtectedEndpoint } from '@/lib/model-endpoint-registry'
 *
 *   if (isProtectedEndpoint(url.pathname)) {
 *     // Validate license + quota
 *   }
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * License tier levels
 */
export type LicenseTier = 'free' | 'basic' | 'pro' | 'enterprise' | 'master'

/**
 * AI Provider identification
 */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'local' | 'custom'

/**
 * Model category for tier-based access control
 */
export type ModelCategory = 'basic' | 'premium' | 'enterprise'

/**
 * Protected endpoint definition
 */
export interface ProtectedEndpoint {
  /** Unique identifier for this endpoint */
  id: string
  /** Provider name */
  provider: AIProvider
  /** URL path pattern (supports wildcards) */
  pattern: string
  /** Regex for matching */
  regex: RegExp
  /** Model category required to access */
  category: ModelCategory
  /** Rate limit multiplier for this endpoint */
  rateLimitMultiplier: number
  /** Whether to count tokens for quota */
  countTokens: boolean
}

/**
 * Model access rules per tier
 */
export interface TierModelAccess {
  /** Tier this rule applies to */
  tier: LicenseTier
  /** Allowed model categories */
  allowedCategories: ModelCategory[]
  /** Rate limit (requests per minute) */
  rateLimit: number
  /** Monthly token quota */
  monthlyTokenQuota: number
  /** Whether overage is allowed */
  overageAllowed: boolean
}

// ============================================================================
// ENDPOINT REGISTRY
// ============================================================================

/**
 * All protected AI model endpoints
 */
export const PROTECTED_ENDPOINTS: ProtectedEndpoint[] = [
  // OpenAI endpoints
  {
    id: 'openai-chat-completions',
    provider: 'openai',
    pattern: '/v1/chat/completions',
    regex: /^\/v1\/chat\/completions$/,
    category: 'basic',
    rateLimitMultiplier: 1,
    countTokens: true,
  },
  {
    id: 'openai-completions',
    provider: 'openai',
    pattern: '/v1/completions',
    regex: /^\/v1\/completions$/,
    category: 'basic',
    rateLimitMultiplier: 1,
    countTokens: true,
  },
  {
    id: 'openai-embeddings',
    provider: 'openai',
    pattern: '/v1/embeddings',
    regex: /^\/v1\/embeddings$/,
    category: 'basic',
    rateLimitMultiplier: 0.5,
    countTokens: true,
  },
  {
    id: 'openai-images',
    provider: 'openai',
    pattern: '/v1/images/generations',
    regex: /^\/v1\/images\/generations$/,
    category: 'premium',
    rateLimitMultiplier: 2,
    countTokens: false,
  },

  // Anthropic endpoints
  {
    id: 'anthropic-messages',
    provider: 'anthropic',
    pattern: '/v1/messages',
    regex: /^\/v1\/messages$/,
    category: 'basic',
    rateLimitMultiplier: 1,
    countTokens: true,
  },
  {
    id: 'anthropic-completions',
    provider: 'anthropic',
    pattern: '/v1/complete',
    regex: /^\/v1\/complete$/,
    category: 'basic',
    rateLimitMultiplier: 1,
    countTokens: true,
  },

  // Google AI endpoints
  {
    id: 'google-generate-content',
    provider: 'google',
    pattern: '/v1beta/models/*/generateContent',
    regex: /^\/v1beta\/models\/[^/]+\/generateContent$/,
    category: 'basic',
    rateLimitMultiplier: 1,
    countTokens: true,
  },
  {
    id: 'google-count-tokens',
    provider: 'google',
    pattern: '/v1beta/models/*/countTokens',
    regex: /^\/v1beta\/models\/[^/]+\/countTokens$/,
    category: 'basic',
    rateLimitMultiplier: 0.1,
    countTokens: false,
  },

  // Local AI endpoints
  {
    id: 'local-inference',
    provider: 'local',
    pattern: '/api/inference/*',
    regex: /^\/api\/inference\/.*$/,
    category: 'basic',
    rateLimitMultiplier: 0.5,
    countTokens: true,
  },
  {
    id: 'local-inference-chat',
    provider: 'local',
    pattern: '/api/inference/chat',
    regex: /^\/api\/inference\/chat$/,
    category: 'basic',
    rateLimitMultiplier: 1,
    countTokens: true,
  },
  {
    id: 'local-inference-complete',
    provider: 'local',
    pattern: '/api/inference/complete',
    regex: /^\/api\/inference\/complete$/,
    category: 'basic',
    rateLimitMultiplier: 1,
    countTokens: true,
  },
]

// ============================================================================
// TIER ACCESS RULES
// ============================================================================

/**
 * Model access rules per license tier
 */
export const TIER_ACCESS_RULES: Record<LicenseTier, TierModelAccess> = {
  free: {
    tier: 'free',
    allowedCategories: ['basic'],
    rateLimit: 10,
    monthlyTokenQuota: 10_000,
    overageAllowed: false,
  },
  basic: {
    tier: 'basic',
    allowedCategories: ['basic'],
    rateLimit: 60,
    monthlyTokenQuota: 100_000,
    overageAllowed: false,
  },
  pro: {
    tier: 'pro',
    allowedCategories: ['basic', 'premium'],
    rateLimit: 300,
    monthlyTokenQuota: 1_000_000,
    overageAllowed: true,
  },
  enterprise: {
    tier: 'enterprise',
    allowedCategories: ['basic', 'premium', 'enterprise'],
    rateLimit: 1000,
    monthlyTokenQuota: 10_000_000,
    overageAllowed: true,
  },
  master: {
    tier: 'master',
    allowedCategories: ['basic', 'premium', 'enterprise'],
    rateLimit: 5000,
    monthlyTokenQuota: 100_000_000,
    overageAllowed: true,
  },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a URL path matches a protected endpoint
 *
 * @param pathname - URL pathname to check
 * @returns Matching ProtectedEndpoint or null
 */
export function matchProtectedEndpoint(pathname: string): ProtectedEndpoint | null {
  for (const endpoint of PROTECTED_ENDPOINTS) {
    if (endpoint.regex.test(pathname)) {
      return endpoint
    }
  }
  return null
}

/**
 * Check if a URL path is a protected AI model endpoint
 *
 * @param pathname - URL pathname to check
 * @returns true if protected
 */
export function isProtectedEndpoint(pathname: string): boolean {
  return matchProtectedEndpoint(pathname) !== null
}

/**
 * Get the provider for a URL path
 *
 * @param pathname - URL pathname to check
 * @returns Provider name or null
 */
export function getProviderForEndpoint(pathname: string): AIProvider | null {
  const endpoint = matchProtectedEndpoint(pathname)
  return endpoint?.provider || null
}

/**
 * Check if a license tier can access a model category
 *
 * @param tier - License tier
 * @param category - Model category
 * @returns true if allowed
 */
export function canAccessModelCategory(
  tier: LicenseTier,
  category: ModelCategory
): boolean {
  const rules = TIER_ACCESS_RULES[tier]
  if (!rules) return false

  return rules.allowedCategories.includes(category)
}

/**
 * Get rate limit for a license tier
 *
 * @param tier - License tier
 * @returns Rate limit (requests per minute)
 */
export function getRateLimitForTier(tier: LicenseTier): number {
  return TIER_ACCESS_RULES[tier]?.rateLimit || 0
}

/**
 * Get monthly token quota for a license tier
 *
 * @param tier - License tier
 * @returns Monthly token quota
 */
export function getTokenQuotaForTier(tier: LicenseTier): number {
  return TIER_ACCESS_RULES[tier]?.monthlyTokenQuota || 0
}

/**
 * Check if overage is allowed for a license tier
 *
 * @param tier - License tier
 * @returns true if overage allowed
 */
export function isOverageAllowed(tier: LicenseTier): boolean {
  return TIER_ACCESS_RULES[tier]?.overageAllowed || false
}

/**
 * Get all endpoints for a specific provider
 *
 * @param provider - Provider name
 * @returns Array of ProtectedEndpoint
 */
export function getEndpointsForProvider(provider: AIProvider): ProtectedEndpoint[] {
  return PROTECTED_ENDPOINTS.filter((ep) => ep.provider === provider)
}

/**
 * Get all endpoints in a category
 *
 * @param category - Model category
 * @returns Array of ProtectedEndpoint
 */
export function getEndpointsByCategory(category: ModelCategory): ProtectedEndpoint[] {
  return PROTECTED_ENDPOINTS.filter((ep) => ep.category === category)
}

// ============================================================================
// REGISTRY EXPORT
// ============================================================================

export const modelEndpointRegistry = {
  endpoints: PROTECTED_ENDPOINTS,
  tierAccess: TIER_ACCESS_RULES,
  match: matchProtectedEndpoint,
  isProtected: isProtectedEndpoint,
  getProvider: getProviderForEndpoint,
  canAccess: canAccessModelCategory,
  getRateLimit: getRateLimitForTier,
  getTokenQuota: getTokenQuotaForTier,
  isOverageAllowed: isOverageAllowed,
  getByProvider: getEndpointsForProvider,
  getByCategory: getEndpointsByCategory,
}

export default modelEndpointRegistry
