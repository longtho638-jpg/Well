# WellNexus Project Memory

## Project Info
- **Stack:** React 19, TypeScript, Vite 7, Zustand, Framer Motion, Supabase
- **Deploy:** Vercel → wellnexus.vn
- **Tests:** 33 test files, 322 tests (all passing)
- **Build:** ~6s, 0 TypeScript errors

## Architecture
- `src/App.tsx` — all routes, lazy-loaded, SafePage wrapper (ErrorBoundary+Suspense)
- `AdminRoute` — checks isAuthenticated + isAdmin (email whitelist via VITE_ADMIN_EMAILS)
- `useDashboard` hook — dashboard data layer
- `useSignup` — Supabase auth.signUp → inserts into `users` table, captures sponsor_id
- `orderService` — inserts into `transactions` table (type: 'sale')

## PWA Status
- VitePWA plugin DISABLED (commented out in vite.config.ts)  
- `public/sw.js` = cleanup SW (unregisters stale caches, Safari-safe)
- `public/manifest.json` = full PWA manifest present
- `index.html` links manifest + registers cleanup SW on load

## Key Fixes Applied (2026-02-24)
1. `NotFoundPage` now used as catch-all route (was redirecting to `/` silently)
2. `vite.config.ts.TEMP_ABORT` dangling temp file deleted

## Supabase Edge Functions
- `payos-create-payment` — auth-verified, HMAC signature, calls PayOS API
- `payos-webhook`, `payos-cancel-payment`, `payos-get-payment`
- `agent-reward`, `agent-worker`, `gemini-chat`, `send-email`
- Secrets needed: PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY, RESEND_API_KEY, GEMINI_API_KEY, WEBHOOK_SECRET

## Env Vars Required
- VITE_SUPABASE_URL (set)
- VITE_SUPABASE_ANON_KEY
- VITE_ADMIN_EMAILS
- VITE_SENTRY_DSN (optional)
- VITE_VAPID_PUBLIC_KEY (optional)

## Code Quality
- 0 TODO/FIXME/HACK comments in src/
- 0 `: any` type violations
- 0 console.log in production code (uses structured logger)
- All 30 pages + 8 admin sub-pages confirmed present
