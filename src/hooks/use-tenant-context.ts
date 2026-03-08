/**
 * Tenant Context Hook - Phase 6.3
 *
 * React hook for accessing tenant context in components.
 * Provides tenant information and validation status.
 *
 * @example
 * ```typescript
 * const { tenant, loading, error, isValid } = useTenantContext();
 * ```
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { TenantContext } from '@/middleware/tenant-context'

interface UseTenantContextReturn {
  tenant: TenantContext | null
  loading: boolean
  error: string | null
  isValid: boolean
  refreshContext: () => Promise<void>
}

export function useTenantContext(): UseTenantContextReturn {
  const [tenant, setTenant] = useState<TenantContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch tenant context from current session
   */
  const fetchTenantContext = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setTenant(null)
        setLoading(false)
        return
      }

      // Get user's organization/tenant
      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('id, name, status, customer_id, policy_id')
        .eq('customer_id', user.id)
        .eq('status', 'active')
        .single()

      if (fetchError || !data) {
        setTenant({
          tenantId: '',
          tenantStatus: 'inactive',
          customerId: user.id,
          isValid: false,
          error: fetchError?.message || 'No tenant found',
        })
        setLoading(false)
        return
      }

      setTenant({
        tenantId: data.id,
        tenantPolicyId: data.policy_id || undefined,
        tenantName: data.name,
        tenantStatus: data.status,
        customerId: data.customer_id,
        isValid: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTenant(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTenantContext()
  }, [fetchTenantContext])

  return {
    tenant,
    loading,
    error,
    isValid: tenant?.isValid ?? false,
    refreshContext: fetchTenantContext,
  }
}

export default useTenantContext
