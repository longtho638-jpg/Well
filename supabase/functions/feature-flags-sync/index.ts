/**
 * Feature Flags Sync - Phase 6.2 Multi-tenant License Enforcement
 *
 * Synchronizes feature flags between AgencyOS dashboard and tenant database.
 * Supports push (dashboard → tenant) and pull (tenant → dashboard) sync modes.
 *
 * **Endpoints:**
 *   POST /functions/v1/feature-flags-sync   - Push/Pull flags
 *   GET  /functions/v1/feature-flags-sync   - Get flags for tenant
 *
 * **POST Request (Push Mode - Dashboard to Tenant):**
 *   {
 *     "sync_mode": "push",
 *     "org_id": "uuid",
 *     "flags": [
 *       {
 *         "flag_key": "ai_agents",
 *         "flag_name": "AI Agents Feature",
 *         "enabled": true,
 *         "flag_type": "boolean",
 *         "percentage_value": 100,
 *         "rollout_strategy": "immediate"
 *       }
 *     ],
 *     "sync_policy": "merge" | "overwrite" | "incremental"
 *   }
 *
 * **POST Request (Pull Mode - Tenant to Dashboard):**
 *   {
 *     "sync_mode": "pull",
 *     "org_id": "uuid",
 *     "flag_keys": ["ai_agents", "advanced_analytics"]
 *   }
 *
 * **POST Response:**
 *   {
 *     "success": true,
 *     "sync_mode": "push",
 *     "synced_count": 5,
 *     "created_count": 2,
 *     "updated_count": 3,
 *     "failed_count": 0,
 *     "errors": [],
 *     "flags": [...synced flags]
 *   }
 *
 * **GET Response:**
 *   {
 *     "success": true,
 *     "org_id": "uuid",
 *     "flags": [
 *       {
 *         "flag_key": "ai_agents",
 *         "flag_name": "AI Agents Feature",
 *         "enabled": true,
 *         "flag_type": "boolean",
 *         "value": true
 *       }
 *     ],
 *     "synced_at": "ISO date"
 *   }
 */

// deno-lint-ignore-file no-explicit-any

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  extractBearerToken,
  validateJWT,
  createSupabaseClient,
  getFeatureFlag,
  logAuditEvent,
  validateInput,
} from '../_shared/tenant-utils.ts'

interface FeatureFlag {
  flag_key: string
  flag_name?: string
  enabled?: boolean
  flag_type?: 'boolean' | 'percentage' | 'variant' | 'json'
  percentage_value?: number
  rollout_strategy?: 'immediate' | 'gradual' | 'scheduled' | 'canary'
  depends_on_flags?: string[]
  conflicts_with_flags?: string[]
  json_value?: Record<string, unknown>
  variant_value?: string
}

interface SyncRequest {
  sync_mode?: 'push' | 'pull'
  org_id?: string
  flags?: FeatureFlag[]
  flag_keys?: string[]
  sync_policy?: 'merge' | 'overwrite' | 'incremental'
}

interface SyncResponse {
  success: boolean
  sync_mode?: string
  synced_count?: number
  created_count?: number
  updated_count?: number
  failed_count?: number
  errors?: string[]
  flags?: FeatureFlag[]
  synced_at?: string
  error?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST and GET
  if (!['POST', 'GET'].includes(req.method)) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient()

    // Extract and validate JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    const token = extractBearerToken(authHeader)

    let userId: string | null = null
    let userOrgId: string | null = null

    if (token) {
      const payload = await validateJWT(token)
      userId = payload.sub
      userOrgId = payload.org_id || payload.tenant_id || null
    }

    // Handle POST - Push/Pull sync
    if (req.method === 'POST') {
      return await handlePOST(req, supabase, userId, userOrgId)
    }

