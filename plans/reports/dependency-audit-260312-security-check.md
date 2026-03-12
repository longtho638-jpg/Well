# Dependency Audit Report - WellNexus RaaS

**Date:** 2026-03-12
**Type:** Security & Compliance Audit
**Scope:** All npm/pnpm dependencies
**Binh Pháp:** 用間篇 (Dụng Gián) - Dependency Intelligence

---

## 🔴 CRITICAL FINDINGS

### 1. NO LOCKFILE DETECTED

**Severity:** CRITICAL
**Impact:** Production deployment risk, inconsistent builds

```
❌ pnpm-lock.yaml: MISSING
❌ package-lock.json: MISSING
```

**Risk:**
- Non-deterministic builds across environments
- Different dependency versions on CI/CD vs local
- Potential security vulnerabilities from transitive deps
- Cannot reproduce exact production state

**Action Required:**
```bash
# Generate lockfile immediately
pnpm install --lockfile-only

# Commit to git
git add pnpm-lock.yaml
git commit -m "chore: add pnpm lockfile for deterministic builds"
```

---

## 📊 DEPENDENCY INVENTORY

### Production Dependencies (19 packages)

| Package | Version | Risk Level |
|---------|---------|------------|
| @ai-sdk/anthropic | 3.0.50 | ✅ Fixed |
| @ai-sdk/google | ^1.2.22 | ⚠️ Floating |
| @ai-sdk/openai | ^1.3.24 | ⚠️ Floating |
| @ai-sdk/react | ^1.2.12 | ⚠️ Floating |
| @hookform/resolvers | ^5.2.2 | ⚠️ Floating |
| @react-pdf/renderer | ^4.3.2 | ⚠️ Floating |
| @sentry/react | ^10.40.0 | ⚠️ Floating |
| @supabase/supabase-js | ^2.98.0 | ⚠️ Floating |
| ai | ^6.0.105 | ⚠️ Floating |
| dompurify | ^3.3.1 | ⚠️ Floating |
| framer-motion | ^11.18.2 | ⚠️ Floating |
| i18next | ^25.8.13 | ⚠️ Floating |
| i18next-browser-languagedetector | ^8.2.1 | ⚠️ Floating |
| lucide-react | ^0.563.0 | ⚠️ Floating |
| react | ^19.2.4 | ⚠️ Floating |
| react-dom | ^19.2.4 | ⚠️ Floating |
| react-helmet-async | ^2.0.5 | ⚠️ Floating |
| react-hook-form | ^7.71.2 | ⚠️ Floating |
| react-i18next | ^16.5.4 | ⚠️ Floating |
| react-router-dom | ^6.30.3 | ⚠️ Floating |
| recharts | ^2.15.4 | ⚠️ Floating |
| zod | ^3.25.76 | ⚠️ Floating |
| zustand | ^4.5.7 | ⚠️ Floating |

### Dev Dependencies (28 packages)

| Package | Version | Risk Level |
|---------|---------|------------|
| @eslint/js | ^9.39.3 | ⚠️ Floating |
| @playwright/test | ^1.58.2 | ⚠️ Floating |
| @testing-library/dom | ^10.4.1 | ⚠️ Floating |
| @testing-library/jest-dom | ^6.9.1 | ⚠️ Floating |
| @testing-library/react | ^16.3.2 | ⚠️ Floating |
| @testing-library/user-event | ^14.6.1 | ⚠️ Floating |
| @types/react | ^19.2.14 | ⚠️ Floating |
| @types/react-dom | ^19.2.3 | ⚠️ Floating |
| @typescript-eslint/eslint-plugin | ^8.56.1 | ⚠️ Floating |
| @typescript-eslint/parser | ^8.56.1 | ⚠️ Floating |
| @vitejs/plugin-react | ^5.1.4 | ⚠️ Floating |
| @vitest/coverage-v8 | ^4.0.18 | ⚠️ Floating |
| @vitest/ui | ^4.0.18 | ⚠️ Floating |
| ajv | 6.12.6 | ✅ Fixed (old) |
| autoprefixer | ^10.4.27 | ⚠️ Floating |
| claudekit | ^0.9.4 | ⚠️ Floating |
| dotenv | ^17.3.1 | ⚠️ Floating |
| eslint | ^9.39.3 | ⚠️ Floating |
| eslint-plugin-jsx-a11y | ^6.10.2 | ⚠️ Floating |
| eslint-plugin-react | ^7.37.5 | ⚠️ Floating |
| eslint-plugin-react-hooks | ^7.0.1 | ⚠️ Floating |
| glob | ^13.0.6 | ⚠️ Floating |
| globals | ^17.4.0 | ⚠️ Floating |
| happy-dom | ^20.7.0 | ⚠️ Floating |
| husky | ^8.0.3 | ⚠️ Floating |
| jsdom | ^27.4.0 | ⚠️ Floating |
| lighthouse | 13.0.3 | ✅ Fixed |
| lint-staged | ^16.3.1 | ⚠️ Floating |
| minimatch | ^10.2.4 | ⚠️ Floating |
| postcss | ^8.5.6 | ⚠️ Floating |
| rollup | ^4.59.0 | ⚠️ Floating |
| rollup-plugin-visualizer | 7.0.1 | ✅ Fixed |
| sharp | ^0.34.5 | ⚠️ Floating |
| sharp-cli | ^5.2.0 | ⚠️ Floating |
| tailwindcss | ^3.4.19 | ⚠️ Floating |
| ts-morph | ^27.0.2 | ⚠️ Floating |
| tsx | ^4.21.0 | ⚠️ Floating |
| typescript | ^5.9.3 | ⚠️ Floating |
| vite | ^7.3.1 | ⚠️ Floating |
| vite-plugin-image-optimizer | 2.0.3 | ✅ Fixed |
| vitest | ^4.0.18 | ⚠️ Floating |
| wrangler | ^4.24.0 | ⚠️ Floating |

