/**
 * useLicenseTier Hook - ROIaaS Phase 5
 * Hook để lấy license tier từ Supabase session
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { LicenseTier, TierFeatures } from '@/types/license'
import { TIER_CONFIG as tierConfig } from '@/types/license'

/**
 * Xác định tier dựa vào user metadata hoặc license table
 * Ưu tiên: Enterprise > Pro > Free
 */
function determineTier(userTier?: string | null): LicenseTier {
  if (!userTier) return 'free'
  if (userTier.toLowerCase() === 'enterprise') return 'enterprise'
  if (userTier.toLowerCase() === 'pro') return 'pro'
  return 'free'
}

/**
 * Hook để lấy license tier hiện tại của user
 */
export function useLicenseTier() {
  const [tier, setTier] = useState<LicenseTier>('free')
  const [isLoading, setIsLoading] = useState(true)
  const [features, setFeatures] = useState<TierFeatures>(tierConfig.free.features)

  const checkTier = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Không có user → Free tier
        setTier('free')
        setFeatures(tierConfig.free.features)
        setIsLoading(false)
        return
      }

      // Check user metadata cho tier info
      const userTier = user.user_metadata?.tier || user.user_metadata?.license_tier

      // Nếu có tier trong metadata, dùng nó
      if (userTier) {
        const determinedTier = determineTier(userTier)
        setTier(determinedTier)
        setFeatures(tierConfig[determinedTier].features)
        setIsLoading(false)
        return
      }

      // Nếu không có trong metadata, check licenses table
      const { data: license } = await supabase
        .from('licenses')
        .select('tier')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .single()

      if (license?.tier) {
        const determinedTier = determineTier(license.tier)
        setTier(determinedTier)
        setFeatures(tierConfig[determinedTier].features)
      } else {
        setTier('free')
        setFeatures(tierConfig.free.features)
      }
    } catch (error) {
      console.error('Error fetching license tier:', error)
      setTier('free')
      setFeatures(tierConfig.free.features)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkTier()
  }, [checkTier])

  // Hàm check access
  const canAccess = useCallback((requiredTier: LicenseTier): boolean => {
    const tierOrder: LicenseTier[] = ['free', 'pro', 'enterprise']
    const currentIndex = tierOrder.indexOf(tier)
    const requiredIndex = tierOrder.indexOf(requiredTier)
    return currentIndex >= requiredIndex
  }, [tier])

  return {
    tier,
    isLoading,
    canAccess,
    features,
    refresh: checkTier,
  }
}

export default useLicenseTier
