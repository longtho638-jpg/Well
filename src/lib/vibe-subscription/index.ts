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
