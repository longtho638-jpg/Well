# PayOS Payment Integration Setup

Guide for connecting a PayOS account to WellNexus.

## Architecture

```
Browser → Supabase Edge Function → PayOS API
                ↓ (webhook)
         payos-webhook → agent-reward (commission)
                       → send-email (confirmation)
```

- **No PayOS credentials on the frontend** — all API calls proxy through Supabase Edge Functions
- PayOS webhook posts directly to `payos-webhook` Edge Function
- Commission distribution triggers automatically via `agent-reward` on successful payment

## 1. PayOS Account Setup

### Sandbox (Testing)

1. Register at [payos.vn](https://payos.vn)
2. Create a test merchant in Dashboard > Tích hợp
3. Copy credentials from Dashboard > Tích hợp > Thông tin API:
   - **Client ID** — identifies your merchant
   - **API Key** — authenticates API requests
   - **Checksum Key** — signs/verifies webhook payloads (HMAC-SHA256)

### Production

1. Complete merchant verification (KYC) in PayOS Dashboard
2. Switch to production environment
3. Copy production credentials (different from sandbox)
4. Update Supabase secrets with production values

## 2. Supabase Secrets Configuration

```bash
# Set PayOS credentials
supabase secrets set PAYOS_CLIENT_ID="your-client-id"
supabase secrets set PAYOS_API_KEY="your-api-key"
supabase secrets set PAYOS_CHECKSUM_KEY="your-checksum-key"

# Set webhook secret for commission distribution
supabase secrets set WEBHOOK_SECRET="your-random-secret"

# Verify secrets are set
supabase secrets list
```

## 3. Webhook Configuration

### PayOS Dashboard

1. Go to Dashboard > Tích hợp > Cấu hình Webhook
2. Set webhook URL:
   - **Production**: `https://<project-ref>.supabase.co/functions/v1/payos-webhook`
   - **Sandbox**: same URL (the function handles both)
3. No authentication header needed — PayOS uses HMAC-SHA256 signature verification

### Webhook Verification Flow

1. PayOS sends `{ data: WebhookData, signature: string }`
2. Edge Function sorts `data` fields alphabetically, joins as `key=value&key=value`
3. Computes HMAC-SHA256 with `PAYOS_CHECKSUM_KEY`
4. Constant-time comparison prevents timing attacks
5. On valid signature: updates order status, triggers email + commission

### PayOS Status Codes

| Code | Meaning | Order Status |
|------|---------|-------------|
| `00` | Payment successful | `paid` |
| `01` | Payment cancelled | `cancelled` |
| Other | Pending/processing | `pending` |

## 4. Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| `payos-create-payment` | Create payment link | User JWT |
| `payos-get-payment` | Check payment status | User JWT + ownership |
| `payos-cancel-payment` | Cancel payment | User JWT + ownership |
| `payos-webhook` | Receive PayOS notifications | HMAC signature |

### Deploy Edge Functions

```bash
supabase functions deploy payos-create-payment
supabase functions deploy payos-get-payment
supabase functions deploy payos-cancel-payment
supabase functions deploy payos-webhook
supabase functions deploy agent-reward
```

## 5. Payment Flow

1. User selects "Chuyển khoản" payment method on checkout
2. Frontend generates `orderCode` (timestamp-based, 10 digits)
3. `payos-create-payment` creates payment link via PayOS API, stores order in DB
4. QR modal displays QR code, polls status every 3 seconds (10-minute timeout)
5. User scans QR with banking app and pays
6. PayOS sends webhook → `payos-webhook` verifies signature → updates order
7. If paid: sends confirmation email + triggers commission distribution via `agent-reward`
8. Frontend detects `PAID` status → creates transaction record → navigates to success page

## 6. Commission Distribution (on payment)

When PayOS confirms payment (`code: '00'`), the webhook invokes `agent-reward` which:

1. **Direct Commission**: 21% (CTV rank) or 25% (Khoi Nghiep+) credited to buyer's wallet
2. **Nexus Points**: 1 point per 100,000 VND
3. **F1 Sponsor Bonus**: 8% to sponsor (requires Dai Su rank or higher)
4. **Rank Upgrade Check**: evaluates dynamic rank thresholds from `policy_config`

Rates are configurable via `policy_config` table (`global_policy` key).

## 7. Testing Checklist

### Sandbox Testing

- [ ] Create payment link — verify QR code displays in modal
- [ ] Complete test payment — verify order status updates to `paid`
- [ ] Verify webhook signature validation (test with invalid signature → 401)
- [ ] Verify idempotency (send same webhook twice → second is ignored)
- [ ] Verify commission distribution triggers on payment
- [ ] Cancel payment — verify order status updates to `cancelled`
- [ ] Timeout — verify 10-minute expiry shows failure state

### Production Readiness

- [ ] Production PayOS credentials set in Supabase secrets
- [ ] Webhook URL configured in PayOS Dashboard (production)
- [ ] `WEBHOOK_SECRET` set for agent-reward
- [ ] Edge Functions deployed to production
- [ ] Test with real bank transfer (small amount)
- [ ] Verify commission credited to wallet
- [ ] Verify confirmation email received

### Edge Cases

- [ ] Multiple rapid payments — no duplicate commissions (idempotency check)
- [ ] Network failure during webhook — PayOS retries webhook delivery
- [ ] User closes QR modal — payment still processes if user already paid
- [ ] Order not found — returns 404, logged to audit_logs

## 8. Troubleshooting

| Issue | Check |
|-------|-------|
| Webhook 401 | Verify `PAYOS_CHECKSUM_KEY` matches PayOS Dashboard |
| No commission | Check `WEBHOOK_SECRET` is set, verify `agent-reward` function deployed |
| QR not showing | Check `PAYOS_CLIENT_ID` and `PAYOS_API_KEY` are correct |
| Payment stuck pending | Check PayOS Dashboard for transaction status, verify webhook URL |
| Email not sent | Check `RESEND_API_KEY` is set in Supabase secrets |

## 9. Environment Reference

```bash
# Required Supabase Secrets (server-side)
PAYOS_CLIENT_ID        # PayOS merchant client ID
PAYOS_API_KEY          # PayOS API authentication key
PAYOS_CHECKSUM_KEY     # HMAC-SHA256 signing key for webhooks
WEBHOOK_SECRET         # Agent-reward webhook authentication
RESEND_API_KEY         # Email service (Resend.com)

# Auto-injected by Supabase
SUPABASE_URL           # Project URL
SUPABASE_ANON_KEY      # Anonymous key (for authenticated user calls)
SUPABASE_SERVICE_ROLE_KEY  # Admin key (for webhook/agent-reward)
```
