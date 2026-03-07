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
export type {
  RevenueMetrics,
  RevenueByTier,
  CohortRetention,
  LicenseUsage,
  CustomerSegment,
  FunnelStep,
  ConversionFunnel,
  WeeklyRetention,
  FeatureAdoption,
  CohortAnalysis,
} from './analytics/use-cohort-analysis'
