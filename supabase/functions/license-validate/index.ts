/**
 * RaaS License Validation Edge Function
 * Security: Rate limiting, input validation, CORS, audit logging
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import {
  getClientIP,
  checkRateLimit,
  getCorsHeaders,
  validateLicenseFormat,
  validateAndSanitizeFeatures,
  maskLicenseKey,
  type RateLimitEntry,
} from '../_shared/license-utils.ts'

const ALLOWED_ORIGINS = [
  'https://wellnexus.vn',
  'https://www.wellnexus.vn',
  'https://wellnexus-staging.vercel.app',
]

const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 10
const MAX_REQUEST_SIZE_BYTES = 1024

const rateLimitMap = new Map<string, RateLimitEntry>()

async function logAudit(
  supabase: Record<string, unknown>,
  event: string,
  clientIP: string,
  licenseKey: string,
  result: string,
  details: Record<string, unknown>
) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: null,
      event_type: `RAAS_LICENSE_${event}`,
      resource: 'license_validation',
      resource_id: maskLicenseKey(licenseKey),
      metadata: { client_ip: clientIP, result, ...details },
      timestamp: new Date().toISOString(),
    })
  } catch {
    console.error('[audit] Log failed')
  }
}

serve(async (req: Request) => {
  const headers = getCorsHeaders(req, ALLOWED_ORIGINS)
  if (req.method === 'OPTIONS') return new Response('ok', { headers })

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const clientIP = getClientIP(req)
  const rateLimit = checkRateLimit(clientIP, rateLimitMap, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS)

  if (!rateLimit.allowed) {
    await logAudit(null as any, 'RATE_LIMITED', clientIP, '', 'blocked', { reason: 'Too many requests' })
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in 1 minute.' }), {
      status: 429,
      headers: { ...headers, 'Content-Type': 'application/json', 'Retry-After': '60' },
    })
  }

  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE_BYTES) {
    await logAudit(null as any, 'PAYLOAD_TOO_LARGE', clientIP, '', 'blocked', { reason: 'Request too large' })
    return new Response(JSON.stringify({ error: 'Payload too large. Max 1KB.' }), {
      status: 413,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  try {
    let requestBody: unknown
    try {
      requestBody = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const { licenseKey } = (requestBody as Record<string, unknown>) || {}

    if (!licenseKey) {
      return new Response(JSON.stringify({
        isValid: false,
        error: 'licenseKey is required',
        features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
      }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } })
    }

    const formatValidation = validateLicenseFormat(String(licenseKey))
    if (!formatValidation.valid) {
      return new Response(JSON.stringify({
        isValid: false,
        error: formatValidation.error,
        features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
      }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } })
    }

    const safeLicenseKey = String(licenseKey)
    const parts = safeLicenseKey.split('-')
    const timestamp = parseInt(parts[1], 10)
    const expiresAt = timestamp + (365 * 24 * 60 * 60 * 1000)
    const now = Date.now()

    if (now > expiresAt) {
      await logAudit(null as any, 'EXPIRED', clientIP, safeLicenseKey, 'failure', { expiresAt })
      return new Response(JSON.stringify({
        isValid: false,
        error: 'License expired',
        features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
      }), { status: 403, headers: { ...headers, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({
        isValid: false,
        error: 'Service configuration error',
        features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
      }), { status: 503, headers: { ...headers, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: license, error: dbError } = await supabase
      .from('raas_licenses')
      .select('id, license_key, features, expires_at, status')
      .eq('license_key', safeLicenseKey)
      .eq('status', 'active')
      .single()

    if (dbError || !license) {
      const envLicense = Deno.env.get('VITE_RAAS_LICENSE_KEY')
      if (envLicense === safeLicenseKey) {
        await logAudit(supabase, 'VALIDATED_ENV', clientIP, safeLicenseKey, 'success', { method: 'env' })
        return new Response(JSON.stringify({
          isValid: true,
          features: { adminDashboard: true, payosWebhook: true, commissionDistribution: true, policyEngine: true },
          daysRemaining: Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24)),
        }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } })
      }
      await logAudit(supabase, 'NOT_FOUND', clientIP, safeLicenseKey, 'failure', { method: 'db' })
      return new Response(JSON.stringify({
        isValid: false,
        error: 'License not found or inactive',
        features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
      }), { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } })
    }

    await logAudit(supabase, 'VALIDATED_DB', clientIP, safeLicenseKey, 'success', { method: 'db', licenseId: license.id })
    return new Response(JSON.stringify({
      isValid: true,
      features: validateAndSanitizeFeatures(license.features),
      daysRemaining: Math.floor((new Date(license.expires_at).getTime() - now) / (1000 * 60 * 60 * 24)),
    }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})
