# CLAUDE.md — WellNexus AI Assistant Guide

This file provides context for AI assistants (Claude, Copilot, etc.) working on the WellNexus codebase. Read this before making any changes.

---

## Project Overview

**WellNexus** is a Vietnamese health-tech "Wealth OS" platform combining:
- Health product marketplace
- MLM/affiliate network (multi-level, 8 ranks)
- AI-powered sales copilot & coaching
- SHOP/GROW dual-token economy

**Production URL:** https://wellnexus.vn
**Stack:** React 19 + Vite + TypeScript + Supabase + Tailwind CSS

---

## Directory Structure

```
/
├── src/
│   ├── agents/          # AI agent system (24+ agents)
│   │   ├── BaseAgent.ts
│   │   ├── registry.ts  # Singleton agent registry
│   │   └── custom/      # GeminiCoach, SalesCopilot, TheBee, AgencyOS, etc.
│   ├── components/      # 184 React UI components
│   │   └── ui/          # Base components (Button, Card, Input, Modal, Toast)
│   ├── pages/           # 39 page-level components (lazy-loaded)
│   ├── hooks/           # 18+ custom React hooks
│   ├── services/        # Business logic & Supabase operations
│   ├── store/           # Zustand state (decomposed slices)
│   │   └── slices/      # authSlice, walletSlice, teamSlice, agentSlice, etc.
│   ├── utils/           # Pure utility functions (commission, format, validation)
│   ├── locales/         # i18n translations
│   │   ├── en/          # English (auth, wallet, marketplace, dashboard, ...)
│   │   └── vi/          # Vietnamese (mirrors en/ structure)
│   ├── types/           # TypeScript type definitions
│   ├── lib/             # Library integrations (supabase.ts, schemas/)
│   ├── context/         # React contexts (Language, Theme, Toast)
│   ├── styles/          # design-tokens.ts, design-system.css
│   ├── __tests__/       # Integration test files
│   ├── test/            # Test configuration & setup
│   ├── App.tsx          # Root component, routing, lazy loading
│   ├── main.tsx         # Entry point, providers, Safari polyfills
│   ├── i18n.ts          # i18next initialization
│   └── index.css        # Global styles (12 KB)
├── admin-panel/         # Separate admin dashboard (React 19 + Radix UI)
├── supabase/
│   ├── functions/       # Edge Functions (Deno): PayOS, Email, Gemini, AgentReward
│   └── migrations/      # Database schema & RPC SQL files
├── e2e/                 # Playwright E2E tests
├── scripts/             # Build scripts (i18n, sitemap, ship, verify)
├── docs/                # Technical documentation
├── .github/workflows/   # CI/CD (ci.yml, lighthouse.yml)
└── .husky/              # Git hooks (pre-commit i18n validation)
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 19.2.4 |
| Build | Vite 7.3.1 |
| Language | TypeScript 5.9.3 (strict mode) |
| Styling | Tailwind CSS 3.4.1 + custom design tokens |
| State | Zustand 4.5.0 (slices pattern) |
| Forms | React Hook Form 7.71.1 + Zod 4.3.6 |
| Routing | React Router DOM 6.22.0 |
| Animation | Framer Motion 11.0.8 |
| i18n | i18next 25.7.4 (EN + VI) |
| DB/Auth | Supabase (PostgreSQL + RLS + Realtime) |
| Edge Functions | Supabase Edge Functions (Deno runtime) |
| Payment | PayOS (Vietnam) |
| Email | Resend |
| AI | Google Gemini API (via Edge Function) |
| Error Tracking | Sentry 10.38.0 |
| Unit Tests | Vitest 4.0.18 + Testing Library |
| E2E Tests | Playwright 1.58.1 (5 browsers) |
| CI/CD | GitHub Actions → Vercel |

---

## Development Commands

```bash
npm run dev              # Start local dev server (port 5173)
npm run build            # TypeScript check + Vite build (4 GB heap)
npm run preview          # Preview production build (port 4173)
npm test                 # Run all unit tests (307+)
npm run test:coverage    # Run tests with coverage report
npm run test:ui          # Open Vitest UI
npm run lint             # ESLint (src/ only)
npm run i18n:validate    # Validate all i18n keys (runs before build/test)
npm run i18n:extract     # Extract keys from source
npm run i18n:check       # Check locale coverage
npm run i18n:sync        # Sync keys between locales
npm run sitemap:generate # Generate sitemap.xml
npm run ship             # Full deployment script
```

---

## Critical Conventions

### 1. i18n is MANDATORY

Every string shown to users **must** use i18n. Both `src/locales/en.ts` and `src/locales/vi.ts` must have matching keys.

- The `prebuild` and `pretest` scripts run `i18n:validate` automatically.
- The Husky pre-commit hook also enforces this.
- **Build and tests WILL FAIL** if any key is missing from either locale.

```typescript
// Correct
const { t } = useTranslation();
return <p>{t('wallet.balance')}</p>;

