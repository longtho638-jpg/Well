# Phase 06: Security Headers & CSP Hardening

## Context

Implement production-grade security headers and Content Security Policy (CSP) hardening to protect WellNexus from common web vulnerabilities (XSS, clickjacking, MIME sniffing, etc.). This is the final validation phase ensuring enterprise-level security posture.

**Current State:**
- Basic security headers from Vercel defaults
- No custom CSP configuration
- Missing HSTS, X-Frame-Options optimization
- No Subresource Integrity (SRI) for CDN resources

**Target State:**
- A+ rating on securityheaders.com
- Strict CSP with nonce-based inline scripts
- HSTS with long max-age and preload
- Complete security header suite
- SRI hashes for critical CDN resources

## Requirements

### Functional Requirements
- **FR-01:** HSTS header with 1-year max-age and preload directive
- **FR-02:** CSP with nonce for inline scripts, allowlist for trusted domains
- **FR-03:** X-Frame-Options, X-Content-Type-Options, Referrer-Policy headers
- **FR-04:** Permissions-Policy (formerly Feature-Policy) to restrict APIs
- **FR-05:** SRI hashes for Google Fonts and critical CDN assets

### Non-Functional Requirements
- **NFR-01:** securityheaders.com rating A or A+
- **NFR-02:** CSP violations logged (report-only mode first, then enforce)
- **NFR-03:** No breakage of third-party integrations (Supabase, PayOS)
- **NFR-04:** Headers apply to all routes (including SPA routes)

## Architecture

### Security Headers Overview

```
┌─────────────────────────────────────────────────────┐
│ Security Headers Stack                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 1. HSTS (Transport Security)                        │
│    → Force HTTPS for 1 year + preload               │
│                                                      │
│ 2. CSP (Content Security Policy)                    │
│    → Nonce-based inline scripts                     │
│    → Allowlist: Supabase, PayOS, Google Fonts       │
│                                                      │
│ 3. X-Frame-Options                                  │
│    → Prevent clickjacking (DENY)                    │
│                                                      │
│ 4. X-Content-Type-Options                           │
│    → Prevent MIME sniffing (nosniff)                │
│                                                      │
│ 5. Referrer-Policy                                  │
│    → Limit referrer data leakage                    │
│                                                      │
│ 6. Permissions-Policy                               │
│    → Restrict camera, microphone, geolocation       │
└─────────────────────────────────────────────────────┘
```

### CSP Directives

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}' https://cdn.jsdelivr.net;
  style-src 'self' 'nonce-{random}' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co https://api.payos.vn;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

### File Structure

```
vercel.json                     # Security headers configuration
src/
├── utils/
│   └── security/
│       └── csp-nonce.ts       # CSP nonce generation
└── middleware/
    └── security-headers.ts     # Runtime header injection (if needed)

scripts/
└── test-security-headers.sh    # Automated header testing
```

## Implementation Steps

### Step 1: Configure Security Headers in Vercel

**File:** `vercel.json`

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        },
        {
          "key": "X-DNS-Prefetch-Control",
          "value": "on"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://api-merchant.payos.vn https://api.payos.vn; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, nofollow"
        }
      ]
    }
  ]
}
```

**Note:** The CSP above uses `'unsafe-inline'` as a starting point. Phase 2 of this step will migrate to nonce-based CSP.

### Step 2: Implement CSP Nonce (Advanced - Optional)

**File:** `src/utils/security/csp-nonce.ts`

```typescript
/**
 * Generate random nonce for CSP
 * NOTE: This requires server-side rendering or Edge Functions
 * For static SPA, we use 'unsafe-inline' in CSP
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Add nonce to inline scripts
 * Usage: <script nonce={nonce}>...</script>
 */
