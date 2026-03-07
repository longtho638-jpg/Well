/**
 * Usage Metering Hooks - Types
 */

import type { UsageStatus } from '@/lib/usage-metering'
import type { LicenseTier, UsageSummary, QuotaAlert } from '@/types/usage'

/**
 * Usage Context Value
 */
export interface UsageContextValue {
  userId: string | null
  licenseId: string | null
  tier: LicenseTier
  usage: UsageStatus | null
  loading: boolean
  error: string | null
  trackUsage: (
    metric: string,
    data: { quantity?: number; tokens?: number; metadata?: Record<string, unknown> }
  ) => Promise<void>
  checkQuota: (feature: string) => Promise<QuotaCheckResponse>
  refresh: () => Promise<void>
  meter: any | null
}

/**
 * Quota Check Response
 */
export interface QuotaCheckResponse {
  allowed: boolean
  current_usage: number
  limit: number
  remaining: number
  percentage: number
  reset_at: string
  warnings?: string[]
  error?: string
}

/**
 * Usage Hook Return Type
 */
export interface UseUsageReturn {
  usage: UsageStatus | null
  loading: boolean
  error: string | null
  trackUsage: (
    metric: string,
    data: { quantity?: number; tokens?: number; metadata?: Record<string, unknown> }
  ) => Promise<void>
  refresh: () => Promise<void>
  tier: LicenseTier
  licenseId: string | null
}
