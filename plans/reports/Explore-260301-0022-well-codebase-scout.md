# Well Project Scout Report
**Date:** 2026-03-01  
**Project:** WellNexus RaaS Health Platform  
**Status:** ✅ Production Ready (Go-Live)

---

## 1. README.md Context

The Well project is a **Hybrid Community Commerce platform for Vietnam** with:
- **Latest Stack:** React 19.2.4, Vite 7.3.1, TypeScript 5.9.3 (Strict Mode)
- **Build Time:** 3.2s ✅
- **Test Coverage:** 349+ tests
- **Key Features:** Agent-OS (24+ AI agents), PWA-ready, Dark/Light theme, MLM/Affiliate network (8-level commission)
- **Backend:** Supabase with Edge Functions
- **Deployment:** Vercel (https://wellnexus.vn)
- **Database:** PostgreSQL with Row-Level Security (RLS)

### Key Audit Metrics
| Check | Status |
|-------|--------|
| CI Pipeline | ✅ 1m25s |
| Unit Tests | ✅ 349+ |
| TypeScript | ✅ 5.9.3 Strict |
| Build Time | ✅ 3.2s |
| Type Errors | ✅ 0 |

---

## 2. i18n-Related Files

### Translation Structure
- **Primary Files:** 
  - `/src/locales/en.ts` (29 lines) — English entry point
  - `/src/locales/vi.ts` (29 lines) — Vietnamese entry point

- **Module Imports (12 modules total):**
  - `en/admin.ts`, `en/auth.ts`, `en/common.ts`, `en/copilot.ts`
  - `en/dashboard.ts`, `en/health.ts`, `en/marketing.ts`, `en/marketplace.ts`
  - `en/referral.ts`, `en/team.ts`, `en/wallet.ts`, `en/network.ts`, `en/misc.ts`
  - **Identical structure** for `vi/` (Vietnamese)

### i18n Build Scripts
Located in `/scripts/`:
| Script | Purpose | Status |
|--------|---------|--------|
| `validate-i18n-keys.mjs` | Check key presence in both languages | ✅ Pre-build hook |
| `sync-i18n-keys.mjs` | Synchronize missing keys between vi/en | ✅ Available |
| `check-locale-coverage.mjs` | Coverage analysis | ✅ Available |
| `extract-translation-keys.mjs` | Extract new keys from code | ✅ Available |
| `fix-i18n.ts` | Fix i18n issues | ✅ Available |

### npm Scripts
```json
"i18n:validate": "node scripts/validate-i18n-keys.mjs"
"i18n:extract": "node scripts/extract-translation-keys.mjs"
"i18n:check": "node scripts/check-locale-coverage.mjs"
"i18n:sync": "node scripts/sync-i18n-keys.mjs"
"prebuild": "npm run sitemap:generate && npm run i18n:validate"
"pretest": "npm run i18n:validate"
```

### Service
- **i18nService.ts** (4.7KB) — Core i18n management logic
  - Handles language detection, switching, persistence
  - Integrated with i18next ecosystem

---

## 3. Supabase Configuration

### Frontend Supabase Client
- **File:** `/src/lib/supabase.ts`
- **Setup:**
  ```typescript
  - Uses @supabase/supabase-js v2.93.3
  - Configured with secure token storage
  - Auto-refresh enabled
  - Session persistence
  - URL detection support
  ```

### Environment Variables
```
VITE_SUPABASE_URL=https://jcbahdioqoepvoliplqy.supabase.co
VITE_SUPABASE_ANON_KEY=<from-dashboard>
```

### Database Schema
| Table | RLS | Purpose |
|-------|-----|---------|
| users | ✅ | User profiles & balances |
| products | ✅ | Marketplace products |
| transactions | ✅ | SHOP/GROW transfers |
| team_members | ✅ | MLM network |
| agent_logs | ✅ | AI agent activity |
| subscription_plans | — | Active subscription tiers |
| user_subscriptions | — | User subscription tracking |
| payment_intents | — | PayOS order tracking |
| push_subscriptions | — | PWA notifications |
| audit_logs | — | Admin action tracking |

### Supabase Migrations
Located in `/supabase/migrations/`:
- `20241203000001_initial_schema.sql` — Core tables
- `20241203000002_admin_orders.sql` — Admin functionality
- `20241203000003_bee_agent_rpc.sql` — Commission RPC functions
- `20250105000002_bee_3_0_complete_replacement.sql` — Bee 3.0 engine
- `20260113_recursive_referral.sql` — Referral network
- `20260205223540_ecommerce_setup.sql` — E-commerce tables
- `20260224_critical_bug_fixes.sql` — Security patches
- `20260225_security_fixes.sql` — Additional security
- `20260228_subscription_payment_intents.sql` — Subscription payment tracking

### Supabase Edge Functions
Located in `/supabase/functions/`:
| Function | Purpose | Status |
|----------|---------|--------|
| `agent-reward` | Commission distribution | ✅ Active |
| `agent-worker` | Background agent tasks | ✅ Active |
| `gemini-chat` | AI copilot integration | ✅ Active |
| `payos-create-payment` | Payment initiation | ✅ Active |
| `payos-get-payment` | Payment status check | ✅ Active |
| `payos-cancel-payment` | Payment cancellation | ✅ Active |
| `payos-create-subscription` | Subscription payments | ✅ Active |
| `payos-webhook` | PayOS webhook handler | ✅ Active |
| `send-email` | Transactional email (Resend) | ✅ Active |

### Secrets Management (Server-side only)
Set via `supabase secrets set`:
- `GEMINI_API_KEY` — Google AI integration
- `RESEND_API_KEY` — Email service (re_xxx format)
- `PAYOS_CLIENT_ID` — Payment gateway
- `PAYOS_API_KEY` — Payment gateway
- `PAYOS_CHECKSUM_KEY` — Payment security
- `WEBHOOK_SECRET` — Commission webhook auth
- `VAPID_PRIVATE_KEY` — PWA notifications

---

## 4. PayOS Configuration & Integration

### Frontend Integration
**File:** `/src/services/payment/payos-client.ts` (142 lines)

**Architecture:** ✅ **Secure proxy pattern** — All PayOS credentials server-side only
- Client calls Supabase Edge Functions (never direct PayOS API)
- Edge Functions handle all payment operations
- Circuit breaker pattern for resilience

**API Methods:**
```typescript
createPayment(request)      // Initiate payment
getPaymentStatus(orderCode) // Check payment status
cancelPayment(orderCode)    // Cancel payment
isPayOSConfigured()         // Configuration check
verifyWebhook()             // Webhook verification (deprecated)
```

### Subscription Service
**File:** `/src/services/subscription-service.ts`
- Manages subscription plans (free/basic/pro/agency)
- Tracks user subscriptions with PayOS order codes
- Supports monthly/yearly billing cycles
- Statuses: active, past_due, canceled, trialing, expired

### PayOS Environment Variables
```
PAYOS_CLIENT_ID=<your-client-id>        # Dashboard → Tích hợp
PAYOS_API_KEY=<your-api-key>            # Dashboard → Tích hợp
PAYOS_CHECKSUM_KEY=<your-checksum-key>  # Webhook security
```

### PayOS Edge Functions
**Key Functions in `/supabase/functions/`:**

1. **payos-create-payment** — Initiates payment request
   - Generates order code
   - Creates checkout QR code
   - Returns payment link

2. **payos-get-payment** — Polls payment status
   - Checks if payment completed
   - Returns transaction details
   - Handles pending/failed states

3. **payos-cancel-payment** — Cancels payment request
   - Invalidates payment link
   - Logs cancellation reason
   - Updates order status

4. **payos-webhook** — Webhook listener
   - Receives payment completion notifications
   - Verifies checksum signature
   - Triggers commission distribution
   - Updates subscription status

5. **payos-create-subscription** — Subscription payment flow
   - Creates recurring payment intent
   - Tracks payment in `payment_intents` table
   - Handles renewal logic

### Database Tables
- `subscription_plans` — Plan definitions
- `user_subscriptions` — User subscription tracking
- `payment_intents` — PayOS order tracking (new 2026-02-28)

---

## 5. Package.json Build Scripts

### Development
```bash
npm run dev          # Start Vite dev server (port 5173)
npm run preview      # Test production build locally
```

### Build & Test
```bash
npm run build        # Build for production (NODE_OPTIONS=--max-old-space-size=4096)
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once (CI mode)
npm run test:ui      # Visual test dashboard
npm run test:coverage # Coverage report
npm run lint         # ESLint check
```

### i18n & Pre-build
```bash
npm run sitemap:generate   # Generate sitemap.xml
npm run i18n:validate      # Check translation keys
npm run i18n:extract       # Extract new keys from code
npm run i18n:check         # Check locale coverage
npm run i18n:sync          # Sync missing keys
npm run prebuild           # Runs sitemap + i18n:validate
npm run pretest            # Runs i18n:validate before tests
```

### Ship & Misc
```bash
npm run ship         # Production deployment script
npm run prepare       # Husky git hooks setup
```

---

## 6. src/ Directory Structure

```
src/
├── __tests__/               # 349+ unit tests
│   ├── agents/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   └── ...
│
├── agents/                  # Agent-OS (24+ agents)
│   ├── coach-agent.ts
│   ├── sales-copilot.ts
│   ├── reward-engine.ts
│   └── ...
│
├── components/              # UI Components (56 directories)
│   ├── auth/
│   ├── dashboard/
│   ├── marketplace/
│   ├── wallet/
│   ├── admin/
│   ├── common/
│   └── ...
│
├── config/                  # Configuration
│   ├── env.ts              # Environment validation
│   ├── sales-prompts.ts    # AI prompts
│   ├── sales-templates.ts  # Email templates
│   └── seo-config.ts       # SEO metadata
│
├── constants/               # App constants
├── context/                 # React context providers
├── data/                    # Static data
│
├── hooks/                   # 46 custom hooks
│   ├── useAuth.ts
│   ├── useWallet.ts
│   ├── useAgentOS.ts
│   ├── useSubscription.ts
│   └── ...
│
├── lib/                     # Utility libraries
│   ├── supabase.ts         # Supabase client
│   ├── analytics.ts        # Analytics
│   ├── rate-limiter.ts     # Rate limiting
│   └── schemas/            # Zod schemas
│
├── locales/                 # i18n translations
│   ├── en.ts               # English root
│   ├── en/                 # 12 English modules
│   ├── vi.ts               # Vietnamese root
│   └── vi/                 # 12 Vietnamese modules
│
├── pages/                   # React Router pages (40 pages)
│   ├── dashboard/
│   ├── marketplace/
│   ├── admin/
│   ├── auth/
│   ├── wallet/
│   ├── team/
│   └── ...
│
├── services/                # Business logic (25 services)
│   ├── payment/
│   │   └── payos-client.ts
│   ├── subscription-service.ts
│   ├── withdrawal/
│   ├── walletService.ts
│   ├── referral-service.ts
│   ├── orderService.ts
│   ├── copilotService.ts
│   ├── email-service.ts
│   ├── i18nService.ts
│   └── ...
│
├── store/                   # Zustand state management
├── styles/                  # Tailwind CSS config
├── test/                    # Test utilities
├── types/                   # TypeScript types (15 dirs)
└── utils/                   # Utility functions (70 utils)
    ├── commission/
    ├── errors/
    ├── validators/
    ├── formatters/
    ├── secure-token-storage.ts
    ├── circuit-breaker.ts
    ├── logger.ts
    └── ...
```

### Major Service Files
| Service | Size | Purpose |
|---------|------|---------|
| `copilotService.ts` | 10.2KB | AI sales copilot |
| `referral-service.ts` | 7.5KB | MLM network management |
| `walletService.ts` | 5.8KB | SHOP/GROW token management |
| `financeService.ts` | 5KB | Financial calculations |
| `subscription-service.ts` | 5.4KB | Plan & subscription management |
| `withdrawal/` | 7 files | Withdrawal logic (client + admin) |
| `payment/payos-client.ts` | 3.9KB | PayOS integration |

---

## 7. Build Configuration

### Vite Config (`vite.config.ts`)
**Key Settings:**
- **Target:** ES2020 (Safari 14+)
- **Build Targets:** ES2020, Safari 14, Chrome 87, Firefox 78
- **Chunk Size Limit:** 1600KB (due to react-pdf)
- **Manual Code Splitting:**
  - `react-vendor` — React core
  - `animation` — Framer Motion
  - `supabase` — Supabase client
  - `icons` — Lucide React
  - `i18n` — i18next
  - `forms` — Zod + React Hook Form
  - `state` — Zustand
  - `pdf` — @react-pdf (heavy)
  - `sentry` — Error tracking
  - `dompurify` — HTML sanitization
  - **Note:** Recharts + D3 NOT manually chunked (circular dependency TDZ bug)

### TypeScript Config (`tsconfig.json`)
- **Target:** ES2022
- **Mode:** Strict (all checks enabled)
- **Path Alias:** `@/` → `./src/`
- **JSX:** react-jsx (automatic)
- **Excluded:** node_modules, dist, functions, __tests__

---

## 8. Build Errors & Status

### Current Status ✅
- **TypeScript Compilation:** 0 errors (strict mode)
- **Linting:** Passing
- **Tests:** 349+ passing
- **Build Time:** 3.2s
- **Production Build:** Verified on Vercel (https://wellnexus.vn)

### Pre-build Hooks
1. `sitemap:generate` — Creates sitemap.xml for SEO
2. `i18n:validate` — Ensures all keys present in both languages

### Test Hooks
- `pretest` runs `i18n:validate` before each test run

---

## 9. Critical Configuration Files

### Environment Files
- `.env.example` — Template (4.3KB)
- `.env.local` — Local dev (432 bytes)
- `.env.production.example` — Production template (505 bytes)
- `.env.production.local` — Production config (1.3KB)

### Required Env Variables
**Frontend (VITE_ prefix):**
- `VITE_SUPABASE_URL` ✅ Configured
- `VITE_SUPABASE_ANON_KEY` ✅ Configured
- `VITE_ADMIN_EMAILS` ✅ Configured

**Server-side (via Supabase secrets):**
- `GEMINI_API_KEY` — AI integration
- `RESEND_API_KEY` — Email service
- `PAYOS_CLIENT_ID` — Payment
- `PAYOS_API_KEY` — Payment
- `PAYOS_CHECKSUM_KEY` — Payment security
- `WEBHOOK_SECRET` — Commission webhook
- `VAPID_PRIVATE_KEY` — PWA notifications

---

## 10. Key Observations & Insights

### Strengths ✅
1. **Type Safety:** 100% TypeScript Strict Mode compliance
2. **i18n Ready:** Complete en/vi translations with 12 domain modules
3. **Secure Payment:** PayOS via Edge Functions (credentials server-side)
4. **Scalable Architecture:** Code splitting optimized for large bundles
5. **Testing:** 349+ tests covering agents, services, components
6. **Production Ready:** Go-live with 3.2s builds

### Areas to Monitor
1. **i18n Keys:** Must validate before every build/test
2. **PayOS Secrets:** Must be set server-side via Supabase
3. **Chunk Size:** react-pdf forces 1600KB limit
4. **Recharts:** D3 circular deps — don't manual chunk

### Recommendations
1. Run `npm run i18n:sync` after adding new code
2. Verify all `t('key')` calls exist in both en.ts and vi.ts
3. Never commit `.env.local` files
4. Test PayOS webhooks in staging before production
5. Monitor subscription renewal logic (payment_intents table)

---

## 11. i18n Best Practices (CRITICAL)

**Rule from CLAUDE.md:**
When adding/modifying `t('key')` calls:
1. Check key exists in BOTH `vi.ts` AND `en.ts`
2. Ensure path matches exactly: `vi.dashboard.section` ↔ `en.dashboard.section`
3. Never hardcode strings in JSX — always use `t('key')`
4. After fix: build + verify browser shows no raw keys
5. Use `npm run i18n:sync` to sync missing keys

**Example Bug (happened before):**
- Code: `t('landing.roadmap.stages.metropolis.name')`
- vi.ts had: `empire` instead of `metropolis`
- Result: Raw key displayed on production! ❌

---

## Files Summary

| Category | Count | Key Files |
|----------|-------|-----------|
| i18n Files | 28 | en.ts, vi.ts + 26 modules |
| Supabase Functions | 9 | payos-*, send-email, agent-*, gemini-* |
| Services | 25 | payment, subscription, wallet, referral, etc. |
| Components | 56 | Split by feature (auth, dashboard, marketplace, etc.) |
| Hooks | 46 | useAuth, useWallet, useSubscription, etc. |
| Pages | 40 | Dashboard, marketplace, admin, auth, etc. |
| Tests | 349+ | Covering agents, services, components, utils |
| Migrations | 20 | From initial_schema to latest payment_intents |
| Config | 4 | env.ts, sales-prompts, sales-templates, seo-config |

---

## Recommendations for Next Tasks

1. **i18n Validation:** Run `npm run i18n:validate` to check current state
2. **Payment Testing:** Verify PayOS Edge Functions with test credentials
3. **Build Verification:** `npm run build` and check for zero TypeScript errors
4. **Test Coverage:** `npm run test:coverage` to identify gaps
5. **Production Monitoring:** Verify Sentry is capturing errors on wellnexus.vn

---

**Report Generated:** 2026-03-01  
**Status:** ✅ Complete & Production Ready
