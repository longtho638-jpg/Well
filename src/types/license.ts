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
  // Basic metrics
  basicMetrics: boolean        // GMV, active licenses, simple charts

  // Analytics & Reporting
  analyticsDashboard: boolean  // /dashboard/analytics, /admin/analytics
  advancedReports: boolean     // Custom report builder
  advancedAnalytics: boolean   // Cohort analysis, conversion funnel, revenue by tier

  // Exports
  exportCSV: boolean           // Export CSV
  exportPDF: boolean           // Export PDF
  bulkExport: boolean          // CSV/Excel bulk exports

  // Real-time & UX
  realTimeSync: boolean        // 30s auto-refresh
  customDateRange: boolean     // Custom date picker

  // Support
  priorityBooking: boolean     // Priority support queue
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
      analyticsDashboard: false,
      advancedReports: false,
      advancedAnalytics: false,
      exportCSV: false,
      exportPDF: false,
      bulkExport: false,
      realTimeSync: false,
      customDateRange: false,
      priorityBooking: false,
    },
  },
  pro: {
    label: 'Pro',
    features: {
      basicMetrics: true,
      analyticsDashboard: true,
      advancedReports: true,
      advancedAnalytics: true,
      exportCSV: true,
      exportPDF: false,
      bulkExport: true,
      realTimeSync: true,
      customDateRange: true,
      priorityBooking: false,
    },
    price: '₫299,000/month',
  },
  enterprise: {
    label: 'Enterprise',
    features: {
      basicMetrics: true,
      analyticsDashboard: true,
      advancedReports: true,
      advancedAnalytics: true,
      exportCSV: true,
      exportPDF: true,
      bulkExport: true,
      realTimeSync: true,
      customDateRange: true,
      priorityBooking: true,
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
