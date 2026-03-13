/**
 * Subscription Gate - Feature Access Control
 *
 * Determines if a user has access to a specific feature based on their subscription tier.
 * Works with subscription-config.ts to enforce feature gating across the application.
 *
 * Usage:
 *   import { checkFeatureAccess, getRequiredPlan, useFeatureGate } from '@/lib/subscription-gate'
 *
 *   // Check if user can access analytics
 *   const hasAccess = checkFeatureAccess('premium', 'analyticsDashboard')
 *
 *   // Get minimum plan required for a feature
 *   const requiredPlan = getRequiredPlan('bulkExport') // returns 'pro'
 *
 *   // React hook for component-level gating
 *   const { hasAccess, isLoading, currentTier } = useFeatureGate('analyticsDashboard')
 */

import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import {
  WELLNEXUS_FEATURE_GATE,
  PREMIUM_FEATURES,
  getFeatureDisplayName,
  WellNexusFeature,
} from '@/lib/subscription-config'
import type { FeatureGateConfig } from '@/lib/vibe-subscription/types'
import type { LicenseTier } from '@/types/license'

// Re-export WellNexusFeature type for convenient import
export type { WellNexusFeature }

/**
 * Subscription tier hierarchy (lowest to highest)
 */
const TIER_HIERARCHY = ['free', 'pro', 'enterprise'] as const

export type SubscriptionTier = (typeof TIER_HIERARCHY)[number]

/**
 * Check if a subscription tier meets the minimum requirement
 *
 * @param currentTier - User's current subscription tier
 * @param requiredTier - Minimum tier required for the feature
 * @returns true if current tier meets or exceeds required tier
 */
export function meetsTierRequirement(
  currentTier: string,
  requiredTier: string
): boolean {
  const currentIndex = TIER_HIERARCHY.indexOf(currentTier as SubscriptionTier)
  const requiredIndex = TIER_HIERARCHY.indexOf(requiredTier as SubscriptionTier)

  // If either tier is not in hierarchy, deny access
  if (currentIndex === -1 || requiredIndex === -1) {
    return currentTier === requiredTier
  }

  return currentIndex >= requiredIndex
}

/**
 * Check if a user has access to a specific feature
 *
 * @param userTier - User's current subscription tier (e.g., 'free', 'pro', 'enterprise')
 * @param feature - Feature name to check access for
 * @param config - Optional feature gate config (defaults to WELLNEXUS_FEATURE_GATE)
 * @returns true if user has access to the feature
 */
export function checkFeatureAccess(
  userTier: string,
  feature: string,
  config: FeatureGateConfig = WELLNEXUS_FEATURE_GATE
): boolean {
  // Get minimum plan required for this feature
  const requiredPlan =
    config.featureMinPlan[feature] ?? config.defaultMinPlan ?? 'free'

  return meetsTierRequirement(userTier, requiredPlan)
}

/**
 * Get the minimum plan required for a feature
 *
 * @param feature - Feature name
 * @param config - Optional feature gate config
 * @returns Minimum plan slug required for the feature
 */
export function getRequiredPlan(
  feature: string,
  config: FeatureGateConfig = WELLNEXUS_FEATURE_GATE
): string {
  return config.featureMinPlan[feature] ?? config.defaultMinPlan ?? 'free'
}

/**
 * Get list of features unavailable for a given tier
 *
 * @param userTier - User's current subscription tier
 * @param config - Optional feature gate config
 * @returns Array of feature names that are locked for this tier
 */
export function getLockedFeatures(
  userTier: string,
  config: FeatureGateConfig = WELLNEXUS_FEATURE_GATE
): string[] {
  return Object.entries(config.featureMinPlan)
    .filter(([_, requiredPlan]) => !meetsTierRequirement(userTier, requiredPlan))
    .map(([feature]) => feature)
}

/**
 * Get list of features available for a given tier
 *
 * @param userTier - User's current subscription tier
 * @param config - Optional feature gate config
 * @returns Array of feature names available for this tier
 */
export function getAvailableFeatures(
  userTier: string,
  config: FeatureGateConfig = WELLNEXUS_FEATURE_GATE
): string[] {
  return Object.entries(config.featureMinPlan)
    .filter(([_, requiredPlan]) => meetsTierRequirement(userTier, requiredPlan))
    .map(([feature]) => feature)
}