// Wrong — never hardcode user-facing strings
return <p>Balance</p>;
```

### 2. State Management — Zustand Only, No React Query

- Global state lives in Zustand slices (`src/store/slices/`).
- Data fetching uses service classes + standard `useState`/`useEffect`/`useCallback`.
- **Do NOT import or use React Query (`QueryClientProvider`, `useQuery`, etc.)** — the project does not use it despite some older docs suggesting otherwise.

```typescript
// Correct pattern
const [data, setData] = useState(null);
useEffect(() => {
  walletService.getBalance(userId).then(setData);
}, [userId]);

// Wrong
const { data } = useQuery(['wallet'], () => walletService.getBalance(userId));
```

### 3. Lazy Loading All Pages

Every page component in `src/App.tsx` is lazy-loaded with `React.lazy()` and wrapped in `<Suspense>` with a spinner fallback. Use `SafePage` wrapper to prevent chunk-load crashes.

```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
// wrapped in <SafePage><Suspense fallback={<PageSpinner />}>...</Suspense></SafePage>
```

### 4. Modal/Portal Pattern

Global modals must use `ReactDOM.createPortal` targeting `document.body` to avoid z-index and overflow issues with parent containers.

### 5. Image Requirements (CLS Prevention)

All `<img>` tags **must** have explicit `width` and `height` attributes to prevent Cumulative Layout Shift (CLS). Use `loading="lazy"` for below-fold images.

```tsx
// Correct
<img src={url} width={64} height={64} loading="lazy" alt="..." />

// Wrong — will fail Lighthouse CLS audit
<img src={url} alt="..." />
```

### 6. Loading State Accessibility

- **Skeleton loaders:** use `aria-hidden="true"` (decorative only)
- **Active spinners:** use `role="status"` with a `<span className="sr-only">Loading...</span>`

### 7. Admin Protection

Wrap all admin pages/routes with the `<AdminRoute>` component. Never check admin status inline.

### 8. TypeScript Strict Mode

Strict mode is enforced. No `any` types, no implicit returns, no unused variables (prefix with `_` to suppress). Path alias `@` maps to `./src`.

### 9. Framer Motion in Tests

When testing components that use Framer Motion, mock the library with a factory function to avoid hoisting issues:

```typescript
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }) => children,
}));
```

### 10. Vite Chunk Splitting — Recharts Exception

`recharts` and `react-d3-tree` must NOT be added to `manualChunks` in `vite.config.ts`. They have a TDZ (Temporal Dead Zone) circular dependency bug that breaks manual chunking.

---

## Data Types & Business Logic

### User Ranks (MLM)
- Stored in DB as integers (0–7)
- Mapped via `UserRank` enum in code
- Always cast explicitly: `rank as number` when reading from Supabase

### Token Economy
- **SHOP tokens:** Purchasing power (marketplace)
- **GROW tokens:** Earning/commission rewards
- Two transaction types: `FinanceTransaction` (internal business logic) vs `SupabaseTransaction` (DB log) — do not conflate

### Commission System
- 1–8 levels deep
- Rates: 21–25% depending on rank
- Core logic: `src/utils/commission-logic.ts`
- Policy Engine: `src/hooks/usePolicyEngine.ts` (runs client-side)
  - Strategic Candidates = 1.5% of partner count
  - Projected SaaS Revenue = Candidates × WhiteLabel GMV × 20%

### Network Visualization
Two separate components for the MLM tree — use the right one:
- **`NetworkTree`** (recursive React): Used in `LeaderDashboard` for list-style overview
- **`NetworkTreeDesktop`** (react-d3-tree): Used in `NetworkPage` for zoomable/pannable tree diagram

---

## Environment Variables

**Required (frontend, must be in `.env.local`):**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_EMAILS=           # Comma-separated admin emails
```

**Optional (frontend):**
```
VITE_SENTRY_DSN=
VITE_VAPID_PUBLIC_KEY=
```

**Server-side (Supabase Edge Functions secrets):**
```
GEMINI_API_KEY=
RESEND_API_KEY=
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
VAPID_PRIVATE_KEY=
```

Never hardcode secrets in source code. The app validates env vars at startup in `main.tsx`.

---

## Testing

### Unit Tests (Vitest)
- Config: `vitest.config.ts`
- Setup file: `src/test/setup.ts`
- Test files: `src/__tests__/` and colocated `*.test.ts` files
- Coverage thresholds: 20% lines, 20% branches, 15% functions, 20% statements
- Run: `npm test`

### E2E Tests (Playwright)
- Config: `playwright.config.ts`
- Test dir: `e2e/`
- Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Dev server starts automatically on `localhost:5173`
- Artifacts on failure: screenshots, videos, traces

### CI Pipeline (GitHub Actions `ci.yml`)
1. `npm ci`
2. `npm run i18n:validate`
3. `npm audit --audit-level=high` (blocks on high severity)
4. `npm run lint`
5. `npm test`
6. `npm run build`

