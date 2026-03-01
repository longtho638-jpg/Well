# WellNexus Roadmap

## Current State (v2.5.0) — Production

**Live:** https://wellnexus.vn | **Build:** GREEN | **Tests:** 380+ passing

## Phase 1 & 2 — Completed

- Core foundation: React 19, Vite 7, TypeScript strict, Zustand
- Distributor portal: marketplace, wallet, referral tree, MLM commissions
- Admin panel: 8 modules (Overview, CMS, Partners, Finance, Policy Engine, Orders, Products, Audit Log)
- Agent-OS: 24+ agents, registry, supervisor orchestrator, ClaudeKit adapter
- Auth: Supabase, password recovery, auto-logout, RBAC
- Security: CSP/HSTS, RLS, HMAC webhook, encrypted tokens
- i18n: VI/EN parity, pre-test validation
- PWA: install prompt, offline support
- Infrastructure: Sentry, Vercel Analytics, CI/CD GitHub Actions

## Phase 3 — In Progress / Next

### High Priority
- [ ] **Policy Engine** — business rule logic + rule management UI (Admin)
- [ ] **Strategic Simulator** — market simulation engine + UI integration
- [ ] **HealthFi Wallet** — token staking, rewards, HealthFi points ledger

### Medium Priority
- [ ] **Social Commerce** — social sharing flows, viral referral mechanics
- [ ] **Advanced Analytics** — cohort analysis, retention, LTV dashboard
- [ ] **E2E Tests** — Playwright smoke tests for critical flows (checkout, auth)

### Low Priority / Backlog
- [ ] Mobile app wrapper (Capacitor or React Native)
- [ ] Web3 wallet integration (optional, pending product decision)
- [ ] Storybook component docs

## Tech Debt Priorities

| Priority | Item | Status |
|----------|------|--------|
| P1 | ESLint strict config (zero warnings baseline) | Pending |
| P1 | Playwright E2E for checkout + auth flows | Pending |
| P2 | Replace remaining mock data with Supabase API calls | Partial |
| P2 | Performance monitoring (Sentry traces + Web Vitals) | Partial |
| P3 | API layer abstraction (service → repository pattern) | Backlog |

## Versioning

| Version | Milestone |
|---------|-----------|
| v1.0 | Core foundation |
| v2.0 | Admin panel + distributor portal |
| v2.5 | Agent-OS + AGI Go Live optimization (current) |
| v3.0 | HealthFi + Social Commerce + Policy Engine |
