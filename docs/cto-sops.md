# WellNexus CTO SOPs — Quy Trinh Cong Nghe & Ky Thuat

> SOPs cho CTO (Chief Technology Officer) — KIEN TRUC, DEV OPS, TECH DEBT, SECURITY, AI/ML.
> Cap nhat: 2026-03-03

---

## MUC LUC

1. [Kien Truc He Thong](#1-kien-truc-he-thong)
2. [Development Workflow](#2-development-workflow)
3. [CI/CD & Deployment](#3-cicd--deployment)
4. [Monitoring & Observability](#4-monitoring--observability)
5. [Security & Compliance](#5-security--compliance)
6. [Tech Stack Management](#6-tech-stack-management)
7. [Team Engineering](#7-team-engineering)
8. [AI/ML Integration](#8-aiml-integration)
9. [KPI Ky Thuat](#9-kpi-ky-thuat)

---

## 1. KIEN TRUC HE THONG

### 1.1 Stack hien tai

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + TypeScript + Vite | 19.2.4 / 5.9.3 / 7.3.1 |
| State | Zustand | 4.5.7 |
| UI | Tailwind + Framer Motion | 3.4.x / 11.x |
| Database | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth | Built-in |
| Hosting | Vercel (Edge) | Auto |
| AI | Vercel AI SDK + Google AI | 6.x |
| Email | Resend | Edge Functions |
| Payments | PayOS | QR Banking |
| Monitoring | Sentry | 10.40.0 |

### 1.2 Architecture decisions

| Decision | Choice | Ly do |
|----------|--------|-------|
| SPA vs SSR | SPA (Vite) | Don gian, PWA support |
| State mgmt | Zustand | Nhe, ko boilerplate |
| DB | Supabase | Free tier, RLS, realtime |
| Auth | Supabase Auth | Tich hop san, MFA |
| Deploy | Vercel Git | Auto deploy, preview |
| AI | Vercel AI SDK | Streaming, multi-provider |

### 1.3 ADR (Architecture Decision Record) template

```
## ADR-{number}: {title}
- Date: YYYY-MM-DD
- Status: proposed/accepted/deprecated
- Context: Van de can giai quyet
- Decision: Quyet dinh chon gi
- Consequences: Hau qua (tot/xau)
```

---

## 2. DEVELOPMENT WORKFLOW

### 2.1 Git workflow

| Flow | Mo ta |
|------|-------|
| Branch | `main` (production), feature branches |
| Commit | Conventional commits: `feat:`, `fix:`, `refactor:` |
| PR | Required review, CI must pass |
| Merge | Squash merge to main |
| Deploy | Auto on push to main |

### 2.2 Code standards

| Rule | Enforcement |
|------|-------------|
| TypeScript strict | `tsc --noEmit` (0 errors) |
| ESLint | `pnpm lint` (0 errors) |
| max-lines: 200 | ESLint error (skipBlankLines+skipComments) |
| No `any` types | ESLint warn |
| No console.log | ESLint error (allow warn/error) |
| No @ts-ignore | Grep check |
| i18n sync | `pnpm i18n:validate` (prebuild) |

### 2.3 Code review checklist

| # | Kiem tra |
|---|---------|
| 1 | TypeScript strict — no `any`, no `@ts-ignore` |
| 2 | File < 200 LOC |
| 3 | i18n keys in both en + vi |
| 4 | Error handling (try-catch, error boundaries) |
| 5 | Security (no secrets, XSS prevention) |
| 6 | Tests for new logic |
| 7 | No console.log in production code |

---

## 3. CI/CD & DEPLOYMENT

### 3.1 Pipeline (GitHub Actions)

```
Push to main
  → Install (pnpm install)
  → File size validation (--strict)
  → Security audit (npm audit)
  → i18n validation
  → Lint (eslint)
  → Tests (vitest + coverage)
  → Build (tsc + vite build)
  → E2E tests (Playwright Chromium)
  → Deploy (Vercel auto)
  → Smoke test (curl production HTTP 200)
```

### 3.2 Deployment checklist

| # | Kiem tra | Cong cu |
|---|---------|--------|
| 1 | Build pass (0 TS errors) | `pnpm build` |
| 2 | Tests pass (420+ tests) | `pnpm test:run` |
| 3 | Lint clean (0 errors) | `pnpm lint` |
| 4 | i18n synced | `pnpm i18n:validate` |
| 5 | CI/CD GREEN | GitHub Actions |
| 6 | Production HTTP 200 | `curl -sI wellnexus.vn` |

### 3.3 Rollback procedure

| Buoc | Hanh dong | Thoi gian |
|------|-----------|-----------|
| 1 | Phat hien loi (Sentry alert / manual) | 0-5 phut |
| 2 | Vercel Dashboard → Deployments | 1 phut |
| 3 | Click "Promote" on last good deployment | 1 phut |
| 4 | Verify HTTP 200 | 1 phut |
| 5 | Investigate root cause | 30 phut |
| 6 | Fix → PR → Review → Merge | 1-4h |

---

## 4. MONITORING & OBSERVABILITY

### 4.1 Monitoring stack

| Tool | Muc dich | Alert |
|------|----------|-------|
| Sentry | Error tracking, source maps | Email on new error |
| Vercel Analytics | Performance, Web Vitals | Dashboard |
| GitHub Actions | CI/CD status | Email on failure |
| Supabase Dashboard | DB health, API usage | Built-in |
| UptimeRobot (free) | Uptime monitoring | Email/Slack |

### 4.2 On-call rotation

| Ngay | Nguoi truc | Backup |
|------|-----------|--------|
| T2-T6 | Senior Dev | CTO |
| T7-CN | CTO | Senior Dev |

### 4.3 Incident response

| Severity | Mo ta | SLA | Ai xu ly |
|----------|-------|-----|----------|
| P0 | Site down, data loss | < 30 phut | CTO + All devs |
| P1 | Feature broken, payment fail | < 2h | On-call dev |
| P2 | UI bug, minor issue | < 24h | Assigned dev |
| P3 | Enhancement, tech debt | Sprint | Backlog |

---

## 5. SECURITY & COMPLIANCE

### 5.1 Security checklist

| # | Kiem tra | Tan suat |
|---|---------|----------|
| 1 | npm audit (high severity) | Moi build |
| 2 | No secrets in code | Moi PR |
| 3 | Supabase RLS enabled | Hang thang |
| 4 | CORS config dung | Hang thang |
| 5 | CSP + HSTS headers | Vercel config |
| 6 | Auth token security | Hang quy |
| 7 | Dependency updates | Hang tuan |

### 5.2 Secret management

| Secret | Noi luu | Ai access |
|--------|---------|-----------|
| SUPABASE_ANON_KEY | Vercel Env | CTO, devs |
| SENTRY_DSN | Vercel Env | CTO |
| RESEND_API_KEY | Supabase Secrets | CTO |
| GEMINI_API_KEY | Supabase Secrets | CTO |
| ADMIN_EMAILS | Vercel Env | CTO, CEO |

### 5.3 Backup & DR

| Hang muc | Strategy | RPO/RTO |
|----------|----------|---------|
| Database | Supabase daily backup | RPO < 24h |
| Code | Git (GitHub) | RPO = 0 |
| Config | Vercel + .env.example | Manual restore |
| DR Plan | `docs/DISASTER_RECOVERY.md` | RTO < 4h |

---

## 6. TECH STACK MANAGEMENT

### 6.1 Dependency update policy

| Loai | Tan suat | Cach lam |
|------|----------|---------|
| Patch (0.0.x) | Auto (Dependabot) | Merge neu CI green |
| Minor (0.x.0) | Hang tuan | Review changelog |
| Major (x.0.0) | Hang thang | Test ky, migration plan |
| Security fix | Ngay lap tuc | Hotfix |

### 6.2 Tech debt management

| Nguon | Cach phat hien | Xu ly |
|-------|----------------|-------|
| TODO/FIXME | `grep -r "TODO\|FIXME" src` | Sprint backlog |
| @ts-ignore | `grep -r "@ts-ignore" src` | Fix ngay |
| any types | ESLint warn | Fix trong sprint |
| Large files | ESLint max-lines | Refactor |
| Outdated deps | `npm outdated` | Update plan |

---

## 7. TEAM ENGINEERING

### 7.1 Engineering culture

| Practice | Mo ta |
|----------|-------|
| Code review | Moi PR can 1 approval |
| Pair programming | 2-4h/tuan cho complex tasks |
| Tech talks | 1 lan/2 tuan, team chia se |
| Retrospective | Cuoi moi sprint |
| Documentation | Update docs sau moi feature |

### 7.2 Sprint process

| Ngay | Hoat dong |
|------|-----------|
| T2 sang | Sprint planning (1h) |
| T2-T6 | Daily standup (15 phut) |
| T6 chieu | Sprint review + retro (1h) |

---

## 8. AI/ML INTEGRATION

### 8.1 AI features hien tai

| Feature | Provider | Trang thai |
|---------|----------|------------|
| Health Coach | Google AI (Gemini) | ✅ Active |
| Sales Copilot | Vercel AI SDK | ✅ Active |
| AGI Tool Registry | Multi-provider | ✅ Active |
| AI Action Center | Agent-OS | ✅ Active |

### 8.2 AI roadmap

| Feature | Timeline | Provider |
|---------|----------|----------|
| Policy Engine | Q2 2026 | Custom logic |
| Strategic Simulator | Q2 2026 | AI-powered |
| Personalized recommendations | Q3 2026 | Embedding search |
| Chatbot CS | Q3 2026 | Vercel AI SDK |

---

## 9. KPI KY THUAT

| KPI | Muc tieu |
|-----|----------|
| Uptime | > 99.5% |
| Build time | < 10s |
| Test coverage | > 80% |
| Tests passing | 100% |
| TypeScript errors | 0 |
| ESLint errors | 0 |
| LCP (Largest Contentful Paint) | < 2.5s |
| TTFB | < 200ms |
| Deploy frequency | > 5/tuan |
| MTTR (Mean Time To Recovery) | < 30 phut |
| Security vulns (high) | 0 |

---

## PHU LUC

| Tai lieu | File |
|----------|------|
| System Architecture | `docs/system-architecture.md` |
| Code Standards | `docs/code-standards.md` |
| Deployment Guide | `docs/DEPLOYMENT_GUIDE.md` |
| Disaster Recovery | `docs/DISASTER_RECOVERY.md` |
| All SOPs | `docs/*-sops.md` |
