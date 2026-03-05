import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const CSRF_TOKEN_SECRET = Deno.env.get('CSRF_TOKEN_SECRET') || 'fallback-secret-change-in-production'

interface ValidateCsrfRequest {
  token: string
  userId: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, userId }: ValidateCsrfRequest = await req.json()

    if (!token || !userId) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing token or userId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify CSRF token using HMAC-like validation
    const expectedToken = await generateCsrfToken(userId)
    const isValid = token === expectedToken

    // Log validation attempt for audit
    await logCsrfValidation(userId, isValid)

    return new Response(
      JSON.stringify({ valid: isValid }),
      {
        status: isValid ? 200 : 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error validating CSRF token:', error)
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function generateCsrfToken(userId: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${userId}-${CSRF_TOKEN_SECRET}-${Date.now()}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

async function logCsrfValidation(userId: string, isValid: boolean): Promise<void> {
  // Create Supabase client with service role for audit logging
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  await supabase.from('audit_logs').insert({
    user_id: userId,
    event_type: isValid ? 'CSRF_VALIDATION_SUCCESS' : 'CSRF_VALIDATION_FAILURE',
    resource: 'security',
    resource_id: '',
    metadata: { valid: isValid },
    timestamp: new Date().toISOString()
  })
}