---

## Database (Supabase)

- **Tables:** users, products, transactions, team_members, agent_logs
- **RLS:** Row Level Security enabled on all tables — always test queries with user context
- **Realtime:** Postgres replication enabled on `users` table
- **Migrations:** `supabase/migrations/` — run in order by filename date prefix
- **Client:** `src/lib/supabase.ts` (singleton, handles token refresh and session persistence)

### Applying Migrations Locally
```bash
supabase db push          # Apply pending migrations
supabase functions serve  # Serve edge functions locally
```

---

## Agent System

24+ AI agents organized in two tiers:

**Custom In-App Agents (`src/agents/custom/`):**
| Agent | File | Purpose |
|---|---|---|
| GeminiCoach | `GeminiCoachAgent.ts` | Health coaching via Gemini API |
| SalesCopilot | `SalesCopilotAgent.ts` | AI sales guidance |
| TheBee | `TheBeeAgent.ts` | Product/UX management |
| AgencyOS | `AgencyOSAgent.ts` | System orchestration (85+ commands) |
| Debugger | `DebuggerAgent.ts` | Production debugging |
| CodeReviewer | `CodeReviewerAgent.ts` | Code review automation |
| Scout | `ScoutAgent.ts` | Codebase exploration |
| ScoutExternal | `ScoutExternalAgent.ts` | Web research |
| DocsManager | `DocsManagerAgent.ts` | Documentation automation |
| ProjectManager | `ProjectManagerAgent.ts` | Project coordination |

**ClaudeKit Agents (`.claude/agents/`):** react-expert, nextjs-expert, nodejs-expert, typescript-expert, performance-expert, refactoring-expert, security-expert

All agents extend `BaseAgent` and are registered via the singleton `AgentRegistry`.

---

## CI/CD & Deployment

- **Hosting:** Vercel (auto-deploy on push to `main`)
- **CI:** GitHub Actions (Node 20.x)
- **Lighthouse CI:** Automated performance auditing on PRs
- **Build artifacts:** Uploaded to GitHub Actions for 7 days
- **Git hooks:** Husky pre-commit runs `npm run i18n:validate`

### Scripting Conventions
- Scripts in `scripts/` use `tsx` for TypeScript execution
- All scripts use ESM (`import.meta.url`, not `require`)
- Build uses `NODE_OPTIONS=--max-old-space-size=4096` (large codebase)

### Git Submodule Warning
If CI exits with code 128 related to a submodule (e.g., `agencyos-starter`), run:
```bash
git rm --cached <submodule-path>
```

---

## Design System

- **Primary brand color:** Deep Teal `#00575A`
- **Accent color:** Marigold `#FFBF00`
- **Dark mode:** `class` strategy (toggle via `ThemeProvider`)
- **Font families:** Outfit (display), Inter (body) — both with Vietnamese fallbacks
- **Design tokens:** `src/styles/design-tokens.ts` and `src/styles/design-system.css`
- **Tailwind config:** `tailwind.config.js` — custom colors, animations (pulse-slow, gradient-shift, float, shimmer)

---

## Key Files Quick Reference

| Purpose | File |
|---|---|
| App entry point | `src/main.tsx` |
| Root routing | `src/App.tsx` |
| Global types | `src/types.ts` |
| Zustand root store | `src/store/index.ts` |
| Supabase client | `src/lib/supabase.ts` |
| Commission logic | `src/utils/commission-logic.ts` |
| Policy engine | `src/hooks/usePolicyEngine.ts` |
| Auth hook | `src/hooks/useAuth.ts` |
| Wallet service | `src/services/walletService.ts` |
| i18n init | `src/i18n.ts` |
| EN translations | `src/locales/en.ts` |
| VI translations | `src/locales/vi.ts` |
| Vite config | `vite.config.ts` |
| ESLint config | `eslint.config.js` |
| Test setup | `src/test/setup.ts` |

---

## Common Pitfalls

1. **Missing i18n key** → Build/test fails. Always add to both `en.ts` and `vi.ts`.
2. **Importing React Query** → Not used. Will cause confusion or bundle bloat.
3. **Manual chunking Recharts/D3** → TDZ bug. Do not add to `manualChunks`.
4. **`<img>` without dimensions** → Causes CLS failures in Lighthouse CI.
5. **Hardcoding user-facing strings** → Violates i18n requirement; fails validation.
6. **Skipping `AdminRoute` wrapper** → Security bypass; always wrap admin pages.
7. **`UserRank` without explicit cast** → DB returns number; must cast when mapping to enum.
8. **Confusing `FinanceTransaction` and `SupabaseTransaction`** → Different shapes/purposes.
9. **Framer Motion in tests without mocking** → Causes hoisting/TDZ errors.
10. **VitePWA** → Disabled. Service Worker cleanup is handled manually in `main.tsx`.

---

*Last updated: 2026-02-27. Auto-generated from codebase analysis.*
