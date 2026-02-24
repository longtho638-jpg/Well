# 🏯 BINH PHÁP INFINITE LOOP — Well Project

## Vòng Lặp Vô Tận Đến 100/100 Diamond Standard

**Created**: 2026-02-09T20:22:10+07:00
**Project**: WellNexus Distributor Portal (wellnexus.vn)
**Stack**: React 19 + TypeScript + Vite 7 + Zustand + Framer Motion + i18next
**Status**: THIÊN ĐƯỜNG (HEAVEN) stage — nhưng CẦN RE-AUDIT theo tiêu chuẩn ngành 2026

---

## 📊 BASELINE SCAN (2026-02-09)

| Metric                   | Current                | Target      | Gap                 |
| :----------------------- | :--------------------- | :---------- | :------------------ |
| `: any` types            | **0**                  | 0           | ✅ PASS             |
| `as any` casts           | **0**                  | 0           | ✅ PASS             |
| `console.*` (non-logger) | **13**                 | 0           | ❌ 13 to fix        |
| `TODO/FIXME`             | **0**                  | 0           | ✅ PASS             |
| Tests                    | **310/310** (31 files) | 100%        | ✅ PASS             |
| Build                    | **✅ 6.74s**           | <15s        | ✅ PASS             |
| Bundle (main)            | **273KB**              | <150KB gzip | ⚠️ Needs code-split |
| Vendor chunk             | **1998KB**             | <500KB      | 🔴 CRITICAL         |
| Production URL           | **200 OK**             | 200         | ✅ PASS             |
| Git                      | Clean, `main`          | -           | ✅ PASS             |

---

## 🎯 INDUSTRY STANDARDS TO CERTIFY

### Standard 1: Social Commerce / eCommerce Platform (Primary)

- [ ] **Performance**: Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] **Bundle Optimization**: Vendor chunk < 500KB (currently 1998KB!)
- [ ] **SEO**: Meta tags, OG tags, structured data, sitemap
- [ ] **Accessibility**: WCAG 2.1 AA compliance
- [ ] **Security**: CSP headers, XSS protection, CSRF mitigation
- [ ] **PWA**: Installable, offline-capable, push notifications
- [ ] **i18n**: 100% coverage vi/en, no raw keys

### Standard 2: Max Level Go-Live Protocol (11 Fronts)

- [ ] Front 1-6: Tech Debt, Type Safety, UX, SOPs, Performance, Security
- [ ] Front 7: CI/CD Enforcement (GitHub Actions green)
- [ ] Front 8: Interactive Execution Protocol
- [ ] Front 9: Environmental Sync
- [ ] Front 10: Canonical Domain Management
- [ ] Front 11: Multi-Account Management
- [ ] Front 12: Decision Dominance

### Standard 3: LCCO (Lead Capture & Conversion Optimization)

- [ ] Hotline Pulse / CTA visibility
- [ ] Mobile Action Bar
- [ ] Trust Badge Injection
- [ ] Theme-Invariant Contrast
- [ ] SEO WOW Optimization v3.17

### Standard 4: Enterprise Production Readiness

- [ ] Zero console.log in production
- [ ] Error boundaries on all routes
- [ ] Sentry/monitoring integration verified
- [ ] Rate limiting on API calls
- [ ] Input validation (Zod) on all forms

---

## 🔄 THE INFINITE LOOP (Vòng Lặp Vô Tận)

```
┌──────────────────────────────────────────────────────┐
│                    BINH PHÁP LOOP                     │
│                                                       │
│   ┌─────────┐    ┌──────────┐    ┌──────────────┐    │
│   │  SCAN   │───>│ GENERATE │───>│  DELEGATE    │    │
│   │ (Audit) │    │  /cook   │    │  CC CLI      │    │
│   └─────────┘    └──────────┘    └──────┬───────┘    │
│        ▲                                 │            │
│        │          ┌──────────┐          │            │
│        │          │  VERIFY  │<─────────┘            │
│        └──────────│ (Browser │                       │
│                   │  + Tests)│                       │
│   100/100? ──NO──>└──────────┘                       │
│      │                                                │
│     YES                                               │
│      │                                                │
│   ┌──▼──┐                                            │
│   │ DONE│ → CERTIFIED DIAMOND STANDARD               │
│   └─────┘                                            │
└──────────────────────────────────────────────────────┘
```

---

## 📋 WAVE BREAKDOWN (4 Waves × Tasks)

