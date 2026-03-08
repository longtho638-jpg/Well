# SMS Service Research Report - WellNexus

**Date:** 2026-03-08
**Purpose:** SMS Service Implementation Reference Patterns

---

## 1. Existing Email Service Pattern (RESEND)

### File: `supabase/functions/send-email/index.ts`

**Key Pattern:** Service role key auth + authenticated user fallback

```typescript
// Auth check
const authHeader = req.headers.get('Authorization');
const serviceKey = req.headers.get('x-service-key');
const expectedServiceKey = Deno.env.get('INTERNAL_SERVICE_KEY');

// Allow if valid service key (internal server-to-server)
const hasValidServiceKey = expectedServiceKey && serviceKey === expectedServiceKey;

// Allow if authenticated Supabase user
let isAuthenticatedUser = false;
if (!hasValidServiceKey && authHeader) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  isAuthenticatedUser = !!user;
}
```

**Email Payload via Resend:**
```typescript
const emailPayload = {
  from: 'WellNexus <noreply@wellnexus.vn>',
  to: Array.isArray(to) ? to : [to],
  subject,
  html: emailHtml,
  ...(replyTo && { reply_to: replyTo }),
};

await fetch(RESEND_API_ENDPOINT, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${resendApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(emailPayload),
});
```

**Reference:** Use same auth pattern + service role key for SMS webhook.

---

## 2. Stripe/PayOS Webhook Patterns (Signature Verification)

### Stripe Webhook (supabase/functions/stripe-webhook/index.ts)
```typescript
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const body = await req.text()
const signature = req.headers.get('stripe-signature') ?? ''

event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
```

### PayOS Webhook Signature (supabase/functions/_shared/vibe-payos/crypto.ts)
```typescript
// HMAC-SHA256 signature verification
export async function verifyWebhookSignature(
  data: Record<string, unknown>,
  signature: string,
  checksumKey: string,
): Promise<boolean> {
  const sortedData = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')

  const encoder = new TextEncoder()
  const keyData = encoder.encode(checksumKey)
  const dataBuffer = encoder.encode(sortedData)

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const computedSignature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer)
  const computedHex = Array.from(new Uint8Array(computedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return computedHex === signature
}
```

**Reference:** SMS provider likely similar HMAC pattern.

---

## 3. Secrets Management

### Environment Variables (Deno.env.get)

| Secret | Use Case |
|--------|----------|
| `SUPABASE_URL` | Supabase connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client |
| `SUPABASE_ANON_KEY` | User auth client |
| `STRIPE_SECRET_KEY` | Stripe SDK |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `RESEND_API_KEY` | Email service |
| `WEBHOOK_SECRET` | Custom webhook auth (x-webhook-secret header) |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | PayOS integration |
| `INTERNAL_SERVICE_KEY` | Internal service-to-service auth |

**Configuration via Supabase CLI:**
```bash
supabase secrets set SMS_API_KEY=<your-key>
supabase secrets set SMS_WEBHOOK_SECRET=<your-webhook-secret>
```

---

## 4. Rate Limiting Patterns

### Postgres-based (supabase/functions/check-rate-limit/index.ts)
```typescript
// Use PostgreSQL RPC for atomic rate limit check
const { data, error } = await supabase.rpc('check_rate_limit', {
  p_key: key,
  p_window_start: new Date(windowStart).toISOString(),
  p_max_requests: MAX_REQUESTS,
})
```

### Cloudflare KV-based (src/lib/rate-limiter-cloudflare.ts)
```typescript
// Sliding window algorithm with multiple windows
interface RateLimitState {
  windowStart: number
  requestCount: number
  burstCount: number
  dailyCount: number
  hourlyCount: number
}

// KV key pattern: `rl:rate_limits:<customerId>:minute:<windowKey>`
await kv.put(key, JSON.stringify(newState), { expirationTtl: ttl })
```

**Reference:** For SMS sending, prefer Postgres RPC for atomic counters.

---

## 5. Dunning Workflow Reference

### Stripe Dunning (supabase/functions/stripe-dunning/index.ts)

**Dunning Sequence:**
```typescript
const DUNNING_SEQUENCE = [
  { stage: 'initial', day: 0, template: 'dunning-initial' },
  { stage: 'reminder', day: 2, template: 'dunning-reminder' },
  { stage: 'final', day: 5, template: 'dunning-final' },
  { stage: 'cancel_notice', day: 10, template: 'dunning-cancel' },
]
```

