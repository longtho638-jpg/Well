import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Rate limit configuration
const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // 100 requests per minute per user

interface RateLimitRequest {
  userId: string
  action?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, action = 'default' }: RateLimitRequest = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ allowed: false, error: 'Missing userId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Use PostgreSQL atomic operations for rate limiting
    const key = `rate_limit_${userId}_${action}`
    const now = Date.now()
    const windowStart = now - WINDOW_MS

    // Try to insert or update rate limit counter atomically
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_window_start: new Date(windowStart).toISOString(),
      p_max_requests: MAX_REQUESTS,
    })

    if (error) {
      console.error('Rate limit check error:', error)
      // Fallback: allow request if DB check fails
      return new Response(
        JSON.stringify({ allowed: true, fallback: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const allowed = data as boolean

    // Log rate limit events for admin monitoring
    if (!allowed) {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        event_type: 'RATE_LIMIT_EXCEEDED',
        resource: 'api',
        resource_id: action,
        metadata: { key, windowStart, maxRequests: MAX_REQUESTS },
        timestamp: new Date().toISOString(),
      })
    }

    return new Response(
      JSON.stringify({
        allowed,
        remaining: allowed ? MAX_REQUESTS - 1 : 0,
        resetAt: new Date(now + WINDOW_MS).toISOString(),
      }),
      {
        status: allowed ? 200 : 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': allowed ? '99' : '0',
          'X-RateLimit-Reset': new Date(now + WINDOW_MS).toISOString(),
        },
      }
    )
  } catch (error) {
    console.error('Rate limit error:', error)
    return new Response(
      JSON.stringify({ allowed: false, error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
