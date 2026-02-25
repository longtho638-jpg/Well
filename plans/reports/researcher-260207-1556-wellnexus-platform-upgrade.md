# WellNexus Platform Upgrade Research Report

**Date:** 2026-02-07
**Project:** WellNexus Distributor Portal
**Context:** /Users/macbookprom1/Well
**Status:** Complete

---

## Executive Summary

Comprehensive research on 6 critical topics for WellNexus platform upgrade: PayOS security, PWA implementation, i18n best practices, SPA SEO, Vercel security headers, and admin dashboard design patterns compatible with Aura Elite aesthetic.

---

## 1. PayOS Security Hardening

### Webhook Signature Verification (CRITICAL)

**Core Implementation Pattern:**
```typescript
import crypto from 'crypto';

function verifyPayOSWebhook(
  payload: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  // Concatenate timestamp + JSON payload
  const signaturePayload = timestamp + payload;

  // Generate HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex');

  // Constant-time comparison (timing attack prevention)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Security Checklist:**
- [ ] **ALWAYS verify signatures** - Never rely on IP whitelisting alone
- [ ] **Use SHA-256** (minimum) - Avoid deprecated MD5/SHA-1
- [ ] **Constant-time comparison** - Use `crypto.timingSafeEqual()` to prevent timing attacks
- [ ] **Timestamp validation** - Reject events older than 5 minutes
- [ ] **Idempotency handling** - Track processed webhook IDs to prevent duplicate processing
- [ ] **HTTPS only** - Enforce TLS for all webhook endpoints
- [ ] **Secret storage** - Store webhook secrets in env vars, never in code
- [ ] **Payload validation** - Verify structure after signature check
- [ ] **CSRF exemption** - Exempt webhook routes from CSRF middleware

**Environment Variables:**
```bash
PAYOS_WEBHOOK_SECRET=your_webhook_secret_here
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
```

**Error Handling:**
```typescript
// Return appropriate HTTP status codes
if (!verifyPayOSWebhook(...)) {
  return res.status(401).json({ error: 'Invalid signature' });
}

// Log all webhook events for audit trail
logger.info('PayOS webhook received', {
  event_type,
  timestamp,
  verified: true
});
```

---

## 2. PWA Setup with vite-plugin-pwa

### Installation & Configuration

**1. Install Dependencies:**
```bash
npm install -D vite-plugin-pwa workbox-window
```

**2. Vite Configuration (vite.config.ts):**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'WellNexus Distributor Portal',
        short_name: 'WellNexus',
        description: 'Distributor management platform for Well products',
        theme_color: '#1a1a2e',
        background_color: '#0f0f1e',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Runtime caching for API calls
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.wellnexus\.vn\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
```

**3. Advanced: Custom Service Worker (injectManifest strategy):**
```typescript
// For advanced use cases
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'public',
  filename: 'sw.js',
  manifest: { /* ... */ }
})
```

**4. Register Service Worker in App:**
```typescript
// src/main.tsx
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // Show update prompt to user
    if (confirm('New version available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  }
});
```

**Assets for PWA:**
- `pwa-192x192.png` - Required icon
- `pwa-512x512.png` - Required icon
- `apple-touch-icon.png` - iOS support
- `favicon.ico` - Browser tab icon

**Testing PWA:**
```bash
npm run build
npm run preview
# Open DevTools → Application → Manifest / Service Workers
```

---

## 3. React i18n Best Practices (react-i18next)

### TypeScript-First Setup

**1. Installation:**
```bash
npm install react-i18next i18next i18next-browser-languagedetector
npm install -D @types/react-i18next
```

**2. Type-Safe Configuration:**

**File: `src/i18n/config.ts`**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import vi from './locales/vi.json';

export const resources = {
  en: { translation: en },
  vi: { translation: vi }
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false // React already escapes
    }
  });

