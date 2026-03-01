/**
 * Vibe Subscription SDK — Entry Point
 *
 * Provider-agnostic subscription management for RaaS projects.
 * Pure logic: feature gates, billing periods, type definitions.
 *
 * Usage:
 *   import { canAccessFeature, calculatePeriodEnd } from '@/lib/vibe-subscription';
 *   import type { SubscriptionPlan, UserSubscription } from '@/lib/vibe-subscription';
 */

// Re-export all types
export type {
  BillingCycle,
  SubscriptionStatus,
  SubscriptionPlan,
  UserSubscription,
  ActivePlanInfo,
  Organization,
  OrgRole,
  OrgMember,
  FeatureGateConfig,
  OrgBillingDashboard,
  OrgRevenueMetrics,
  UsageRecord,
  UsageSummary,
  UsageQuota,
} from './types';

// Feature gate utilities
export {
  canAccessFeature,
  getAccessibleFeatures,
  getMinPlanForFeature,
} from './feature-gate';

// Billing period utilities
export {
  calculatePeriodEnd,
  isPeriodActive,
  daysRemaining,
} from './billing-period';

// Multi-org billing engine
export {
  resolveOrgSubscription,
  canOrgAccessFeature,
  getOrgAccessibleFeatures,
  computeActivationParams,
  needsRenewal,
} from './multi-org-billing-engine';

export type {
  OrgSubscriptionContext,
  OrgBillingDeps,
  SubscriptionActivationResult,
} from './multi-org-billing-engine';

// Proration calculator (mid-cycle plan changes)
export { calculateProration } from './proration-calculator';
export type { ProrateInput, ProrateResult } from './proration-calculator';

// Renewal scheduler (auto-renewal detection)
export {
  findRenewableSubscriptions,
  createRenewalIntent,
} from './renewal-scheduler';
export type {
  RenewalSchedulerConfig,
  RenewalIntent,
  RenewalSchedulerDeps,
} from './renewal-scheduler';
