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