export function applyNonceToScripts(nonce: string) {
  document.querySelectorAll('script[data-csp]').forEach((script) => {
    script.setAttribute('nonce', nonce);
  });
}
```

**Note:** For Vite SPA without SSR, nonce-based CSP is complex. We'll use `'unsafe-inline'` for now and consider upgrading to SSR in future for stricter CSP.

### Step 3: Add Subresource Integrity (SRI) for CDN

**File:** `index.html` (add SRI hashes)

```html
<head>
  <!-- Google Fonts with SRI -->
  <link
    rel="preconnect"
    href="https://fonts.googleapis.com"
  />
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
    crossorigin="anonymous"
  />

  <!-- If using CDN for libraries, add SRI -->
  <!-- Example:
  <script
    src="https://cdn.jsdelivr.net/npm/package@version/dist/file.js"
    integrity="sha384-HASH_HERE"
    crossorigin="anonymous"
  ></script>
  -->
</head>
```

**Generate SRI Hash:**

```bash
# For external scripts, generate SRI hash:
curl https://cdn.example.com/script.js | openssl dgst -sha384 -binary | openssl base64 -A

# Output: sha384-{HASH}
```

### Step 4: Test Security Headers Script

**File:** `scripts/test-security-headers.sh`

```bash
#!/bin/bash

URL="https://wellnexus.vn"

echo "🔒 Testing Security Headers for $URL"
echo ""

# Test HSTS
echo "1. HSTS (Strict-Transport-Security):"
curl -sI "$URL" | grep -i "strict-transport-security" || echo "❌ Missing HSTS"

# Test X-Frame-Options
echo ""
echo "2. X-Frame-Options:"
curl -sI "$URL" | grep -i "x-frame-options" || echo "❌ Missing X-Frame-Options"

# Test X-Content-Type-Options
echo ""
echo "3. X-Content-Type-Options:"
curl -sI "$URL" | grep -i "x-content-type-options" || echo "❌ Missing X-Content-Type-Options"

# Test Referrer-Policy
echo ""
echo "4. Referrer-Policy:"
curl -sI "$URL" | grep -i "referrer-policy" || echo "❌ Missing Referrer-Policy"

# Test CSP
echo ""
echo "5. Content-Security-Policy:"
curl -sI "$URL" | grep -i "content-security-policy" || echo "❌ Missing CSP"

# Test Permissions-Policy
echo ""
echo "6. Permissions-Policy:"
curl -sI "$URL" | grep -i "permissions-policy" || echo "❌ Missing Permissions-Policy"

echo ""
echo "✅ Security headers test complete!"
echo ""
echo "📊 Full analysis: https://securityheaders.com/?q=$URL&followRedirects=on"
```

**Make executable:**

```bash
chmod +x scripts/test-security-headers.sh
```

### Step 5: Add CSP Violation Reporting (Optional)

**File:** `vercel.json` (add report-uri to CSP)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy-Report-Only",
          "value": "default-src 'self'; report-uri https://your-csp-report-endpoint.com/report"
        }
      ]
    }
  ]
}
```

**Note:** Use `Content-Security-Policy-Report-Only` first to collect violations without blocking. After validation, switch to `Content-Security-Policy` (enforcing mode).

### Step 6: Update NPM Scripts

**File:** `package.json`

```json
{
  "scripts": {
    "security:test": "bash scripts/test-security-headers.sh",
    "security:analyze": "open https://securityheaders.com/?q=https://wellnexus.vn"
  }
}
```

### Step 7: Add CORS Configuration for API Routes

**File:** `src/api/cors-config.ts` (if using custom API routes)

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://wellnexus.vn',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

export function handleCORS(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
}
```

### Step 8: Configure Vercel Environment

**File:** `.env.production` (add CSP domains)

```bash
# CSP Allowed Domains
VITE_CSP_DOMAINS="https://*.supabase.co https://api.payos.vn https://fonts.googleapis.com https://fonts.gstatic.com"
```

### Step 9: Add Security Header Documentation

**File:** `docs/security-headers.md`

```markdown
# Security Headers

## Implemented Headers

### 1. Strict-Transport-Security (HSTS)
- **Value:** `max-age=31536000; includeSubDomains; preload`
- **Purpose:** Force HTTPS for 1 year, include subdomains, eligible for browser preload list
- **Risk:** None (HTTPS already enforced)

