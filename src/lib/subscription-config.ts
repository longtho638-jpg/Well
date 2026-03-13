/**
 * WellNexus Subscription Configuration
 *
 * Feature gate configuration per subscription plan.
 * Defines which features are accessible at each tier level.
 */

import type { FeatureGateConfig } from '@/lib/vibe-subscription/types';

/**
 * WellNexus feature gate configuration
 * Plan hierarchy from lowest to highest tier
 */
export const WELLNEXUS_FEATURE_GATE: FeatureGateConfig = {
  planHierarchy: ['free', 'pro', 'enterprise'],
  featureMinPlan: {
    // Analytics & Reporting
    analyticsDashboard: 'pro',      // /dashboard/analytics, /admin/analytics
    advancedReports: 'pro',         // Custom report builder
    bulkExport: 'pro',              // CSV/Excel exports

    // Support & Priority
    priorityBooking: 'enterprise',  // Priority support queue
    dedicatedSupport: 'enterprise', // Dedicated account manager

    // Advanced Features
    customIntegrations: 'enterprise',  // Custom API integrations
    whiteLabel: 'enterprise',          // White-label branding
  },
  defaultMinPlan: 'free',
};

/**
 * Premium feature display names
 * Used in UI for upgrade prompts and pricing pages
 */
export const PREMIUM_FEATURES = {
  analyticsDashboard: 'Analytics Dashboard',
  advancedReports: 'Advanced Reports',
  bulkExport: 'Bulk Exports',
  priorityBooking: 'Priority Booking',
  dedicatedSupport: 'Dedicated Support',
  customIntegrations: 'Custom Integrations',
  whiteLabel: 'White Label',
} as const;

/**
 * Type-safe feature keys
 */
export type WellNexusFeature = keyof typeof PREMIUM_FEATURES;

/**
 * Get feature display name with fallback to feature key
 */
export function getFeatureDisplayName(feature: string): string {
  const featureKey = feature as WellNexusFeature;
  return PREMIUM_FEATURES[featureKey] ?? feature;
}
