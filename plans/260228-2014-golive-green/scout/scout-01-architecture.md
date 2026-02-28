# Scout Report: WellNexus Architecture Audit (Go-Live Readiness)

## 1. Database & Security (Supabase)
- **Migrations Path**: `apps/well/supabase/migrations/`
- **Critical Files**:
  - `20241203000001_initial_schema.sql`: Core tables (`users`, `orders`, `transactions`).
  - `20260207_rls_policies.sql`: Main security layer for user data isolation.
  - `20260228_subscription_plans.sql`: Latest subscription logic.
  - `20260224_critical_bug_fixes.sql`: Stability patches.
- **Verification**: Check if all migrations are applied (`supabase db remote commit`).

## 2. Edge Functions (Back-end logic)
- **Functions Path**: `apps/well/supabase/functions/`
- **Critical Functions**:
  - `payos-create-payment` & `payos-webhook`: Core checkout flow.
  - `agent-reward`: Commission calculation logic.
  - `send-email`: Transactional emails (Templates: `order-confirmation`, `withdrawal-approved`).
- **Verification**: Check logs for any startup errors in production.

## 3. Frontend Key Pages
- **Auth Flow**: `/login`, `/signup`, `/confirm-email`.
- **Commerce**: `/marketplace`, `/product/:id`, `/checkout`.
- **Earning/Wallet**: `/wallet`, `/withdrawal`.
- **Network**: `/network` (Tree view for referral system).
- **Admin**: `/admin/policy-engine` (Commission rules), `/admin/finance` (Withdrawal approvals).

## 4. Environment Variables Checklist
- **Frontend (`.env`)**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_API_URL`
- **Edge Functions (Supabase Secrets)**:
  - `PAYOS_CLIENT_ID`
  - `PAYOS_API_KEY`
  - `PAYOS_CHECKSUM_KEY`
  - `RESEND_API_KEY` (for `send-email` function)

## Unresolved Questions
- Are PayOS webhooks correctly linked to the production Edge Function URL?
- Has the `pg_cron` automation for agent rewards been verified on the remote DB?