### 2. X-Frame-Options
- **Value:** `DENY`
- **Purpose:** Prevent clickjacking attacks by disallowing iframe embedding
- **Risk:** Cannot embed WellNexus in iframes (intentional)

### 3. X-Content-Type-Options
- **Value:** `nosniff`
- **Purpose:** Prevent MIME type sniffing
- **Risk:** None

### 4. Referrer-Policy
- **Value:** `strict-origin-when-cross-origin`
- **Purpose:** Send full referrer for same-origin, origin only for cross-origin HTTPS
- **Risk:** Analytics may see less referrer data (acceptable)

### 5. Content-Security-Policy (CSP)
- **Directives:**
  - `default-src 'self'` - Only load resources from same origin by default
  - `script-src 'self' 'unsafe-inline'` - Allow inline scripts (TODO: migrate to nonce)
  - `connect-src` - Allowlist Supabase, PayOS APIs
  - `style-src` - Allow Google Fonts
- **Purpose:** Prevent XSS attacks
- **Risk:** May block unauthorized scripts (intentional)

### 6. Permissions-Policy
- **Value:** `camera=(), microphone=(), geolocation=()`
- **Purpose:** Disable sensitive browser APIs
- **Risk:** None (app doesn't use camera/mic/location)

## Testing

```bash
# Test headers locally
npm run security:test

# Analyze with SecurityHeaders.com
npm run security:analyze
```

## Upgrading CSP to Nonce-based

Current CSP uses `'unsafe-inline'` for scripts/styles. To upgrade:

1. Implement SSR or Edge Functions for nonce generation
2. Update CSP to use `'nonce-{random}'` instead of `'unsafe-inline'`
3. Add nonce attribute to all inline `<script>` and `<style>` tags
4. Test thoroughly to ensure no breakage

## HSTS Preload Submission

After 6 months of successful HSTS operation:

1. Visit https://hstspreload.org/
2. Submit `wellnexus.vn`
3. Monitor for inclusion in browser preload lists
```

### Step 10: Add Security Checklist to CI/CD

**File:** `.github/workflows/security.yml`

```yaml
name: Security Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  security-headers:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Test Security Headers (Preview)
        run: |
          # Wait for Vercel preview deployment
          sleep 30

          # Get preview URL from Vercel
          PREVIEW_URL=$(vercel inspect --token ${{ secrets.VERCEL_TOKEN }} --json | jq -r '.url')

          # Test headers
          echo "Testing headers on $PREVIEW_URL"

          # HSTS
          curl -sI "https://$PREVIEW_URL" | grep "strict-transport-security" || exit 1

          # X-Frame-Options
          curl -sI "https://$PREVIEW_URL" | grep "x-frame-options" || exit 1

          # CSP
          curl -sI "https://$PREVIEW_URL" | grep "content-security-policy" || exit 1

          echo "✅ All security headers present"
```

## Verification & Success Criteria

### Automated Testing

```bash
# Run security header tests
npm run security:test

# Expected output:
# 🔒 Testing Security Headers for https://wellnexus.vn
#
# 1. HSTS (Strict-Transport-Security):
# strict-transport-security: max-age=31536000; includeSubDomains; preload
#
# 2. X-Frame-Options:
# x-frame-options: DENY
#
# 3. X-Content-Type-Options:
# x-content-type-options: nosniff
#
# 4. Referrer-Policy:
# referrer-policy: strict-origin-when-cross-origin
#
# 5. Content-Security-Policy:
# content-security-policy: default-src 'self'; ...
#
# 6. Permissions-Policy:
# permissions-policy: camera=(), microphone=(), ...
#
# ✅ Security headers test complete!
```

### SecurityHeaders.com Audit

```bash
# Open automated analysis
npm run security:analyze

# Manual: Visit https://securityheaders.com/?q=https://wellnexus.vn

# Target: A or A+ rating
```

### Manual Verification

1. **HSTS Test:**
   ```bash
   curl -sI https://wellnexus.vn | grep -i strict-transport-security

   # Expected: max-age=31536000; includeSubDomains; preload
   ```

2. **CSP Test:**
   - Open Chrome DevTools → Console
   - Verify no CSP violation errors
   - If violations exist, check if they're from expected sources

3. **X-Frame-Options Test:**
   ```html
   <!-- Create test page with iframe -->
   <iframe src="https://wellnexus.vn"></iframe>

   <!-- Expected: Refused to display in frame (Console error) -->
   ```

4. **Third-Party Integration Test:**
   - Test Supabase auth (ensure not blocked by CSP)
   - Test PayOS payment (ensure API calls work)
   - Test Google Fonts (ensure styles load)

5. **Browser Compatibility Test:**
   - Chrome: Check headers in Network tab
   - Firefox: Check headers in Network tab
   - Safari: Check headers in Web Inspector

### Success Criteria Checklist

- [ ] HSTS header with 1-year max-age and preload
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy restricts camera, mic, location
- [ ] CSP includes Supabase, PayOS, Google Fonts in allowlist
- [ ] SecurityHeaders.com rating A or A+
- [ ] No CSP violations in production
- [ ] Supabase auth works (not blocked by CSP)
- [ ] PayOS payments work (not blocked by CSP)
- [ ] Google Fonts load correctly
- [ ] `vercel.json` headers configuration committed
- [ ] Security header test script working
- [ ] Documentation updated
- [ ] CI/CD includes security header validation

### CSP Violation Monitoring

```javascript
// Add CSP violation listener (optional)
window.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', {
    blockedURI: e.blockedURI,
    violatedDirective: e.violatedDirective,
    originalPolicy: e.originalPolicy,
  });

  // Report to error tracking (Sentry, etc.)
  // reportError(new Error('CSP Violation'), { extra: { ...e } });
});
```

## Rollback Plan

1. **Remove custom headers:**
   ```json
   // vercel.json
   {
     "headers": []
   }
   ```

2. **Deploy without headers:**
   ```bash
   git commit -m "Rollback: Remove security headers"
   git push origin main
   ```

3. **Gradual rollback (if partial issue):**
   - Comment out problematic header (e.g., CSP)
   - Keep other headers active
   - Debug and re-enable incrementally

4. **Emergency bypass (CSP only):**
   ```json
   // Temporarily set CSP to report-only mode
   {
     "key": "Content-Security-Policy-Report-Only",
     "value": "..."
   }
   ```

## Next Steps

After Phase 6 completion:
- **Submit HSTS Preload:** https://hstspreload.org/
- **Monitor CSP Violations:** Set up reporting endpoint
- **Consider SSR Migration:** For nonce-based CSP (stricter security)
- **Quarterly Security Audit:** Re-run SecurityHeaders.com analysis
- **Update CSP:** Add new domains as needed for future integrations

---

**Estimated Effort:** 1 hour
**Dependencies:** Vercel deployment, curl (for testing)
**Risk Level:** Medium (CSP can break functionality if misconfigured - test thoroughly)

## Final Deployment Checklist

Before marking Phase 6 (and entire upgrade) complete:

- [ ] All 6 phases completed and verified
- [ ] Security headers live on production
- [ ] SecurityHeaders.com rating A or A+
- [ ] Lighthouse scores: Performance 90+, PWA 90+, SEO 90+
- [ ] All 230+ existing tests passing
- [ ] i18n validation passing (0 missing keys)
- [ ] PayOS webhooks verified with production secret
- [ ] PWA installable on iOS, Android, Desktop
- [ ] Admin dashboard accessible to admins only
- [ ] Browser verification: No console errors in production
- [ ] 48-hour monitoring period post-deployment
- [ ] Rollback plan documented and ready

---

**Phase 6 Status:** Ready for Execution
**Overall Upgrade Status:** Ready for Sequential Execution (Phase 1 → 6)