/**
 * Check if a tier upgrade would unlock specific features
 *
 * @param fromTier - Current subscription tier
 * @param toTier - Target subscription tier
 * @returns Array of feature names that would be unlocked
 */
export function getFeaturesUnlockedByUpgrade(
  fromTier: string,
  toTier: string,
  config: FeatureGateConfig = WELLNEXUS_FEATURE_GATE
): string[] {
  return Object.entries(config.featureMinPlan)
    .filter(([_, requiredPlan]) => {
      const lockedAtFrom = !meetsTierRequirement(fromTier, requiredPlan)
      const unlockedAtTo = meetsTierRequirement(toTier, requiredPlan)
      return lockedAtFrom && unlockedAtTo
    })
    .map(([feature]) => feature)
}

/**
 * Format feature access denial response for API
 *
 * @param feature - Feature that was denied
 * @param userTier - User's current tier
 * @param requiredTier - Required tier for the feature
 * @returns API response body for subscription required error
 */
export function formatSubscriptionDeniedResponse(
  feature: string,
  userTier: string,
  requiredTier: string
): {
  error: string
  message: string
  required_plan: string
  current_plan: string
  upgrade_url: string
  locked_features: string[]
} {
  const lockedFeatures = getLockedFeatures(userTier)

  return {
    error: 'subscription_required',
    message: `This feature requires ${requiredTier} plan or higher`,
    required_plan: requiredTier,
    current_plan: userTier,
    upgrade_url: '/subscription',
    locked_features: lockedFeatures,
  }
}

/**
 * React hook for feature gating in components
 *
 * Usage:
 * ```tsx
 * const { hasAccess, isLoading, currentTier, requiredTier } = useFeatureGate('analyticsDashboard')
 *
 * if (isLoading) return <Spinner />
 * if (!hasAccess) return <UpgradePrompt />
 * return <AnalyticsDashboard />
 * ```
 */
export interface UseFeatureGateResult {
  /** Whether user has access to the feature */
  hasAccess: boolean
  /** Loading state (checking subscription) */
  isLoading: boolean
  /** User's current subscription tier */
  currentTier: LicenseTier
  /** Required tier for the feature */
  requiredTier: LicenseTier
  /** Feature display name */
  featureName: string
  /** Upgrade message */
  upgradeMessage: string
}

export function useFeatureGate(feature: WellNexusFeature): UseFeatureGateResult {
  const [result, setResult] = useState<UseFeatureGateResult>({
    hasAccess: false,
    isLoading: true,
    currentTier: 'free',
    requiredTier: 'free',
    featureName: getFeatureDisplayName(feature),
    upgradeMessage: '',
  })

  useEffect(() => {
    const checkAccess = () => {
      const { activePlan, subscriptionLoading } = useStore.getState()
      const planSlug = activePlan?.plan_slug?.toLowerCase() ?? ''

      // Determine user tier from plan slug
      let userTier: LicenseTier = 'free'
      if (planSlug.includes('enterprise')) {
        userTier = 'enterprise'
      } else if (planSlug.includes('pro')) {
        userTier = 'pro'
      }

      // Get required tier for this feature
      const requiredTier = (WELLNEXUS_FEATURE_GATE.featureMinPlan[feature] as LicenseTier) ?? 'free'

      // Check access
      const hasAccess = meetsTierRequirement(userTier, requiredTier)
      const upgradeMessage = hasAccess
        ? ''
        : `Upgrade to ${requiredTier} to access ${getFeatureDisplayName(feature)}`

      setResult({
        hasAccess,
        isLoading: subscriptionLoading,
        currentTier: userTier,
        requiredTier,
        featureName: getFeatureDisplayName(feature),
        upgradeMessage,
      })
    }

    checkAccess()
    return useStore.subscribe(checkAccess)
  }, [feature])

  return result
}

/**
 * PremiumRoute guard props
 */
export interface PremiumRouteGuardProps {
  children: React.ReactNode
  feature: WellNexusFeature
  redirectPath?: string
}

/**
 * Subscription gate utilities
 */
export const subscriptionGate = {
  checkFeatureAccess,
  getRequiredPlan,
  getLockedFeatures,
  getAvailableFeatures,
  getFeaturesUnlockedByUpgrade,
  formatSubscriptionDeniedResponse,
  meetsTierRequirement,
}

export default subscriptionGate
