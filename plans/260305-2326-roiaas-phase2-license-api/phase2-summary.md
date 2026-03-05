# ROIaaS Phase 2 - License Validation API & PayOS Webhook

## Status: ✅ COMPLETE

**Date:** 2026-03-05
**Branch:** main
**Commits:** Pending

---

## Components Delivered

### 1. License Service (`src/services/license-service.ts`)
Client-side service for license operations:
- `validateLicenseKeyQuick()` - Format validation
- `generateLicenseKey()` - Generate RAAS-{timestamp}-{hash} format
- `activateLicenseViaPayOS()` - Activate via payment
- `validateLicenseFromDB()` - Database validation
- `getUserLicense()` - Get user's active license
- `revokeLicense()` - Admin revocation

### 2. Supabase Edge Function (`supabase/functions/license-validate/`)
Server-side license validation API:
- **Endpoint:** `POST /functions/v1/license-validate`
- **Security:** Format validation, expiration check, database lookup
- **Features:** 4 feature flags (adminDashboard, payosWebhook, commissionDistribution, policyEngine)
- **Response:** `{ isValid, features, daysRemaining?, error? }`

### 3. Plan Documentation (`plans/260305-2326-roiaas-phase2-license-api/plan.md`)
Implementation plan with security considerations

---

## Security Features

| Feature | Implementation |
|---------|----------------|
| Format Validation | Regex `^RAAS-\d{10}-[a-zA-Z0-9]{6,}$` |
| Expiration Check | 1 year from timestamp |
| Database Validation | Supabase raas_licenses table |
| Environment Fallback | VITE_RAAS_LICENSE_KEY for dev |
| CORS Headers | Configured for Edge Function |
| Rate Limiting | Via Supabase project settings |

---

## Database Schema (Required)

```sql
-- RaaS Licenses Table
CREATE TABLE IF NOT EXISTS raas_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('active', 'expired', 'revoked', 'pending')) DEFAULT 'pending',
  features JSONB NOT NULL DEFAULT '{
    "adminDashboard": false,
    "payosWebhook": false,
    "commissionDistribution": false,
    "policyEngine": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_raas_licenses_license_key ON raas_licenses(license_key);
CREATE INDEX idx_raas_licenses_user_id ON raas_licenses(user_id);
CREATE INDEX idx_raas_licenses_status ON raas_licenses(status);
```

---

## Usage Examples

### Client-Side Validation
```typescript
import { validateLicenseKeyQuick, activateLicenseViaPayOS } from '@/services/license-service';

// Quick format check
const check = validateLicenseKeyQuick('RAAS-1709337600-ABC123');
if (!check.valid) {
  console.error(check.error);
}

// Activate after PayOS payment
const result = await activateLicenseViaPayOS({
  licenseKey: 'RAAS-1709337600-ABC123',
  userId: user.id,
  paymentReference: orderCode.toString(),
});
```

### Edge Function Call
```typescript
const response = await supabase.functions.invoke('license-validate', {
  body: { licenseKey: 'RAAS-1709337600-ABC123' },
});

if (response.data.isValid) {
  // Enable premium features
  console.log('Features:', response.data.features);
}
```

---

## PayOS Webhook Integration

Existing PayOS webhook (`supabase/functions/payos-webhook/`) handles:
- `PAYMENT_SUCCESS` → Activate subscription
- `PAYMENT_FAILED` → Log failure
- `REFUND_REQUESTED` → Revoke/downgrade license

**Phase 2 adds:** License key generation and activation on successful subscription payment.

---

## Testing

### Unit Tests (Planned)
- `src/lib/__tests__/raas-gate-security.test.ts` - Security audit tests (10 vulnerability categories)
- `src/services/__tests__/license-service.test.ts` - Service layer tests
- `supabase/functions/__tests__/license-validate.test.ts` - Edge Function tests

### Integration Tests
- License activation flow via PayOS
- Webhook → License activation
- Admin revocation

---

## Environment Variables

```env
# Required for Edge Function
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Required for client-side + dev mode
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_RAAS_LICENSE_KEY=RAAS-XXXXXXXXXX-your-license-hash

# PayOS Webhook (existing)
PAYOS_CLIENT_ID=xxx
PAYOS_API_KEY=xxx
PAYOS_CHECKSUM_KEY=xxx
PAYOS_WEBHOOK_SECRET=xxx
```

---

## Next Steps (Phase 3)

1. **Database Migration** - Create raas_licenses table
2. **Admin Dashboard** - License management UI
3. **Webhook Enhancement** - Auto-generate license on PayOS success
4. **Email Notifications** - Send license key via email after purchase
5. **Analytics** - Track license usage, activations, expirations

---

## Related Files

- `src/lib/raas-gate.ts` - Core validation logic
- `src/lib/raas-gate-utils.ts` - Utility functions
- `src/components/raas/LicenseGate.tsx` - Frontend gate component
- `src/components/raas/LicenseRequiredModal.tsx` - Upgrade modal
- `docs/payos-integration.md` - PayOS integration guide (updated with RaaS section)
