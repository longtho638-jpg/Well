/**
 * Usage Metering Types - Phase 5
 * Tracks API calls, tokens, compute time, model inferences, agent executions
 */

import type { UsageStatus, UsageRecord, UsageEvent, AIUsageMetadata, TierLimits } from '@/lib/usage-metering'

/**
 * License Tier - maps to pricing tiers
 */
export type LicenseTier = 'free' | 'basic' | 'premium' | 'enterprise' | 'master'

/**
 * Usage Dashboard Props
 */
export interface UsageDashboardProps {
  userId: string
  licenseId?: string
  tier: LicenseTier
}

/**
 * Usage Chart Data Point
 */
export interface UsageChartData {
  date: string
  api_calls: number
  tokens: number
  compute_ms: number
  model_inferences: number
  agent_executions: number
}

/**
 * Quota Alert Threshold
 */
export interface QuotaAlert {
  metric: keyof UsageStatus
  threshold: number  // percentage (e.g., 80 = 80%)
  triggered: boolean
  message?: string
}

/**
 * Usage Summary for Dashboard Cards
 */
export interface UsageSummary {
  apiCalls: { used: number; limit: number; percentage: number }
  tokens: { used: number; limit: number; percentage: number }
  computeMinutes: { used: number; limit: number; percentage: number }
  modelInferences: { used: number; limit: number; percentage: number }
  agentExecutions: { used: number; limit: number; percentage: number }
  isLimited: boolean
  resetAt?: string
  tier: LicenseTier
}

/**
 * Usage Event for API Payload
 */
export interface UsageEventPayload {
  metric: string
  quantity: number
  metadata?: {
    model?: string
    provider?: string
    agent_type?: string
    endpoint?: string
    [key: string]: unknown
  }
  timestamp?: string
}

/**
 * Usage Analytics Response
 */
export interface UsageAnalyticsResponse {
  status: UsageStatus
  history: UsageChartData[]
  summary: UsageSummary
  alerts: QuotaAlert[]
}

// Re-export types from usage-metering.ts
export type { UsageStatus, UsageRecord, UsageEvent, AIUsageMetadata, TierLimits }

/**
 * Tier Display Info
 */
export interface TierInfo {
  name: string
  color: string
  badgeClass: string
}

export const TIER_INFO: Record<LicenseTier, TierInfo> = {
  free: { name: 'Free', color: 'text-gray-400', badgeClass: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  basic: { name: 'Basic', color: 'text-blue-400', badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  premium: { name: 'Premium', color: 'text-purple-400', badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  enterprise: { name: 'Enterprise', color: 'text-amber-400', badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  master: { name: 'Master', color: 'text-emerald-400', badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
}
