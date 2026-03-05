# License Guard API Contracts - ROIaaS Phase 1

## Overview
RaaS License Gate controls access to premium features in production. Development mode bypasses all gates.

## License Format

```
RAAS-{timestamp}-{hash}
Example: RAAS-1709337600-a1b2c3d4e5f6
```

- **timestamp**: Unix timestamp (10 digits)
- **hash**: Alphanumeric string (6+ characters)
- **Validity**: 1 year from timestamp

## Core API

### validateRaasLicense()

```typescript
/**
 * Validate RaaS license key format and expiration
 */
export function validateRaasLicense(): LicenseValidationResult

interface LicenseValidationResult {
  isValid: boolean;
  license?: string;
  expiresAt?: number;           // Timestamp
  features: {
    adminDashboard: boolean;
    payosWebhook: boolean;
    commissionDistribution: boolean;
    policyEngine: boolean;
  };
  error?: string;
}
```

**Response Examples:**

```typescript
// Valid license
{
  isValid: true,
  license: 'RAAS-1709337600-a1b2c3',
  expiresAt: 1740873600000,
  features: {
    adminDashboard: true,
    payosWebhook: true,
    commissionDistribution: true,
    policyEngine: true
  }
}

// Missing license (dev)
{
  isValid: true,  // true in development
  features: { all: true }
}

// Missing license (production)
{
  isValid: false,
  features: { all: false },
  error: 'RAAS_LICENSE_KEY not configured'
}
```

### Feature Gates

```typescript
// Check if admin dashboard is accessible
export function isAdminDashboardEnabled(): boolean

// Check if PayOS webhook should process production events
export function isPayosWebhookEnabled(): boolean

// Middleware guard for admin routes
export function checkRaasLicenseGuard(): boolean
```

### License Status for UI

```typescript
/**
 * Get current license status for UI display
 */
export function getLicenseStatus(): {
  isActive: boolean;
  expiresAt?: number;
  daysRemaining?: number;
}
```

**Example:**
```typescript
{
  isActive: true,
  expiresAt: 1740873600000,
  daysRemaining: 365
}
```

### Performance Optimization

```typescript
/**
 * Get cached validation result (for hot paths)
 */
export function getCachedLicenseResult(): LicenseValidationResult

/**
 * Clear cached result (for testing or license refresh)
 */
export function clearCachedLicenseResult(): void
```

## Usage Examples

### React Component (Admin Dashboard)

```typescript
import { isAdminDashboardEnabled } from '@/lib/raas-gate';

function AdminDashboard() {
  const isEnabled = isAdminDashboardEnabled();

  if (!isEnabled) {
    return <Navigate to="/" replace />;
  }

  return <AdminLayout>...</AdminLayout>;
}
```

### Route Guard (AdminRoute.tsx)

```typescript
import { checkRaasLicenseGuard } from '@/lib/raas-gate';
import { evaluateRouteGuard, checkAdminAccess } from '@/lib/vibe-auth';

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isInitialized } = useStore();

  // Check RaaS license
  const licenseValid = checkRaasLicenseGuard();

  // Check auth + admin role
  const verdict = evaluateRouteGuard(
    { requireAuth: true, requiredRoles: ['admin', 'super_admin'] },
    user,
    isAuthenticated
  );

  const isAdmin = verdict === 'allow' || checkAdminAccess(user, getAdminEmails());

  if (!licenseValid) {
    authLogger.warn('Access denied: RaaS license not valid');
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
```

### PayOS Webhook (Edge Function)

```typescript
// supabase/functions/_shared/vibe-payos/webhook-pipeline.ts
function isPayosWebhookEnabled(): boolean {
  const licenseKey = Deno.env.get('RAAS_LICENSE_KEY');
  if (!licenseKey) {
    return Deno.env.get('DENO_DEPLOYMENT_ID') === undefined; // Dev mode
  }
  const LICENSE_PATTERN = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/;
  return LICENSE_PATTERN.test(licenseKey);
}

export async function handlePayOSWebhook(req: Request, callbacks: WebhookCallbacks) {
  // RaaS License Gate
  if (!isPayosWebhookEnabled()) {
    console.error('[vibe-payos] RaaS License Gate: PayOS webhook disabled');
    return jsonResponse({ error: 'PayOS webhook disabled - invalid RaaS license' }, 403);
  }

  // ... continue webhook processing
}
```

## Environment Variables

### Frontend (Vite)

```env
# .env.local
VITE_RAAS_LICENSE_KEY=RAAS-1709337600-a1b2c3d4e5f6
```

### Backend (Supabase Edge Functions)

```bash
# Set via Supabase CLI
supabase secrets set RAAS_LICENSE_KEY="RAAS-1709337600-a1b2c3d4e5f6"
```

### GitHub Secrets (CI/CD)

```env
# GitHub Actions → Settings → Secrets
VITE_RAAS_LICENSE_KEY=RAAS-1709337600-a1b2c3d4e5f6
```

## Development vs Production

| Mode | License Required | Features |
|------|------------------|----------|
| **Development** | ❌ No | All features enabled |
| **Production** | ✅ Yes | Features gated by license |

**Detection:**
```typescript
function isDevelopment(): boolean {
  if (import.meta.env?.DEV) return true;
  if (process.env?.NODE_ENV === 'development') return true;
  return false;
}
```

## Error Handling

```typescript
try {
  const result = validateRaasLicense();
  if (!result.isValid) {
    // Show license warning UI
    console.warn('License validation failed:', result.error);
  }
} catch (error) {
  // Log unexpected errors
  console.error('License validation error:', error);
}
```

## Testing

```typescript
// src/lib/__tests__/raas-gate-integration.test.ts
describe('RaaS License Validation', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_RAAS_LICENSE_KEY', 'RAAS-1709337600-a1b2c3');
  });

  it('should validate license format', () => {
    const result = validateRaasLicense();
    expect(result.isValid).toBe(true);
    expect(result.features.adminDashboard).toBe(true);
  });

  it('should reject invalid format', () => {
    vi.stubEnv('VITE_RAAS_LICENSE_KEY', 'INVALID-KEY');
    const result = validateRaasLicense();
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid license format');
  });

  it('should allow development mode without license', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('VITE_RAAS_LICENSE_KEY', '');
    const result = validateRaasLicense();
    expect(result.isValid).toBe(true);
  });
});
```

## Related Files

```
src/lib/raas-gate.ts              # Core validation logic
src/lib/raas-gate-utils.ts        # Helper utilities
src/lib/__tests__/raas-gate*.test.ts
src/components/AdminRoute.tsx     # Route protection
supabase/functions/_shared/vibe-payos/webhook-pipeline.ts  # PayOS gate
```

## Security Considerations

1. **Never expose service_role_key**: License validation uses public keys only
2. **Webhook secret required**: PayOS webhook validates `x-webhook-secret` header
3. **Idempotency guard**: Commission distribution checks for duplicate processing
4. **Cached results**: Use `getCachedLicenseResult()` in hot paths to prevent env var lookup overhead