### 🌊 WAVE 1: FOUNDATION (Tech Debt + Performance) — Tasks 1-4

**Task 1: Console Cleanup + Logger Migration**

```
/cook Migrate all 13 remaining console.* calls in src/ to the namespaced logger utility at src/utils/logger.ts. Files: validate-config.ts (console.error → configLogger.error), devTools.ts and logger.ts already use proper patterns. Ensure zero console.* in production code. Run build + tests after.
```

**Task 2: Vendor Bundle Code-Splitting**

```
/cook Split the 1998KB vendor chunk. Configure vite.config.ts manualChunks to separate: (1) react+react-dom into 'react-vendor', (2) framer-motion into 'animation', (3) recharts into 'charts', (4) @supabase into 'supabase', (5) lucide-react into 'icons', (6) i18next into 'i18n', (7) zod+react-hook-form into 'forms'. Target: no single chunk > 500KB. Run build and verify all chunks.
```

**Task 3: ESLint Strict Mode + No-Console Rule**

```
/cook Update eslint.config.js to add 'no-console': 'error' rule with allow: ['warn', 'error'] exception only for logger.ts. Run lint and fix any violations. Ensure zero lint errors on full src/ scan.
```

**Task 4: Error Boundary Audit**

```
/cook Audit all React Router routes in src/App.tsx. Ensure EVERY lazy-loaded route is wrapped in a <Suspense> + <ErrorBoundary> pair. Create a reusable RouteErrorBoundary component if not exists. Test by simulating a lazy-load failure.
```

### 🌊 WAVE 2: UX & ACCESSIBILITY — Tasks 5-7

**Task 5: Accessibility WCAG 2.1 AA Audit**

```
/cook Perform WCAG 2.1 AA accessibility audit on the landing page and dashboard. Fix: (1) all images must have alt text, (2) all interactive elements must have aria-labels, (3) color contrast ratio >= 4.5:1 for text, (4) keyboard navigation must work for all menus, (5) focus indicators must be visible. Use src/utils/a11y.ts patterns.
```

**Task 6: Core Web Vitals Optimization**

```
/cook Optimize Core Web Vitals: (1) Add loading="lazy" to all below-fold images, (2) Preload critical CSS/fonts in index.html, (3) Add fetchpriority="high" to hero images, (4) Defer non-critical JS, (5) Add width/height to all img tags to prevent CLS. Verify with Lighthouse audit if possible.
```

**Task 7: Mobile PWA Polish**

```
/cook Verify and enhance PWA: (1) Check manifest.json has all required fields, (2) Verify service worker caches critical assets, (3) Test A2HS prompt flow, (4) Ensure bottom navigation bar has 44px minimum touch targets, (5) Test offline mode gracefully degrades. Follow Mobile WOW Standard v2.3.
```

### 🌊 WAVE 3: SEO & CONVERSION — Tasks 8-10

**Task 8: SEO Meta & Structured Data**

```
/cook Implement comprehensive SEO: (1) Add react-helmet-async meta tags on ALL pages (title, description, og:image, twitter:card), (2) Verify sitemap.xml is generated and accessible at /sitemap.xml, (3) Add JSON-LD structured data for Organization and Product schemas on landing page, (4) Add canonical URLs. Verify no page has missing meta tags.
```

**Task 9: Lead Capture LCCO Enhancement**

```
/cook Implement LCCO patterns from Binh Pháp on the landing page: (1) Add a pulsing CTA button in hero section, (2) Mobile floating action bar with primary conversion action, (3) Trust badges with social proof metrics (partners count, revenue), (4) Theme-invariant contrast on CTA backgrounds. Follow the Hotline Pulse and Express Hero patterns.
```

**Task 10: i18n Complete Coverage Verification**

```
/cook Run comprehensive i18n audit: (1) Execute npm run i18n:validate and fix any missing keys, (2) grep all t() calls and cross-reference with vi.ts and en.ts, (3) Ensure no hardcoded strings in any JSX component, (4) Verify date/currency formatting uses localized formatters, (5) Test switching language and verify all text updates. Zero raw keys tolerance.
```

### 🌊 WAVE 4: SECURITY & CERTIFICATION — Tasks 11-13

**Task 11: Security Hardening Audit**

```
/cook Execute security audit: (1) Verify all forms use Zod validation schemas, (2) Confirm DOMPurify sanitizes user content, (3) Audit auth flow for token refresh and auto-logout, (4) Verify CSP headers in vercel.json are comprehensive, (5) Check no API keys exposed in client-side code, (6) Verify rate limiting on sensitive endpoints. Zero vulnerabilities.
```