export default i18n;
```

**File: `src/i18n/i18next.d.ts`** (Type definitions)
```typescript
import 'react-i18next';
import { resources } from './config';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: typeof resources['vi'];
  }
}
```

**3. Translation Files Structure:**
```json
// src/i18n/locales/vi.json
{
  "landing": {
    "hero": {
      "title": "Nền tảng phân phối Well",
      "subtitle": "Quản lý đơn hàng và doanh số"
    },
    "roadmap": {
      "title": "Lộ trình phát triển",
      "stages": {
        "village": { "name": "Làng" },
        "town": { "name": "Thị trấn" },
        "city": { "name": "Thành phố" },
        "metropolis": { "name": "Đô thị" }
      }
    }
  },
  "auth": {
    "login": "Đăng nhập",
    "logout": "Đăng xuất",
    "email": "Email",
    "password": "Mật khẩu"
  }
}
```

**4. Usage in Components:**
```typescript
import { useTranslation } from 'react-i18next';

function RoadmapSection() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('landing.roadmap.title')}</h1>
      <p>{t('landing.roadmap.stages.metropolis.name')}</p>
    </div>
  );
}
```

**5. Advanced: ICU Message Format (Complex Pluralization):**
```bash
npm install i18next-icu
```

```typescript
import ICU from 'i18next-icu';
import vi from 'i18next-icu/locale-data/vi';

i18n.use(ICU).init({
  i18nFormat: { localeData: vi }
});
```

```json
{
  "items": "{count, plural, =0 {No items} one {1 item} other {# items}}"
}
```

**Best Practices:**
- ❌ **NEVER** concatenate strings: `t('welcome') + ' ' + userName`
- ✅ **ALWAYS** use interpolation: `t('welcome', { name: userName })`
- ❌ **AVOID** string bits: `t('go') + ' ' + t('to') + ' ' + t('page')`
- ✅ **COMPLETE phrases**: `t('navigation.goToPage', { page })`
- 🔒 **Type safety**: TypeScript validates translation keys at compile time
- 🌍 **Start early**: Integrate i18n from project inception
- 📝 **Pseudo-localization**: Test with fake translations (e.g., `[!!Tëxt!!]`) to catch layout issues

---

## 4. SPA SEO Strategy

### react-helmet-async for Meta Management

**1. Installation:**
```bash
npm install react-helmet-async
```

**2. Setup in App Root:**
```typescript
// src/main.tsx
import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
```

**3. Usage in Components:**
```typescript
import { Helmet } from 'react-helmet-async';

function LandingPage() {
  return (
    <>
      <Helmet>
        <title>WellNexus - Nền tảng phân phối hàng đầu</title>
        <meta
          name="description"
          content="Quản lý đơn hàng, theo dõi doanh số và phát triển mạng lưới phân phối"
        />
        <meta property="og:title" content="WellNexus Distributor Portal" />
        <meta property="og:description" content="..." />
        <meta property="og:image" content="https://wellnexus.vn/og-image.jpg" />
        <meta property="og:url" content="https://wellnexus.vn" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://wellnexus.vn" />
      </Helmet>

      {/* Page content */}
    </>
  );
}
```

**4. Dynamic Route Meta Tags:**
```typescript
function ProductPage({ productId }: { productId: string }) {
  const product = useProduct(productId);

  return (
    <>
      <Helmet>
        <title>{product.name} - WellNexus</title>
        <meta name="description" content={product.description} />
        <meta property="og:image" content={product.imageUrl} />
      </Helmet>

      {/* Product details */}
    </>
  );
}
```

### Sitemap Generation

**1. Install Sitemap Generator:**
```bash
npm install -D vite-plugin-sitemap
```

**2. Configure in vite.config.ts:**
```typescript
import sitemap from 'vite-plugin-sitemap';

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: 'https://wellnexus.vn',
      dynamicRoutes: [
        '/',
        '/about',
        '/products',
        '/contact',
        '/login',
        '/register'
      ],
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date()
    })
  ]
});
```

**3. Alternative: Manual Sitemap Script:**
```typescript
// scripts/generate-sitemap.ts
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';

const routes = ['/', '/about', '/products', '/contact'];

const stream = new SitemapStream({ hostname: 'https://wellnexus.vn' });
const writeStream = createWriteStream('./public/sitemap.xml');

stream.pipe(writeStream);
routes.forEach(route => stream.write({ url: route, changefreq: 'weekly' }));
stream.end();

