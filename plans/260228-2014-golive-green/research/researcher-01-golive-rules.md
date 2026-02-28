# Researcher Report: GOLIVE GREEN Rules & Requirements (WellNexus)

**Date:** 2026-02-28
**Scope:** `apps/well` (WellNexus Platform)
**Standard:** Binh Pháp Agency OS (Antigravity v2.2)

---

## 1. Quality Battle Fronts (Binh Pháp Quality)
Every deployment must pass these 6 quality gates:

| Front | Requirement | Verification Command |
|-------|-------------|----------------------|
| **始計 (Tech Debt)** | 0 `console.log`, `TODO`, `FIXME`, `@ts-ignore` | `grep -r "console\." src` / `grep -r "TODO\|FIXME" src` |
| **作戰 (Type Safety)** | 100% Type Safety (0 `any` types) | `grep -r ": any" src` / `npx tsc --noEmit` |
| **謀攻 (Performance)** | Build < 10s, Bundle < 500KB (gzip) | `time npm run build` |
| **軍形 (Security)** | 0 high/critical vulnerabilities, 0 secrets | `npm audit --audit-level=high` / `grep -r "API_KEY" src` |
| **兵勢 (UX Polish)** | Loading states, Error boundaries, Responsive | Manual visual audit / `npm run test:ui` |
| **虛實 (Documentation)** | Updated Roadmap, Changelog, SOPs | `ls docs/` / `cat CHANGELOG.md` |

## 2. CI/CD & Deployment Rules (Binh Pháp CICD)
"GREEN" is only achieved after successful production verification.

### Mandatory Pipeline
1. **CI/CD Status:** `gh run list` must show `conclusion: success`.
2. **Build Integrity:** `npm run build` must exit with code 0.
3. **Vercel Check:** `curl -sI https://wellnexus.vn` must return **HTTP 200**.
4. **Smoke Test:** Verify critical flows (Login, Marketplace, Wallet) on the live site.

### Forbidden Patterns
- ❌ **Push-and-Done:** Reporting success immediately after `git push`.
- ❌ **Direct Deploy:** Using `vercel --prod` (Must use `git push origin main`).

## 3. Project-Specific Requirements (apps/well)
Derived from `package.json` and `CLAUDE.md`.

### i18n Sync Protocol (Critical)
- **Validation:** `npm run i18n:validate` must pass.
- **Sync:** Keys must exist in both `vi.ts` and `en.ts`.
- **No Raw Keys:** Visual check to ensure no `t('landing.missing.key')` appears on UI.

### Test Suite
- **Requirement:** `npm run test:run` must pass 100%.
- **Current Benchmark:** 349+ tests (as of 2026-02-28).
- **Pre-test:** `i18n:validate` runs automatically before tests.

### Build Configuration
- **Memory Allocation:** Build requires `NODE_OPTIONS=--max-old-space-size=4096`.
- **Pre-build:** `sitemap:generate` and `i18n:validate` must run.

## 4. Final Verification Report Format
All "Done" reports MUST include:
- Build: ✅ exit code 0
- Tests: ✅ [N] tests passed
- CI/CD: ✅ GitHub Actions [status] [conclusion]
- Production: ✅ HTTP 200 (verified at [URL])
- i18n Sync: ✅ Verified no raw keys

---
**Unresolved Questions:**
- None. Requirements are clearly defined in global rules and project-specific docs.