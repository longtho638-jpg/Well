/**
 * useOrganization Hook
 *
 * Provides current organization context for billing and analytics features.
 * Retrieves organization data from user_subscriptions table.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from './useUser'

export interface Organization {
  id: string
  name: string
  slug?: string
  created_at?: string
  updated_at?: string
}

export interface UseOrganizationResult {
  organization: Organization | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function useOrganization(): UseOrganizationResult {
  const { user } = useUser()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadOrganization = useCallback(async () => {
    if (!user) {
      setOrganization(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get organization from user's active subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('org_id, organizations(id, name, slug, created_at, updated_at)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (subError) {
        // No active subscription - try to get any subscription
        const { data: anySub } = await supabase
          .from('user_subscriptions')
          .select('org_id, organizations(id, name, slug, created_at, updated_at)')
          .eq('user_id', user.id)
          .single()

        // Supabase relationships return array, extract first item
        const orgData = Array.isArray(anySub?.organizations)
          ? anySub.organizations[0]
          : anySub?.organizations
        if (orgData) {
          setOrganization(orgData as Organization)
        } else {
          setOrganization(null)
        }
      } else {
        // Supabase relationships return array, extract first item
        const orgData = Array.isArray(subscription?.organizations)
          ? subscription.organizations[0]
          : subscription?.organizations
        if (orgData) {
          setOrganization(orgData as Organization)
        } else {
          setOrganization(null)
        }
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error')
      setError(errorObj)
      console.error('[useOrganization] Error loading organization:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadOrganization()
  }, [loadOrganization])

  const refresh = useCallback(async () => {
    await loadOrganization()
  }, [loadOrganization])

  return {
    organization,
    isLoading,
    error,
    refresh,
  }
}

export default useOrganization