await streamToPromise(stream);
```

**4. Submit to Google:**
```xml
<!-- public/robots.txt -->
User-agent: *
Allow: /
Sitemap: https://wellnexus.vn/sitemap.xml
```

**SEO Limitations for SPAs:**
- Client-side rendering may delay indexing
- Consider SSR/SSG with Vite SSR or migration to Next.js for critical SEO pages
- Use prerendering services (prerender.io, Netlify prerendering) as alternative

---

## 5. Vercel Security Headers

### vercel.json Configuration

**Complete Security Headers Setup:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.wellnexus.vn; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.wellnexus.vn https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
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
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### CSP Implementation Strategy

**Phase 1: Report-Only Mode** (Development)
```json
{
  "key": "Content-Security-Policy-Report-Only",
  "value": "default-src 'self'; report-uri https://wellnexus.vn/csp-report"
}
```

**Phase 2: Gradual Enforcement** (Staging)
```typescript
// Monitor CSP violations
app.post('/csp-report', (req, res) => {
  console.log('CSP Violation:', req.body);
  // Log to monitoring service (Sentry, etc.)
  res.status(204).end();
});
```

**Phase 3: Full Enforcement** (Production)
- Remove `unsafe-inline` and `unsafe-eval` by using nonces:

```typescript
// Server-side nonce generation
const nonce = crypto.randomBytes(16).toString('base64');

res.setHeader(
  'Content-Security-Policy',
  `script-src 'nonce-${nonce}' 'strict-dynamic'`
);

// In HTML
<script nonce="${nonce}">...</script>
```

**Testing Headers:**
```bash
# Test security headers
curl -I https://wellnexus.vn

# Security headers checker
https://securityheaders.com/?q=wellnexus.vn
```

---

## 6. Admin Dashboard Design (Aura Elite Compatible)

### Dark Glassmorphism Patterns

**Design Principles for 2026:**
- **Dark mode as standard** - Primary interface mode, not optional
- **Layered transparency** - Semi-transparent surfaces over deep gradients
- **Visual hierarchy** - Glass panels create depth perception (modals closer, backgrounds further)
- **Reduced cognitive load** - Intuitive z-index through blur effects
- **Balance aesthetics + accessibility** - Maintain WCAG contrast ratios

### CSS Implementation

**1. Glassmorphism Card Component:**
```css
.glass-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.125);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.37),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}
```

**2. Aura Elite Color Palette:**
```css
:root {
  /* Dark gradients */
  --bg-primary: #0f0f1e;
  --bg-secondary: #1a1a2e;
  --bg-glass: linear-gradient(135deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 30, 0.8));

  /* Accent colors */
  --accent-primary: #667eea;   /* Purple */
  --accent-secondary: #764ba2; /* Deep purple */
  --accent-glow: rgba(102, 126, 234, 0.3);

  /* Text */
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --text-muted: #606060;
}
```

**3. React Component Example:**
```typescript
// src/components/admin/GlassCard.tsx
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'elevated';
}

export function GlassCard({ children, className, variant = 'primary' }: GlassCardProps) {
  const variantStyles = {
    primary: 'bg-white/10 backdrop-blur-md',
    secondary: 'bg-white/5 backdrop-blur-sm',
    elevated: 'bg-white/15 backdrop-blur-lg shadow-2xl'
  };

  return (
    <div className={cn(
      'rounded-2xl border border-white/10',
      'shadow-[0_8px_32px_rgba(0,0,0,0.37)]',
      variantStyles[variant],
      className
    )}>
      {children}
    </div>
  );
}
```

**4. Admin Dashboard Layout:**
```typescript
// src/pages/admin/Dashboard.tsx
export function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1e] to-[#1a1a2e]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 glass-card">
        <nav>{/* Navigation items */}</nav>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        <GlassCard variant="elevated">
          <h1 className="text-2xl font-bold text-white/90">
            Admin Dashboard
          </h1>
        </GlassCard>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <GlassCard>
            <div className="p-6">
              <h3 className="text-white/70">Total Sales</h3>
              <p className="text-3xl font-bold text-white/90">₫12.5M</p>
            </div>
          </GlassCard>
          {/* More cards */}
        </div>
      </main>
    </div>
  );
}
```

**5. Accessibility Considerations:**
```css
/* Ensure sufficient contrast */
.glass-card {
  /* Use alpha channels, not opacity */
  background: rgba(26, 26, 46, 0.9); /* > 0.8 for readable text */
}

