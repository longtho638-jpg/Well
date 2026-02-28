/**
 * Vibe Supabase SDK — Org-Scoped Query Helpers
 *
 * Centralized Supabase queries for multi-org CRUD operations.
 * Extracted from subscription-service to eliminate mixed concerns.
 * All queries are typed and org-scoped for RaaS multi-tenant patterns.
 *
 * Usage:
 *   import { orgQueries } from '@/lib/vibe-supabase';
 *   const orgs = await orgQueries.getUserOrgs(supabase, userId);
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Organization,
  OrgMember,
  ActivePlanInfo,
  UserSubscription,
} from '@/lib/vibe-subscription';

// ─── Org Read Operations ────────────────────────────────────────

/** Fetch all organizations a user belongs to (via org_members join) */
export async function getUserOrgs(
  supabase: SupabaseClient,
  userId: string,
): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(*)')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? [])
    .map((m) => (m.organizations as unknown) as Organization)
    .filter(Boolean);
}

/** Fetch org by ID */
export async function getOrgById(
  supabase: SupabaseClient,
  orgId: string,
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error) return null;
  return data as Organization;
}

/** Fetch all members of an organization */
export async function getOrgMembers(
  supabase: SupabaseClient,
  orgId: string,
): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from('org_members')
    .select('*')
    .eq('org_id', orgId);

  if (error) throw error;
  return data as OrgMember[];
}

// ─── Org Subscription Queries ───────────────────────────────────

/** Get the active plan for an org (via Postgres RPC) */
export async function getOrgActivePlan(
  supabase: SupabaseClient,
  orgId: string,
): Promise<ActivePlanInfo | null> {
  const { data, error } = await supabase
    .rpc('get_org_active_plan', { p_org_id: orgId });

  if (error) throw error;
  return (data as ActivePlanInfo[])?.[0] ?? null;
}

/** Get the current active subscription for an org */
export async function getOrgSubscription(
  supabase: SupabaseClient,
  orgId: string,
): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .in('status', ['active', 'trialing'])
    .gt('current_period_end', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as UserSubscription | null;
}

// ─── Org Write Operations ───────────────────────────────────────

/** Create an organization and auto-add owner as member */
export async function createOrg(
  supabase: SupabaseClient,
  params: { name: string; slug: string; ownerId: string },
): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: params.name,
      slug: params.slug,
      owner_id: params.ownerId,
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-add owner as org member
  await supabase.from('org_members').insert({
    org_id: data.id,
    user_id: params.ownerId,
    role: 'owner',
  });

  return data as Organization;
}

// ─── Convenience Namespace ──────────────────────────────────────

/** Grouped org queries for clean imports */
export const orgQueries = {
  getUserOrgs,
  getOrgById,
  getOrgMembers,
  getOrgActivePlan,
  getOrgSubscription,
  createOrg,
} as const;
