/**
 * License Tier Types - ROIaaS Phase 5
 * Định nghĩa các hạng license và features
 */

/**
 * License tiers - thứ bậc từ thấp đến cao
 */
export type LicenseTier = 'free' | 'pro' | 'enterprise'

/**
 * Features available per tier
 */
export interface TierFeatures {
  basicMetrics: boolean        // GMV, active licenses, simple charts
  advancedAnalytics: boolean   // Cohort analysis, conversion funnel, revenue by tier
  exportCSV: boolean           // Export CSV
  exportPDF: boolean           // Export PDF
  realTimeSync: boolean        // 30s auto-refresh
  customDateRange: boolean     // Custom date picker
}

/**
 * License tier configuration
 */
export const TIER_CONFIG: Record<LicenseTier, {
  label: string
  features: TierFeatures
  price?: string
}> = {
  free: {
    label: 'Free',
    features: {
      basicMetrics: true,
      advancedAnalytics: false,
      exportCSV: false,
      exportPDF: false,
      realTimeSync: false,
      customDateRange: false,
    },
  },
  pro: {
    label: 'Pro',
    features: {
      basicMetrics: true,
      advancedAnalytics: true,
      exportCSV: true,
      exportPDF: false,
      realTimeSync: true,
      customDateRange: true,
    },
    price: '₫299,000/month',
  },
  enterprise: {
    label: 'Enterprise',
    features: {
      basicMetrics: true,
      advancedAnalytics: true,
      exportCSV: true,
      exportPDF: true,
      realTimeSync: true,
      customDateRange: true,
    },
    price: 'Contact',
  },
}

/**
 * License context from Supabase
 */
export interface LicenseContext {
  tier: LicenseTier
  isLoading: boolean
  canAccess: (requiredTier: LicenseTier) => boolean
  features: TierFeatures
}

/**
 * Premium gate props
 */
export interface PremiumGateProps {
  tier: LicenseTier
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Upgrade modal props
 */
export interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  currentTier: LicenseTier
  targetTier: LicenseTier
}
