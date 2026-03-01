# WellNexus Architecture Overview

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19.2.4, TypeScript 5.9.3 (strict), Vite 7.3.1 |
| Styling | Tailwind CSS, Framer Motion (Aura Elite design) |
| State | Zustand (8 slices) |
| i18n | i18next — Vietnamese (vi.ts) + English (en.ts) |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions, Realtime) |
| AI | Google Gemini via Supabase Edge Function |
| Payments | PayOS via Edge Function |
| Email | Resend via Edge Function |
| Testing | Vitest 4.x (vmThreads pool), Testing Library |
| Deployment | Vercel, auto-deploy on push to main |

## Routing (React Router v6 + Lazy Loading)

All pages use `React.lazy()` wrapped in `<SafePage>` (ErrorBoundary + Suspense).

```
/ (LandingPage)
/login, /signup, /confirm-email
/forgot-password, /reset-password
/ref/:referralId (ReferralRedirect)
/venture (VenturePage)
/checkout, /checkout/success

/admin (AdminRoute — env-based RBAC)
  index     → Overview
  cms       → CMS
  partners  → Partners
  finance   → Finance
  policy-engine → PolicyEngine
  orders    → OrderManagement
  products  → AdminProducts
  audit-log → AuditLog

/dashboard (Protected — AppLayout)
  index         → Dashboard
  marketplace   → Marketplace
  product/:id   → ProductDetail
  wallet        → CommissionWallet
  copilot       → CopilotPage
  team          → LeaderDashboard
  referral      → ReferralPage
  network       → NetworkPage
  withdrawal    → WithdrawalPage
  health-coach  → HealthCoach
  health-check  → HealthCheck
  leaderboard   → Leaderboard
  marketing-tools → MarketingTools
  agents        → AgentDashboard
  subscription  → SubscriptionPage
  settings      → SettingsPage
  profile       → ProfilePage

/test, /debugger (diagnostic — auth-gated)
/system-status (public)
* → NotFoundPage (404)
```

## State Management (Zustand)

`src/store/` — 8 slices + cart store:

| Slice | Responsibility |
|-------|---------------|
| `authSlice` | Auth state, session, user profile |
| `walletSlice` | Commission wallet, transactions |
| `teamSlice` | Downline team metrics |
| `agentSlice` | Agent-OS registry + execution state |
| `productSlice` | Product catalog |
| `subscriptionSlice` | Subscription tiers |
| `questSlice` | Gamification quests |
| `uiSlice` | Theme, modals, toast |
| `cartStore` | Shopping cart (separate) |

## Agent-OS Framework

`src/agents/` — 24+ modular agents:

**Core** (`core/`): `BaseAgent.ts`, `index.ts`

**Custom Agents** (`custom/`):
- `AgencyOSAgent`, `GeminiCoachAgent`, `SalesCopilotAgent`
- `ProjectManagerAgent`, `DebuggerAgent`, `DocsManagerAgent`
- `CodeReviewerAgent`, `ScoutAgent`, `ScoutExternalAgent`, `TheBeeAgent`

**Orchestration** (`orchestration/`):
- `agent-supervisor-orchestrator.ts` — multi-agent coordination
- `agent-intent-classifier.ts` — intent routing

**ClaudeKit** (`claudekit/`):
- `ClaudeKitAdapter.ts` — CC CLI integration bridge

**Registry** (`registry.ts`): Central agent registration + lifecycle

## Data Flow

```
User Action → React Component → Custom Hook
  → Zustand Store / Service Layer
  → Supabase Auth/DB/Edge Functions
  → State Update → Re-render
```

## WebSocket & Realtime

**Connection Cache** (`src/lib/websocket-connection-cache.ts`):
- Singleton manager for Supabase Realtime channels
- Ref-counted subscriptions — multiple components share one channel
- Auto-cleanup: last consumer `release()` triggers `removeChannel()`
- `acquire(channelName, factory?)` / `release(channelName)` / `releaseAll()`

**Usage** (`src/hooks/useRealTimeNotifications.ts`):
- Subscribes to user-specific Supabase Realtime channels
- Uses connection cache to prevent duplicate subscriptions

## Rate Limiting

**Client-side** (`src/lib/rate-limiter.ts`):
- Sliding window algorithm, per-user tracking
- Default: 10 requests/60s window
- `commandRateLimiter` singleton for AgencyOS commands
- Methods: `isAllowed()`, `getRemaining()`, `getResetTime()`, `resetAll()`

**Server-side**: Supabase Edge Functions handle API rate limits via built-in quotas.

## Input Validation (Zod)

**Schemas** (`src/schemas/`):
- `order.ts` — Order creation, items, quantities
- `auth.ts` — Login, signup, password reset
- `api-validation-schemas.ts` — PayOS webhook, payout, withdrawal
- All export inferred types via `z.infer<typeof Schema>`
- VND business rules: 10,000 min, 500M max, integer amounts

## Security

- Supabase RLS on all tables
- CSP + HSTS headers via `vercel.json`
- HMAC-SHA256 webhook verification (PayOS)
- Input validation: Zod (API boundaries) + DOMPurify (XSS)
- Auth tokens: encrypted in-memory (no localStorage)
- Admin access: `VITE_ADMIN_EMAILS` env-based RBAC
- Auto-logout: 30 min inactivity (`useAutoLogout`)
- Rate limiting on client-side command execution

## Performance

**Code Splitting** (Vite `manualChunks`):
- `react-vendor` ~86 KB gzipped
- `supabase-vendor` ~44 KB gzipped
- `motion-vendor` ~40 KB gzipped
- All pages lazy-loaded

**Build:** ~3.2s | **Bundle:** ~350 KB gzipped | **PWA:** enabled

## Containerization

- **Dockerfile**: Multi-stage (node:22-alpine → nginx:alpine), SPA routing
- **PM2**: `ecosystem.config.cjs` for process management (cluster mode)
- **nginx**: Custom SPA config with immutable asset caching

## CI/CD

- **GitHub Actions** (`ci.yml`): lint → test (coverage) → build → security audit
- Concurrency groups: cancel-in-progress on new push
- Coverage artifact upload on every run
- **Lighthouse** (`lighthouse.yml`): Performance monitoring on PRs
- **Vercel**: Auto-deploy on push to main

## Testing

- 380+ vitest tests across 37 test files
- Pool: `vmThreads` for isolation
- Pre-test: `pnpm i18n:validate` (key sync check)
- Coverage: unit (utils, store), component, integration (flows)
- Integration tests with retry for esbuild stability

## Development Commands

```bash
pnpm dev          # dev server :5173
pnpm build        # production build → dist/
pnpm test         # vitest run (vmThreads)
pnpm test:coverage # coverage report
pnpm test:ui      # vitest UI
pnpm i18n:validate # check translation key sync
```