**Email send via Edge Function:**
```typescript
await supabase.functions.invoke('send-email', {
  body: {
    to: userData.email,
    subject: getDunningEmailSubject(template, amount),
    templateType: template,
    data: { ... },
  },
})
```

**Database Table Used:**
- `dunning_events` - Track dunning stages
- `failed_webhooks` - Retry queue
- `audit_logs` - Compliance logging

---

## 6. CORS & Security Headers

### CORS (supabase/functions/_shared/cors.ts)
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}
```

### Security Headers (supabase/config.security.toml)
```toml
[api]
extra_headers = [
  "X-Content-Type-Options: nosniff",
  "X-Frame-Options: DENY",
  "X-XSS-Protection: 1; mode=block",
  "Referrer-Policy: strict-origin-when-cross-origin"
]
```

---

## 7. Twilio SMS Integration - Supply Chain

### Twilio Setup in Supabase (supabase/config.toml)
```toml
[auth.sms.twilio]
enabled = false
account_sid = ""
message_service_sid = ""
auth_token = "env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)"
```

**Note:** Supabase has built-in Twilio support for auth SMS (OTP), but manual integration needed for billing notifications.

### Twilio API Pattern (Manual Integration)
```typescript
// Twilio Node.js SDK pattern (Deno compatible)
const TWILIO_API = 'https://api.twilio.com/2010-04-01/Accounts'

interface TwilioMessage {
  To: string
  From: string
  Body: string
}

await fetch(`${TWILIO_API}/${TWILIO_ACCOUNT_SID}/Messages.json`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    To: to,
    From: from,
    Body: message,
  }),
})
```

**Response parsing:**
```typescript
const data = await response.json()
if (data.error_code) {
  throw new Error(data.message)
}
return { sid: data.sid, status: data.status }
```

---

## 8. SMS Provider Recommendations

### Option A: Twilio (Standard)
- Pro: Most reliable, global coverage, well-documented
- Con: Cost via Twilio pricing
- Use case: Production dunning/checkout notifications

### Option B: Vonage (RingCentral)
- Pro: Lower cost, similar reliability
- Con: Slightly less documentation

### Option C: MessageBird
- Pro: API-first, good for developers
- Con: Smaller ecosystem

### For WellNexus:
**Recommendation:** Twilio for production due to:
1. Existing Stripe integration familiarity
2. Well-documented error handling
3. Supabase community patterns

---

## 9. Slash Commands /cook Pattern

**All Edge Functions use Deno.land std@0.168.0/http/server.ts** - no framework dependencies.

**Minimal template:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Auth
  const serviceKey = req.headers.get('x-service-key')
  if (serviceKey !== Deno.env.get('INTERNAL_SERVICE_KEY')) {
    return unauthorizedResponse()
  }

  // Logic
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  // ... rest of implementation
})

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
```

---

## 10. Unresolved Questions

| Question | Priority |
|----------|----------|
| 1. Which SMS provider to use? Twilio vs alternatives? | HIGH |
| 2. Expected SMS volume per dunning stage? | MEDIUM |
| 3. Do we need SMS-read receipts tracking? | LOW |
| 4. Rate limits per customer for SMS sending? | HIGH |
| 5. Should SMS be sync (await) or async (fire-and-forget)? | MEDIUM |
| 6. Error handling: retry SMS on failure? | HIGH |
| 7. Cost budgeting for SMS notifications? | MEDIUM |
| 8. Twilio sandbox vs production phone number? | HIGH |

---

## 11. Implementation Checklist

- [ ] Create `supabase/functions/send-sms/index.ts`
- [ ] Add `SMS_API_KEY`, `SMS_SENDER`, `SMS_WEBHOOK_SECRET` secrets
- [ ] Implement Twilio client (similar to Resend pattern)
- [ ] Add rate limiting (Postgres or KV)
- [ ] Create SMS templates for dunning stages
- [ ] Configure CORS headers
- [ ] Test with Twilio sandbox
- [ ] Deploy to production
- [ ] Configure Twilio webhook (if using delivery receipts)

---

**Report generated:** 2026-03-08
**Researcher:** a477c5db3fa9ef160 (researcher)
