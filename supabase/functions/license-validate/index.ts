/**
 * RaaS License Validation Edge Function
 *
 * POST /license-validate
 * Validate a RaaS license key server-side
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const LICENSE_PATTERN = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/


serve(async (req: Request) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers })
  }

  try {
    const { licenseKey } = await req.json()

    if (!licenseKey || typeof licenseKey !== 'string') {
      return new Response(JSON.stringify({
        isValid: false,
        error: 'licenseKey is required',
        features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
      }), { status: 400, headers })
    }

    if (!LICENSE_PATTERN.test(licenseKey)) {
      return new Response(JSON.stringify({
        isValid: false,
        error: 'Invalid license format',
        features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
      }), { status: 400, headers })
    }

    const parts = licenseKey.split('-')
    const timestamp = parseInt(parts[1], 10)
    const expiresAt = timestamp + (365 * 24 * 60 * 60 * 1000)
    const now = Date.now()

    if (now > expiresAt) {
      return new Response(JSON.stringify({
        isValid: false,
        error: 'License expired',
        features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
      }), { status: 403, headers })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: license, error } = await supabase
        .from('raas_licenses')
        .select('*')
        .eq('license_key', licenseKey)
        .eq('status', 'active')
        .single()

      if (error || !license) {
        const envLicense = Deno.env.get('VITE_RAAS_LICENSE_KEY')
        if (envLicense === licenseKey) {
          return new Response(JSON.stringify({
            isValid: true,
            features: { adminDashboard: true, payosWebhook: true, commissionDistribution: true, policyEngine: true },
            daysRemaining: Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24)),
          }), { status: 200, headers })
        }
        return new Response(JSON.stringify({
          isValid: false,
          error: 'License not found',
          features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
        }), { status: 404, headers })
      }

      return new Response(JSON.stringify({
        isValid: true,
        features: license.features,
        daysRemaining: Math.floor((new Date(license.expires_at).getTime() - now) / (1000 * 60 * 60 * 24)),
      }), { status: 200, headers })
    }

    const envLicense = Deno.env.get('VITE_RAAS_LICENSE_KEY')
    if (envLicense === licenseKey) {
      return new Response(JSON.stringify({
        isValid: true,
        features: { adminDashboard: true, payosWebhook: true, commissionDistribution: true, policyEngine: true },
        daysRemaining: Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24)),
      }), { status: 200, headers })
    }

    return new Response(JSON.stringify({
      isValid: false,
      error: 'License not configured',
      features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
    }), { status: 400, headers })
  } catch (err) {
    console.error('License validation error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers })
  }
})