---

## 🔍 SECURITY ANALYSIS

### Known Vulnerabilities

**Status:** UNABLE TO SCAN (no lockfile)

`npm audit` requires lockfile to analyze transitive dependencies.

**Common vulnerabilities in similar stacks:**

| Package | Common CVEs | Impact |
|---------|-------------|--------|
| react-router-dom | XSS via params | High |
| dompurify | XSS if misconfigured | Critical |
| @supabase/supabase-js | Auth bypass (old versions) | Critical |
| sharp | Buffer overflow (old versions) | High |
| postcss | Command injection (old versions) | Critical |

---

## 📋 RECOMMENDATIONS

### Priority 1: CRITICAL (Do Immediately)

1. **Generate Lockfile**
   ```bash
   pnpm install --lockfile-only
   git add pnpm-lock.yaml
   ```

2. **Pin Critical Dependencies**
   Change floating versions to fixed for security-critical packages:
   ```json
   {
     "dompurify": "3.3.1",
     "@supabase/supabase-js": "2.98.0",
     "react": "19.2.4",
     "react-dom": "19.2.4"
   }
   ```

3. **Add Security Audit to CI/CD**
   ```yaml
   # .github/workflows/security-audit.yml
   - name: Security Audit
     run: pnpm audit --audit-level=high
   ```

### Priority 2: HIGH (This Week)

4. **Update Outdated Packages**
   ```bash
   pnpm outdated
   pnpm update
   ```

5. **Review ajv Version**
   - Current: 6.12.6 (very old)
   - Latest: 8.x+
   - Action: Test and upgrade

6. **Enable Automated Security Scanning**
   - GitHub Dependabot
   - Snyk integration
   - npm audit in pre-commit hook

### Priority 3: MEDIUM (This Month)

7. **Dependency Cleanup**
   ```bash
   pnpm install --frozen-lockfile
   pnpm dedupe
   ```

8. **Add Dependency Linting**
   ```bash
   pnpm add -D pnpm-audit-ci pnpm-outdated
   ```

---

## 🎯 ACTION PLAN

| # | Task | Priority | Owner | Due |
|---|------|----------|-------|-----|
| 1 | Generate pnpm-lock.yaml | CRITICAL | Dev | NOW |
| 2 | Pin critical security deps | CRITICAL | Dev | Today |
| 3 | Run pnpm audit with lockfile | HIGH | Dev | Today |
| 4 | Run pnpm outdated | HIGH | Dev | Today |
| 5 | Enable Dependabot | MEDIUM | Dev | This week |
| 6 | Add security to CI/CD | MEDIUM | Dev | This week |
| 7 | Update ajv to v8 | LOW | Dev | Next sprint |

---

## ✅ VERIFICATION COMMANDS

```bash
# After generating lockfile
pnpm install --frozen-lockfile  # Should succeed
pnpm audit --audit-level=high   # Check vulnerabilities
pnpm outdated                   # Check for updates
pnpm dedupe                     # Remove duplicates
```

---

## 📌 UNRESOLVED QUESTIONS

1. Why was lockfile not committed to git?
2. Is there a .gitignore entry blocking pnpm-lock.yaml?
3. What's the current production deployment process without lockfile?

---

**Audit Status:** ⚠️ INCOMPLETE (requires lockfile generation)
**Next Step:** Run `pnpm install` to generate lockfile, then re-run audit
