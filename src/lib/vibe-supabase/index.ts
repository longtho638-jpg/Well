/**
 * Vibe Supabase SDK — Entry Point
 *
 * Typed query helpers + re-exports for RaaS Supabase integration.
 * Eliminates boilerplate across 15+ services.
 *
 * Usage:
 *   import { supabase } from '@/lib/vibe-supabase';
 *   import { fetchOne, fetchMany, rpcCall } from '@/lib/vibe-supabase';
 */

// Re-export configured client
export { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Typed query helpers
export {
  fetchOne,
  fetchMany,
  insertOne,
  updateWhere,
  rpcCall,
  invokeFunction,
  getCurrentUserId,
} from './typed-query-helpers';

// Result types
export type {
  QueryResult,
  QueryListResult,
} from './typed-query-helpers';

// Org-scoped query helpers (multi-org CRUD)
export {
  getUserOrgs,
  getOrgById,
  getOrgMembers,
  getOrgActivePlan,
  getOrgSubscription,
  createOrg,
  orgQueries,
} from './org-scoped-query-helpers';

// Subscription query helpers (user-level plans + subscriptions)
export {
  getPlans,
  getUserActivePlan,
  getUserSubscription,
  createSubscription,
  cancelSubscription,
  createSubscriptionIntent,
  subscriptionQueries,
} from './subscription-query-helpers';
