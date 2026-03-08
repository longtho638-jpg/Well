/**
 * Tenant License Hook - Phase 6.5
 *
 * React hook for monitoring tenant license status.
 * Provides license information, quota overrides, and feature flags.
 *
 * @example
 * ```typescript
 * const { license, overrides, features, refresh } = useTenantLicense(tenantId);
 * ```
 */

import { useEffect, useState, useCallback } from 'react'
import { tenantLicenseClient, type TenantLicenseStatus, type QuotaOverride, type TenantFeatureFlags } from '@/lib/tenant-license-client'
import type { LicenseTier } from '@/lib/rbac-engine'

interface UseTenantLicenseReturn {
  // License status
  license: TenantLicenseStatus | null
  tier: LicenseTier | null
  status: 'active' | 'suspended' | 'expired' | 'revoked' | null
  isValid: boolean

  // Quota overrides
  overrides: QuotaOverride[] | null

  // Feature flags
  features: string[] | null
  featureFlags: Record<string, boolean> | null

  // Actions
  refresh: () => Promise<void>
  applyOverride: (metricType: string, newLimit: number, validUntil?: string) => Promise<boolean>
  syncFeatures: (flags: Record<string, boolean>) => Promise<boolean>

  // State
  loading: boolean
  error: string | null
}

export function useTenantLicense(tenantId: string | undefined): UseTenantLicenseReturn {
  const [license, setLicense] = useState<TenantLicenseStatus | null>(null)
  const [overrides, setOverrides] = useState<QuotaOverride[] | null>(null)
  const [features, setFeatures] = useState<string[] | null>(null)
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch license status
   */
  const fetchLicense = useCallback(async () => {
    if (!tenantId) {
      setLicense(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const status = await tenantLicenseClient.getTenantLicenseStatus(tenantId)
      setLicense(status)
      setOverrides(status?.quotaOverrides || null)
      setFeatures(status?.features || null)

      // Fetch feature flags
      const flags = await tenantLicenseClient.getFeatureFlags(tenantId)
      setFeatureFlags(flags)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch license')
      setLicense(null)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  /**
   * Apply quota override
   */
  const applyOverride = useCallback(async (
    metricType: string,
    newLimit: number,
    validUntil?: string
  ): Promise<boolean> => {
    if (!tenantId) return false

    const result = await tenantLicenseClient.applyQuotaOverride({
      tenantId,
      metricType,
      newLimit,
      validUntil,
    })

    if (result.success) {
      await fetchLicense()
    }

    return result.success
  }, [tenantId, fetchLicense])

  /**
   * Sync feature flags
   */
  const syncFeatures = useCallback(async (
    flags: Record<string, boolean>
  ): Promise<boolean> => {
    if (!tenantId) return false

    const result = await tenantLicenseClient.syncFeatureFlags(flags, tenantId)

    if (result.success) {
      setFeatureFlags(flags)
    }

    return result.success
  }, [tenantId])

  useEffect(() => {
    fetchLicense()
  }, [fetchLicense])

  return {
    license,
    tier: license?.tier || null,
    status: license?.status || null,
    isValid: license?.status === 'active',
    overrides,
    features,
    featureFlags,
    refresh: fetchLicense,
    applyOverride,
    syncFeatures,
    loading,
    error,
  }
}

export default useTenantLicense
