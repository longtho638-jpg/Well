# WellNexus Roadmap

## Current State (v2.5.1) — Production

**Live:** https://wellnexus.vn | **Build:** GREEN (6.74s) | **Tests:** 110 passing | **Audit:** 97/100

## Phase 1 & 2 — Completed

- ✅ Core foundation: React 19.2.4, Vite 7.3.1, TypeScript 5.9.3 strict, Zustand
- ✅ Distributor portal: marketplace, wallet, referral tree, MLM commissions (Bee 2.0)
- ✅ Admin panel: 8 modules (Overview, CMS, Partners, Finance, Policy Engine, Orders, Products, Audit Log)
- ✅ Agent-OS: 24+ agents, registry, supervisor orchestrator, ClaudeKit adapter
- ✅ Auth: Supabase, password recovery, auto-logout, RBAC
- ✅ Security: CSP/HSTS, RLS, HMAC webhook, encrypted tokens
- ✅ i18n: VI/EN parity (1592 keys), pre-commit + pre-test validation
- ✅ PWA: install prompt, offline support
- ✅ Infrastructure: Sentry, Vercel Analytics, CI/CD GitHub Actions (full pipeline)
- ✅ ESLint strict config: max-lines 200 LOC, zero violations
- ✅ Architecture refactor: all files under 200 LOC (skipBlankLines + skipComments)
- ✅ 15 C-suite SOPs: Founder, CEO, COO, CMO, CFO, CTO, CHRO, CXO, CSO, CAIO, CCO, CISO, Admin, User, Payment
- ✅ Founder Handover Package: `docs/founder-handover-package.md`
- ✅ Deep audit: 97/100 score, zero tech debt, production-clean

## Phase 3 — Next

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

## Tech Debt Status (2026-03-03)

| Priority | Item | Status |
|----------|------|--------|
| P1 | ESLint strict config (zero warnings) | ✅ Done |
| P1 | Playwright E2E for checkout + auth flows | Pending |
| P1 | RevenueChart backend filtering (1 TODO) | Known limitation |
| P2 | Replace remaining mock data with Supabase API calls | Partial |
| P2 | Performance monitoring (Sentry traces + Web Vitals) | ✅ Sentry configured |
| P3 | API layer abstraction (service → repository pattern) | Backlog |

## Versioning

| Version | Milestone | Date |
|---------|-----------|------|
| v1.0 | Core foundation | 2025-Q4 |
| v2.0 | Admin panel + distributor portal | 2026-01 |
| v2.5 | Agent-OS + AGI integration | 2026-02 |
| v2.5.1 | Founder handover ready (97/100 audit) | 2026-03-03 |
| v3.0 | HealthFi + Social Commerce + Policy Engine | TBD |
