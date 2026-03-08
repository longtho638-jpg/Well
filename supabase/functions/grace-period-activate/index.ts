/**
 * Grace Period Activate Edge Function
 *
 * Activates grace period for tenants with expired licenses.
 * Called by admin users to grant temporary access.
 *
 * Request:
 *   POST /functions/v1/grace-period-activate
 *   {
 *     "tenantId": "string",
 *     "durationDays": 14,
 *     "maxOverrides": 3,
 *     "customQuotas": { ... }
 *   }
 *
 * Response:
 *   {
 *     "success": true,
 *     "gracePeriod": { ... },
 *     "message": "Grace period activated"
 *   }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GracePeriodRequest {
  tenantId: string;
  durationDays?: number;
  maxOverrides?: number;
  customQuotas?: {
    api_calls: number;
    tokens: number;
    compute_minutes: number;
    model_inferences: number;
    agent_executions: number;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceRoleRoleKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Parse request
    const body: GracePeriodRequest = await req.json();
    const { tenantId, durationDays = 14, maxOverrides = 3, customQuotas } = body;

    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    // Verify tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, status, customer_id')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error('Tenant not found');
    }

    // Check if grace period already active
    const { data: existingGracePeriod } = await supabase
      .from('tenant_grace_periods')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();

    if (existingGracePeriod) {
      const expiresAt = new Date(existingGracePeriod.expires_at);
      const now = new Date();
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Grace period already active',
          gracePeriod: {
            ...existingGracePeriod,
            daysRemaining: Math.max(0, daysRemaining),
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check tenant license status
    const { data: licenseData } = await supabase
      .from('raas_licenses')
      .select('status, tier, valid_until')
      .eq('customer_id', tenant.customer_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Activate grace period
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const limitedQuotas = customQuotas || {
      api_calls: 5000,
      tokens: 250000,
      compute_minutes: 50,
      model_inferences: 500,
      agent_executions: 100,
    };

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId = 'system';

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    // Create grace period record
    const { data: gracePeriod, error: gpError } = await supabase
      .from('tenant_grace_periods')
      .insert({
        tenant_id: tenantId,
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        max_overrides: maxOverrides,
        limited_quotas: limitedQuotas,
        activated_by: userId,
        status: 'active',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select()
      .single();

    if (gpError) {
      throw new Error(`Failed to create grace period: ${gpError.message}`);
    }

    // Create audit log
    await supabase
      .from('audit_logs')
      .insert({
        tenant_id: tenantId,
        action: 'grace_period_activated',
        metadata: {
          durationDays,
          maxOverrides,
          activatedBy: userId,
          licenseStatus: licenseData?.status,
        },
        created_at: now.toISOString(),
      });

    // Update tenant status to active (if expired)
    if (tenant.status === 'expired') {
      await supabase
        .from('tenants')
        .update({ status: 'active', updated_at: now.toISOString() })
        .eq('id', tenantId);
    }

    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Grace period activated for ${durationDays} days`,
        gracePeriod: {
          tenantId,
          tenantName: tenant.name,
          isActive: true,
          activatedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          daysRemaining,
          maxOverrides,
          overridesUsed: 0,
          limitedQuotas,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[grace-period-activate] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