/* Focus states for keyboard navigation */
.glass-card:focus-within {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

**Design Checklist:**
- [ ] WCAG AA contrast ratio (4.5:1 for text)
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Performance: GPU-accelerated blur effects
- [ ] Fallback for browsers without backdrop-filter support

**Reference Admin Templates:**
- Health dashboard with soft lighting and glass effects
- Cybersecurity dashboard with dark data-driven aesthetic
- Futuristic booking dashboard with gradient overlays

---

## Implementation Checklist

### Phase 1: Security Foundation
- [ ] Implement PayOS webhook signature verification
- [ ] Configure Vercel security headers (CSP, HSTS, X-Frame-Options)
- [ ] Test CSP in report-only mode
- [ ] Set up environment variables for secrets

### Phase 2: Progressive Web App
- [ ] Install vite-plugin-pwa
- [ ] Configure manifest.json (icons, theme colors)
- [ ] Set up service worker caching strategy
- [ ] Test offline functionality
- [ ] Generate PWA assets (192x192, 512x512)

### Phase 3: Internationalization
- [ ] Install react-i18next + TypeScript types
- [ ] Set up i18n config with language detector
- [ ] Create translation files (vi.json, en.json)
- [ ] Add type definitions (i18next.d.ts)
- [ ] Migrate all hardcoded strings to t() calls
- [ ] Test language switching

### Phase 4: SEO Optimization
- [ ] Install react-helmet-async
- [ ] Add meta tags to all routes
- [ ] Configure sitemap generation
- [ ] Create robots.txt
- [ ] Submit sitemap to Google Search Console
- [ ] Test Open Graph tags

### Phase 5: Admin Dashboard
- [ ] Create GlassCard component
- [ ] Set up Aura Elite color palette
- [ ] Build admin layout with glassmorphism
- [ ] Implement navigation sidebar
- [ ] Create dashboard stats cards
- [ ] Test accessibility (contrast, keyboard nav)

---

## Unresolved Questions

1. **PayOS API Documentation** - Need official PayOS webhook payload schema for TypeScript types
2. **PWA Update Strategy** - Should auto-update or prompt user? (Current: prompts user)
3. **CSP Nonce Generation** - Requires server-side rendering or edge function for dynamic nonces (Vercel Edge Functions?)
4. **Sitemap Dynamic Routes** - How to handle authenticated routes in sitemap? (Exclude or include with proper canonical tags?)
5. **Admin Role Management** - Need clarification on admin permission levels (Super Admin, Sales Manager, Support, etc.)

---

## Sources

### PayOS Security
- [CiberSafety Webhook Security](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFZlGDyiyUNQpMOzBD9Dlbl4Hzk6YdfmS6QDh7VVAChMTu38xK15hQDNfslADLwCaX74kk0tUdz7mxxQn95Qj-mkt6Ig0-xucnwP3dvxVAWS2fOiZkqE8XuQ4uATtqMuWZRSS74Pm_FIb-kIgEw1KjtKNyiKlxR9X7JIZsaFmgyPu_h)
- [PaySG Webhook Verification](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFuQy03iDjG6Td-smMr0J9koyPdsB6eZ66tLYAA73lqKaYvqgdu98TkhpZpFsblDaA4Oh03uBHCPrghonVDRoD1Ml17aZksf1Kc3HDN5TIHf_iAQ1Gf8aykIwi3RYu4m7cn2gew2uP_aJFMAt9Vw58vBNU=)

### PWA Implementation
- [ScaleReal - PWA Setup](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGHpE_ZfQUNx_X8NJ9O12fpXCXBD36xggyAYtj-JAd0dd7ajyb8uMgUUSslIbsyYJ5Y0FRFA_oLT8cGjvzx72iXI7SDE8BANnNWtshxzbyVarc1Tv-Fv2Za3tyMEzg4E4d-VWPJgdCm0Gnjywbl8QGsmljhKuaFR7hOx97zShA=)
- [Daily.dev - Vite PWA Migration](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEQO31-B-JsHfzxCDakmzea2Q2SRSirfhXDW9ZQ2ygrzvxtA1D305uLtLJ5gdUfnkVrhdDIhtvvoJyTg-f2UepVv_570e2s2gLbZGyU32ZIKCHrXbnMUhMnCyxrmUgzkO8=)

### React i18n
- [IntlPull - react-i18next TypeScript](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQENIutBnFkrNgsKRDJY8lzlQHk_BgLhCYMCGgCiXfE-urPhH9MCkC-IBLDQmliGqS-6wZWBacE5psZd0q3wCNfzlt3S9EeuW-GYZCWUvMcYld5xnZSBwHS75WcFx_k_t8XyLAH_qeYppOhG91-CT44NTf0aQC1DFTJIENnNdwN0Z9W7pzc=)
- [Caisy - i18n Best Practices](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGj_9xzFw1UhT6r_rorPrKwmYGwjakPxcGNOPDFqrOQTMoidFe20hVN_7ksli38ONFtzav0RXY_Nm8T0T2p4Qj2v9SwFPa9KXjgF5eICEh14A5OkmXbikivVCpU4zs0Fg==)

### SPA SEO
- [Medium - React Sitemap](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFENrqLOm0MeOA9VA6XIJiOa0w2KSBw3BMqCtVmrOE8u1HhO9zxlLZQc8T0qRnvEu0ePueVItAAt9gvWrJW_sC93PO5gTE4CPg6fR42QPkLfrtPzIjeDGgvBOu1joYfc65P25ZuR03yytwilWc0-P0DSQzBWV4MFOTeunzK7vFMjDnIkdEz0l8CWZLtYVJTUMeHqXL1eNOxOUo4VEG5tQ9Cd1U=)
- [Dev.to - SPA SEO Guide](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFrU-JGMXOf17UONMRkncZ28ZDT_LnEXqdB4eOyuiXMzsi8sRHH0mQIGfTZv4xPSD-WSHdvfAMA2bYX25IxhFAofjrHWa872RXwhqFR6Wcc6YlG6ItPOzIE_QX2c9EHyBZ4Nxj-Q4bhUWVcgQlasyqpT5SzARNlH7pQaCEnNXUCKQ==)

### Vercel Security Headers
- [Reddit - Vercel CSP](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHAA4CnOEqcJcB1RDRwcKjCTi5WpWADoQWfFmnUjCT9g9Zy_BVAEDG4EKMq2hcFvdaqgzfqIP_n3ihn8G0vcYT3vR-Oub9C-2l3N34J2D-_p8UZ-gLPegSG127suw5enRaXHsuPF8Ptd_PuBRWZJ3Jb_YGbKKL61yzltsvuRMHByjMQgO9ycZ0SX3pzNSGFoztboiN25xeCWuZZdo4n7vX1bFyfKg==)
- [Mozilla MDN - HSTS](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEZcJKIjneoWtkzW9Urma8qaker1ssnYHify-AJChOHHW5Mb1WE6MrMlG-oyR-hJZmVD3yOZp0rC-YCJXWQHkiNGi99BRSUskTkdJ5dIVOFl-Zk0PxCDDJBQAXdItskZX2rW7XLvU4HcKfC6ZAo66De9rYwfKM6Q-q-A4d5CXi1ZSUoKz_uUktWXqWNXtdhDRS_apb7SiPOA==)

### Admin Dashboard Design
- [Medium - Dark Glassmorphism](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEazodacYcjRym2wgTLejYG_4nEC3w9LIf8Ci9NdQIoyzV20FPsIKX3rB9H36_xI3RvbKfBHL84eQOhmuvIY-qJ-6ayWKO1RQDKlFMexN0Xgk05973obtlaOHn7Gc81RO3YQw2Mp7dbo_l86552XICfVt40uIcKfHX44ZvnrsYyXlt9yhtCjMtXkP_0amSCphsHxT0aI-uv7y4V_pgFdgPzMNsheRHorA==)
- [FanRuan - Dashboard Templates](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHBrTgwXbNMAZ7YZ2xKmoXnq10ZJrkPZwvagyR3nyhyoUCxSB7bwk0v6EYyaAhRkOyT9KtNz6hhCiC7fCS9X2cbfpFSflaHzfJUJ-OTOTdM2BoqOsaDeUXRVFX006wn8dtgaleV23-D17njYfGKunNtcQ9tcUl5XmvYntksm4Ytdu9YsgX0jA==)

---

**Report Status:** COMPLETE
**Next Steps:** Provide to planner agent for implementation plan creation
