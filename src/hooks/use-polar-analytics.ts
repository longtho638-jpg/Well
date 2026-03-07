// Analytics hooks re-export file - moved to separate files under ./analytics/
// Maintains backward compatibility for existing imports

export { useRevenue } from './analytics/use-revenue'
export { useCohortRetention } from './analytics/use-cohort-retention'
export { useLicenseUsage } from './analytics/use-license-usage'
export { useConversionFunnel } from './analytics/use-conversion-funnel'
export { useCohortAnalysis } from './analytics/use-cohort-analysis'
export { useCustomerSegments } from './analytics/use-customer-segments'
export { useRevenueByTier } from './analytics/use-revenue-by-tier'

// Re-export all types
export type { RevenueMetrics } from './analytics/use-revenue'
export type { RevenueByTier } from './analytics/use-revenue-by-tier'
export type { CohortRetention } from './analytics/use-cohort-retention'
export type { LicenseUsage } from './analytics/use-license-usage'
export type { CustomerSegment } from './analytics/use-customer-segments'
export type { FunnelStep, ConversionFunnel } from './analytics/use-conversion-funnel'
export type { WeeklyRetention, FeatureAdoption, CohortAnalysis } from './analytics/use-cohort-analysis'