**Task 12: CI/CD Green Pipeline Verification**

```
/cook Verify CI/CD pipeline: (1) Check .github/workflows for proper build+test+deploy chain, (2) Ensure all environment variables are set in Vercel dashboard, (3) git push a test commit and verify GitHub Actions passes, (4) Verify Vercel auto-deploys on main branch push, (5) Confirm production URL returns 200. Follow Front 7 protocol.
```

**Task 13: Final Diamond Standard Certification**

```
/cook Execute FINAL certification audit — the Binh Pháp Diamond Standard check:
1. grep -r ": any" src/ → must be 0
2. grep -r "as any" src/ → must be 0
3. grep -r "console\." src/ | grep -v logger | grep -v test | grep -v debug → must be 0
4. grep -r "TODO\|FIXME" src/ → must be 0
5. npm run build → must pass clean, no chunk > 500KB
6. npm run test -- --run → must be 100% pass
7. npm run lint → must be 0 errors
8. curl -sIL https://wellnexus.vn → must return 200
9. Verify PWA installable
10. Verify i18n no raw keys
Report the score out of 100.
```

---

## 🤖 CC CLI DELEGATION PROTOCOL

### Startup Command

```bash
cd ~/Well && claude --dangerously-skip-permissions
```

### Task Injection Pattern (Two-Call Standard)

```
# Call 1: Send task text (NO \n)
/cook [task description]

# Call 2: Send Enter separately
\n
```

### Loop Control Logic

```
FOR each wave (1-4):
  FOR each task in wave:
    1. INJECT task via CC CLI
    2. WAIT for completion (monitor output)
    3. VERIFY:
       - Check build passes
       - Check tests pass
       - Check specific metrics improved
    4. IF FAIL → Re-inject with fix context
    5. IF PASS → Log score, move to next task
  END

  WAVE CHECKPOINT:
    - Run full Binh Pháp scan
    - Calculate current score
    - IF 100/100 → BREAK (CERTIFIED!)
    - IF < 100 → Continue to next wave
END
```

### Scoring Formula (100 points)

| Category      | Points | Criteria                            |
| :------------ | :----- | :---------------------------------- |
| Type Safety   | 15     | 0 `:any` + 0 `as any`               |
| Tech Debt     | 10     | 0 console.\* (non-logger) + 0 TODO  |
| Tests         | 15     | 100% pass rate                      |
| Build         | 10     | Clean build, < 15s                  |
| Performance   | 15     | No chunk > 500KB, Core Web Vitals   |
| Security      | 10     | Zod validation, CSP headers, auth   |
| SEO           | 5      | Meta tags, structured data, sitemap |
| i18n          | 5      | 100% coverage, no raw keys          |
| Accessibility | 5      | WCAG 2.1 AA basic compliance        |
| Production    | 10     | 200 OK, CI/CD green, PWA            |

---

## 🚀 EXECUTION STATUS

| Wave | Task                     | Status     | Score Impact            |
| :--- | :----------------------- | :--------- | :---------------------- |
| W1   | T1: Console Cleanup      | ⏳ PENDING | +10                     |
| W1   | T2: Vendor Bundle Split  | ⏳ PENDING | +15                     |
| W1   | T3: ESLint Strict        | ⏳ PENDING | +5                      |
| W1   | T4: Error Boundaries     | ⏳ PENDING | +5                      |
| W2   | T5: Accessibility        | ⏳ PENDING | +5                      |
| W2   | T6: Core Web Vitals      | ⏳ PENDING | +5                      |
| W2   | T7: PWA Polish           | ⏳ PENDING | +5                      |
| W3   | T8: SEO Meta             | ⏳ PENDING | +5                      |
| W3   | T9: LCCO Enhancement     | ⏳ PENDING | +5                      |
| W3   | T10: i18n Verification   | ⏳ PENDING | +5                      |
| W4   | T11: Security Audit      | ⏳ PENDING | +5                      |
| W4   | T12: CI/CD Green         | ⏳ PENDING | +5                      |
| W4   | T13: Final Certification | ⏳ PENDING | +25 (cumulative verify) |

**Current Estimated Score: 60/100** (baseline passes but gaps in performance, SEO, a11y)

---

_Plan Created: 2026-02-09T20:22:10+07:00 | Binh Pháp Protocol v2026.2_
