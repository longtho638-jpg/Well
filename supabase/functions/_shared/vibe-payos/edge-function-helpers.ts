/**
 * Vibe PayOS SDK — Shared Edge Function Helpers (Deno runtime)
 *
 * Common utilities extracted from 4+ Edge Functions to eliminate
 * duplicated auth checks, JSON responses, and Supabase client creation.
 *
 * Usage:
 *   import { jsonRes, requireAuth, createAdminClient } from '../_shared/vibe-payos/mod.ts'
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── JSON Response Helper ──────────────────────────────────────

/** Create a typed JSON Response (replaces boilerplate across all Edge Functions) */
export function jsonRes(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── Auth Helper ───────────────────────────────────────────────

interface AuthResult {
  userId: string
  supabase: SupabaseClient
}

/**
 * Extract and verify auth from request.
 * Returns userId + authenticated Supabase client, or throws with 401 Response.
 */
export async function requireAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw jsonRes({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw jsonRes({ error: 'Invalid token' }, 401)
  }

  return { userId: user.id, supabase }
}

// ─── Admin Client ──────────────────────────────────────────────

/** Create a Supabase admin client (service role) */
export function createAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
}

// ─── Optional Auth ─────────────────────────────────────────────

/**
 * Try to extract userId from auth header (guest checkout allowed).
 * Returns null if no auth header or invalid token.
 */
export async function optionalAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  try {
    const { userId } = await requireAuth(req)
    return userId
  } catch {
    return null
  }
}