    // Handle GET - Get flags for tenant
    if (req.method === 'GET') {
      return await handleGET(req, supabase, userId, userOrgId)
    }

  } catch (error) {
    console.error('[FeatureFlags] Error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Handle POST - Push/Pull feature flags sync
 */
async function handlePOST(
  req: Request,
  supabase: any,
  userId: string | null,
  userOrgId: string | null
): Promise<Response> {
  try {
    const payload: SyncRequest = await req.json()
    const {
      sync_mode,
      org_id,
      flags,
      flag_keys,
      sync_policy,
    } = payload

    // Validate required fields
    const effectiveOrgId = org_id || userOrgId

    if (!effectiveOrgId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'org_id is required (provide in body or JWT)',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate sync_mode
    const validSyncModes = ['push', 'pull']
    if (sync_mode && !validSyncModes.includes(sync_mode)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid sync_mode: must be one of ${validSyncModes.join(', ')}`,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate sync_policy for push mode
    const validSyncPolicies = ['merge', 'overwrite', 'incremental']
    if (sync_policy && !validSyncPolicies.includes(sync_policy)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Invalid sync_policy: must be one of ${validSyncPolicies.join(', ')}`,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Handle push mode (Dashboard → Tenant)
    if (sync_mode === 'push') {
      return await handlePushMode(supabase, effectiveOrgId, flags || [], sync_policy || 'merge', userId)
    }

    // Handle pull mode (Tenant → Dashboard)
    if (sync_mode === 'pull') {
      return await handlePullMode(supabase, effectiveOrgId, flag_keys || [], userId)
    }

    // Default: return current flags
    return await getTenantFlags(supabase, effectiveOrgId, userId)

  } catch (error) {
    console.error('[FeatureFlags:POST] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Handle GET - Get feature flags for tenant
 */
async function handleGET(
  req: Request,
  supabase: any,
  userId: string | null,
  userOrgId: string | null
): Promise<Response> {
  try {
    const url = new URL(req.url)
    const orgId = url.searchParams.get('org_id') || userOrgId

    if (!orgId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'org_id is required (provide as query param or in JWT)',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get all flags for tenant
    return await getTenantFlags(supabase, orgId, userId)

  } catch (error) {
    console.error('[FeatureFlags:GET] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get flags',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Handle push mode - Sync flags from AgencyOS to tenant
 */
async function handlePushMode(
  supabase: any,
  orgId: string,
  flags: FeatureFlag[],
  syncPolicy: string,
  userId: string | null
): Promise<Response> {
  const errors: string[] = []
  let createdCount = 0
  let updatedCount = 0
  let failedCount = 0

  try {
    // Validate flags
    for (const flag of flags) {
      if (!flag.flag_key) {
        errors.push('flag_key is required for all flags')
        failedCount++
      }
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        errors,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get existing flags for tenant
    const { data: existingFlags } = await supabase
      .from('tenant_feature_flags')
      .select('flag_key')
      .eq('org_id', orgId)

    const existingFlagKeys = new Set(existingFlags?.map(f => f.flag_key) || [])

    // Process each flag based on sync policy
    const syncedFlags: FeatureFlag[] = []

    for (const flag of flags) {
      try {
        const flagExists = existingFlagKeys.has(flag.flag_key)

        // Skip if flag doesn't exist and policy is incremental
        if (!flagExists && syncPolicy === 'incremental') {
          continue
        }

        // Skip if flag exists and policy is overwrite (we only want to update new ones)
        // Actually, overwrite means update existing, so we proceed
        if (flagExists) {
          // Update existing flag
          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          }

          if (flag.flag_name !== undefined) updateData.flag_name = flag.flag_name
          if (flag.enabled !== undefined) updateData.enabled = flag.enabled
          if (flag.flag_type !== undefined) updateData.flag_type = flag.flag_type
          if (flag.percentage_value !== undefined) updateData.percentage_value = flag.percentage_value
          if (flag.rollout_strategy !== undefined) updateData.rollout_strategy = flag.rollout_strategy
          if (flag.depends_on_flags !== undefined) updateData.depends_on_flags = flag.depends_on_flags
          if (flag.conflicts_with_flags !== undefined) updateData.conflicts_with_flags = flag.conflicts_with_flags
          if (flag.json_value !== undefined) updateData.json_value = flag.json_value
          if (flag.variant_value !== undefined) updateData.variant_value = flag.variant_value

          const { error } = await supabase
            .from('tenant_feature_flags')
            .update(updateData)
            .eq('org_id', orgId)
            .eq('flag_key', flag.flag_key)

          if (error) {
            errors.push(`Failed to update flag ${flag.flag_key}: ${error.message}`)
            failedCount++
          } else {
            updatedCount++
            syncedFlags.push(flag)
          }
        } else {
          // Create new flag
          const newFlag = {
            org_id: orgId,
            flag_key: flag.flag_key,
            flag_name: flag.flag_name || flag.flag_key,
            enabled: flag.enabled !== undefined ? flag.enabled : false,
            flag_type: flag.flag_type || 'boolean',
            percentage_value: flag.percentage_value || 0,
            rollout_strategy: flag.rollout_strategy || 'immediate',
            depends_on_flags: flag.depends_on_flags || [],
            conflicts_with_flags: flag.conflicts_with_flags || [],
            json_value: flag.json_value || null,
            variant_value: flag.variant_value || null,
          }

          const { error } = await supabase
            .from('tenant_feature_flags')
            .insert(newFlag)

          if (error) {
            errors.push(`Failed to create flag ${flag.flag_key}: ${error.message}`)
            failedCount++
          } else {
            createdCount++
            syncedFlags.push(flag)
          }
        }
      } catch (error) {
        errors.push(`Error processing flag ${flag.flag_key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        failedCount++
      }
    }

    // Log audit event
    await logAuditEvent(supabase, {
      user_id: userId,
      event_type: 'FEATURE_FLAGS_SYNC_PUSH',
      resource: 'tenant_feature_flags',
      resource_id: orgId,
      metadata: {
        sync_policy: syncPolicy,
        created_count: createdCount,
        updated_count: updatedCount,
        failed_count: failedCount,
      },
    })

    return new Response(JSON.stringify({
      success: true,
      sync_mode: 'push',
      synced_count: syncedFlags.length,
      created_count: createdCount,
      updated_count: updatedCount,
      failed_count: failedCount,
      errors,
      flags: syncedFlags,
      synced_at: new Date().toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[FeatureFlags:push] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Push sync failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Handle pull mode - Get specific flags for tenant
 */
async function handlePullMode(
  supabase: any,
  orgId: string,
  flagKeys: string[],
  userId: string | null
): Promise<Response> {
  try {
    // Fetch requested flags
    let query = supabase
      .from('tenant_feature_flags')
      .select('*')
      .eq('org_id', orgId)

    if (flagKeys.length > 0) {
      query = query.in('flag_key', flagKeys)
    }

    const { data: flags, error } = await query

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log audit event
    await logAuditEvent(supabase, {
      user_id: userId,
      event_type: 'FEATURE_FLAGS_SYNC_PULL',
      resource: 'tenant_feature_flags',
      resource_id: orgId,
      metadata: {
        requested_keys: flagKeys,
        returned_count: flags?.length || 0,
      },
    })

    return new Response(JSON.stringify({
      success: true,
      sync_mode: 'pull',
      flags: flags || [],
      synced_at: new Date().toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[FeatureFlags:pull] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Pull sync failed',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Get all feature flags for tenant
 */
async function getTenantFlags(
  supabase: any,
  orgId: string,
  userId: string | null
): Promise<Response> {
  try {
    // Fetch all flags for tenant
    const { data: flags, error } = await supabase
      .from('tenant_feature_flags')
      .select('*')
      .eq('org_id', orgId)
      .order('flag_key', { ascending: true })

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Evaluate each flag for the user
    const evaluatedFlags: Record<string, unknown>[] = []

    for (const flag of flags || []) {
      const flagValue = await getFeatureFlag(supabase, orgId, flag.flag_key, userId || undefined)
      evaluatedFlags.push({
        flag_key: flag.flag_key,
        flag_name: flag.flag_name,
        flag_type: flag.flag_type,
        enabled: flagValue.enabled,
        value: flagValue.value ?? flag.enabled,
        percentage_value: flag.percentage_value,
        rollout_strategy: flag.rollout_strategy,
      })
    }

    // Log audit event
    await logAuditEvent(supabase, {
      user_id: userId,
      event_type: 'FEATURE_FLAGS_GET',
      resource: 'tenant_feature_flags',
      resource_id: orgId,
      metadata: {
        flags_count: evaluatedFlags.length,
      },
    })

    return new Response(JSON.stringify({
      success: true,
      org_id: orgId,
      flags: evaluatedFlags,
      synced_at: new Date().toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[FeatureFlags:get] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get flags',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
