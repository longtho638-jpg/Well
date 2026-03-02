# i18n Validation & Production Monitoring Research
**Date:** 2026-03-02 | **Report ID:** researcher-02-i18n-monitoring

---

## 1. i18n Key Validation Pipeline

### Problem Space
- Hardcoded or missing translation keys break production UX (WellNexus precedent: raw keys displayed)
- Manual verification impossible at scale; automation critical
- Must catch sync issues **before** deployment

### Validation Tooling

**i18n-check** (Primary Tool)
- Compares source lang (en.ts) against all target langs (vi.ts, etc.)
- Detects: missing keys, format mismatches, placeholder discrepancies
- CLI: `i18n-check --locales messageExamples --source en-us`
- Identifies unused keys with `--unused` flag

**ESLint Custom Rules**
- Catch `t('unknown.key')` calls at lint time
- Run i18next-scanner to extract all t() usages
- Compare against locale file structure
- Pre-commit integration: husky + lint-staged

**Implementation Pattern**
```bash
# Pre-commit: Extract used keys
i18next-scanner src/ --config scanner.config.js

# Compare with translations
i18n-check --locales vi --source en
  → Fails if mismatch detected → blocks commit

# CI verification (GitHub Actions)
name: i18n Validation
on: [push, pull_request]
jobs:
  validate:
    - run: i18n-check --locales vi,ja --source en --fail-on-missing
```

### Critical Lesson (WellNexus 2026-02-03)
- Code had `t('landing.roadmap.stages.metropolis.name')`
- Locale had `empire` instead of `metropolis`
- Raw key displayed on production
- **Solution:** Pre-build validation step that fails build if keys don't match

---

## 2. Production Monitoring Stack

### Sentry Setup (Error Tracking)

**Essential Configuration**
- Install: `@sentry/react` + Sentry wizard for source maps
- Init in main.ts BEFORE app render (highest priority)
- DSN stored in env vars (never hardcoded)
- Source maps critical: `vite.config.ts` → `build.sourcemap: true`

**React 19 Integration**
- Use `Sentry.reactErrorHandler()` with `createRoot` callbacks
- Wrap with `<Sentry.ErrorBoundary>` for component errors
- Call `Sentry.setUser()` on auth to associate errors with users

**Performance & Replay**
- Enable `browserTracingIntegration()` for API/navigation traces
- Session Replay: `replayIntegration()` at 10% sample rate (100% in dev)
- Captures 5 Web Vitals: LCP, CLS, FCP, TTFB, INP

### Health Check Endpoint

**Implementation** (Vercel Edge Function)
```typescript
// pages/api/health.ts
export default async (req) => {
  const checks = {
    database: await db.health(),
    cache: await redis.ping(),
    api: response.status === 200
  };
  return new Response(
    JSON.stringify(checks),
    { status: allHealthy ? 200 : 503 }
  );
};
```

**Monitoring Integration**
- Vercel cron job polls `/api/health` every 5min
- Status: dashboard.vercel.com → Monitoring tab
- Alerts via Slack webhook on failure

### Vercel Analytics
- Built-in Web Vitals tracking (no extra config)
- Shows LCP, FCP, CLS by page/device
- Complements Sentry (frontend errors vs performance)

### Stack Synergy
| Layer | Tool | Purpose |
|-------|------|---------|
| **Errors** | Sentry | Exceptions, error boundaries, stack traces |
| **Performance** | Sentry APM + Vercel Analytics | API latency, Web Vitals, real user data |
| **Availability** | Health endpoint + cron | Uptime, service health |
| **Logs** | Vercel Functions Logs | Runtime errors, cold starts |

---

## 3. Build Pipeline Hardening

### TypeScript Validation (Pre-build Gate)

**Core Issue:** Vite doesn't type-check; it only transpiles
- Vite build can succeed with TS errors
- Must run `tsc --noEmit` separately in CI

**Strict Mode Enforcement**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**CI Validation Steps**
```bash
# Step 1: Type check (catches all TS errors)
tsc --noEmit

# Step 2: i18n validation (prevents raw keys)
i18n-check --locales vi --source en --fail-on-missing

# Step 3: Build (Vite transpile only)
vite build

# Step 4: Test (unit + E2E)
npm test

# All must PASS before merge to main
```

### Pre-build Plugin (Vite)

**vite-plugin-checker:** Reports TS errors in browser during dev
```typescript
// vite.config.ts
import { viteTscPlugin } from 'vite-plugin-checker'

export default {
  plugins: [
    viteTscPlugin({ typescript: { tsconfigPath: './tsconfig.json' } })
  ]
}
```

**vite-plugin-validate-env:** Ensures all required env vars at build time
- Fails build if `VITE_SENTRY_DSN` or other critical vars missing
- Prevents "undefined is not a function" in production

### Common CI Failures & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| TypeScript errors in prod | `npm run build` succeeds but runtime fails | Add `tsc --noEmit` to CI before vite build |
| Missing i18n keys | Locale file out of sync with code | Add i18n-check gate with `--fail-on-missing` |
| Env var undefined | Build lacks required secrets | Use vite-plugin-validate-env |
| Source maps missing | Sentry can't decode stack traces | Ensure `vite.config.ts` has `build.sourcemap: true` |

---

## Implementation Roadmap for Well

### Phase 1: i18n Validation (1-2h)
1. Add `i18n-check` to package.json
2. Create pre-commit hook via husky
3. Add GitHub Actions workflow

### Phase 2: Sentry Integration (2-3h)
1. Install @sentry/react, run wizard
2. Configure source maps in vite.config.ts
3. Wrap app with ErrorBoundary + init Sentry in main.ts
4. Test: trigger dummy error, verify in Sentry dashboard

### Phase 3: Build Pipeline (1-2h)
1. Add `tsc --noEmit` to CI pipeline
2. Enable strict mode in tsconfig.json
3. Add vite-plugin-checker for dev feedback
4. Document in README

### Phase 4: Health Monitoring (1-2h)
1. Create /api/health endpoint
2. Configure Vercel cron job (5min interval)
3. Set up Slack webhook alerts
4. Dashboard: verify Vercel Analytics + Sentry live data

---

## Unresolved Questions

- How aggressive should i18n-check be? Fail on unused keys (extra strict)?
- Sentry session replay: 10% sample vs 100% dev — need team consensus
- Health check SLA: alert threshold (e.g., 2 consecutive failures)?
- Cost monitoring: Sentry pricing tier for Well's error volume?

---

## Sources

- [i18n-check: Validate i18n translation files](https://github.com/lingualdev/i18n-check)
- [Lingual: How to validate React i18next](https://lingual.dev/blog/how-to-validate-your-react-i18next-application/)
- [i18next Documentation](https://www.i18next.com/overview/configuration-options)
- [Sentry React Guide](https://docs.sentry.io/platforms/javascript/guides/react/)
- [DEV Community: Sentry + React Vite Integration](https://dev.to/werliton/monitoramento-de-erros-com-sentry-no-react-vite-guia-completo-3km1)
- [Vite Configuration](https://vite.dev/config/)
- [TypeScript Strict Mode in CI/CD Pipelines](https://medium.com/@tomhag_17/fixing-typescript-compilation-errors-in-a-react-vite-ci-cd-pipeline-a-step-by-step-guide-84806fd0b872)
