/**
 * Vibe Subscription SDK — Provider-Agnostic Subscription Types
 *
 * Reusable interfaces for SaaS/RaaS subscription management.
 * Decoupled from any specific database or payment provider.
 */

// ─── Billing ────────────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'yearly';

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'trialing'
  | 'expired';

// ─── Plan ───────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_members: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

// ─── User Subscription ─────────────────────────────────────────

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  org_id: string | null;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  started_at: string;
  current_period_end: string;
  canceled_at: string | null;
  payos_order_code: number | null;
  last_payment_at: string | null;
  next_payment_at: string | null;
}

// ─── Active Plan Info (aggregated view) ─────────────────────────

export interface ActivePlanInfo {
  plan_slug: string;
  plan_name: string;
  status: string;
  period_end: string;
  max_members: number;
}

// ─── Organization ───────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type OrgRole = 'owner' | 'admin' | 'member';

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  joined_at: string;
}

// ─── Feature Gate Config ────────────────────────────────────────

export interface FeatureGateConfig {
  /** Ordered list of plan slugs from lowest to highest tier */
  planHierarchy: string[];
  /** Map of feature name → minimum plan slug required */
  featureMinPlan: Record<string, string>;
  /** Default plan required when feature not in map */
  defaultMinPlan?: string;
}

// ─── Org Billing Dashboard ─────────────────────────────────────

/** Aggregated billing view for a multi-org dashboard */
export interface OrgBillingDashboard {
  orgId: string;
  orgName: string;
  currentPlan: ActivePlanInfo | null;
  memberCount: number;
  maxMembers: number;
  billingCycle: BillingCycle | null;
  nextPaymentDate: string | null;
  monthlyRevenue: number;
  accessibleFeatures: string[];
}

/** Revenue metrics across all orgs for platform admin */
export interface OrgRevenueMetrics {
  totalOrgs: number;
  activeSubscriptions: number;
  totalMRR: number;
  totalARR: number;
  churnRate: number;
  averageRevenuePerOrg: number;
  revenueByPlan: Record<string, number>;
  currency: string;
}

// ─── Usage Tracking (org-scoped metering) ─────────────────────

/** Single usage event for a feature within an org */
export interface UsageRecord {
  id: string;
  org_id: string;
  user_id: string;
  feature: string;
  quantity: number;
  recorded_at: string;
  metadata: Record<string, unknown>;
}

/** Aggregated usage summary for an org within a billing period */
export interface UsageSummary {
  org_id: string;
  feature: string;
  total_quantity: number;
  event_count: number;
  period_start: string;
  period_end: string;
}

/** Quota definition tied to a plan — how much of a feature an org can use */
export interface UsageQuota {
  feature: string;
  limit: number;
  used: number;
  remaining: number;
  percentage: number;
}
