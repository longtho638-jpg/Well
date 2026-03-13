# WellNexus 100/100 Binh Phap Uplift Plan

**Date:** 2026-03-13 | **Worker:** P2 | **Target:** apps/well ONLY

---

## Current Scores (6 Fronts)

| Front | Score | Gap | Priority |
|-------|-------|-----|----------|
| 1. Tech Debt | 4/10 | -6 | 🔴 CRITICAL |
| 2. Type Safety | 5/10 | -5 | 🔴 CRITICAL |
| 3. Performance | UNK | TBD | 🟡 HIGH |
| 4. Security | 7/10 | -3 | 🟡 HIGH |
| 5. UX Polish | UNK | TBD | 🟢 MEDIUM |
| 6. Documentation | 8/10 | -2 | 🟢 LOW |

**Total:** ~24/60 → Target: **60/60 (100%)**

---

## Phases Overview

### Phase 1: Tech Debt Liquidation (Priority 0)
**Goal:** Eliminate ALL console.log, :any, @ts-ignore

**Files to fix:**
- `src/payments/payos-handler.ts` - Remove console.log
- `src/payments/payos-helpers.ts` - Remove console.error
- `src/lib/raas-http-interceptor.ts` - Remove @ts-expect-error (4x)
- `src/lib/vibe-payment/autonomous-webhook-handler.ts` - Remove @ts-expect-error, @ts-ignore (3x)
- `src/services/__tests__/notification-channel-service.test.ts` - Remove @ts-ignore
- `src/__tests__/unit/usage-notification-service.test.ts` - Replace :any with proper types (20x)

**Success:**
```bash
grep -r "console\." src/ | wc -l  # = 0 (excl. test setup)
grep -r ": any" src/ | wc -l      # = 0
grep -r "@ts-" src/ | wc -l       # = 0
```

---

### Phase 2: Security Hardening (Priority 1)
**Goal:** Fix security gaps, generate lockfile

**Tasks:**
1. Generate pnpm-lock.yaml: `pnpm install`
2. Run security audit: `pnpm audit --audit-level=high`
3. Scan for hardcoded secrets in src/
4. Verify .env files in .gitignore

**Success:**
```bash
pnpm audit --audit-level=high  # 0 vulnerabilities
grep -r "sk-\|Bearer\|API_KEY" src/ | wc -l  # = 0
```

---

### Phase 3: Performance Baseline (Priority 2)
**Goal:** Measure and optimize build/bundle

**Tasks:**
1. Measure build time: `time pnpm build`
2. Analyze bundle: `pnpm build:analyze`
3. Run Lighthouse: `pnpm lighthouse`
4. Optimize if build > 10s or bundle > 500KB

**Success:**
- Build time < 10s
- Bundle size < 500KB (gzipped)
- LCP < 2.5s

---

### Phase 4: UX Verification (Priority 3)
**Goal:** Verify loading states, error boundaries

**Tasks:**
1. Audit all async components for loading states
2. Verify error boundaries present
3. Check empty states with illustrations
4. Test responsive design mobile/desktop

**Success:**
- All async ops have loading UI
- Error boundaries catch crashes
- Empty states have helpful UI

---

### Phase 5: Documentation Sync (Priority 4)
**Goal:** Update docs with current state

**Tasks:**
1. Update DEPLOYMENT_GUIDE.md with latest steps
2. Add tech debt elimination to changelog
3. Document security fixes
4. Update API_REFERENCE.md if changed

**Success:**
- docs/ reflects current architecture
- Changelog has recent fixes

---

## Execution Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
  (2h)      (1h)      (1h)      (2h)      (1h)
```

**Total estimated:** 7 hours

---

## Verification Commands (Run After All Phases)

```bash
# Front 1: Tech Debt
echo "=== Front 1: Tech Debt ==="
[ $(grep -r "TODO\|FIXME" src/ | wc -l) -eq 0 ] && echo "✅ 0 TODO/FIXME" || echo "❌ Has TODO/FIXME"
[ $(grep -r "console\.\(log\|warn\|error\)" src/ --include="*.ts" --include="*.tsx" | grep -v "test/setup" | wc -l) -eq 0 ] && echo "✅ 0 console.log" || echo "❌ Has console.log"

# Front 2: Type Safety
echo "=== Front 2: Type Safety ==="
[ $(grep -r ": any" src/ --include="*.ts" --include="*.tsx" | wc -l) -eq 0 ] && echo "✅ 0 :any types" || echo "❌ Has :any"
pnpm run build:check && echo "✅ TypeScript clean" || echo "❌ TS errors"

# Front 3: Performance
echo "=== Front 3: Performance ==="
time pnpm build  # Must complete < 10s

# Front 4: Security
echo "=== Front 4: Security ==="
pnpm audit --audit-level=high  # Must show 0 high/critical

# Front 5: UX (Manual)
echo "=== Front 5: UX ==="
echo "⚠️ Manual verification required"

# Front 6: Docs
echo "=== Front 6: Documentation ==="
[ -f docs/DEPLOYMENT_GUIDE.md ] && echo "✅ Deployment guide exists" || echo "❌ Missing deployment guide"
```

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking @ts-expect-error removal | High | Test after each fix |
| Security audit reveals critical vulns | High | Fix before deploy |
| Build time regression | Medium | Profile and optimize chunks |
| Test failures after type fixes | Medium | Run tests after each phase |

---

## Success Criteria

**100/100 Binh Phap = ALL fronts at 9/10 or higher:**
- 0 tech debt items (console.log, TODO, @ts-ignore)
- 0 `:any` types, 0 TS errors
- Build < 10s, bundle < 500KB
- 0 high/critical security vulnerabilities
- Loading/error states on all async UI
- Documentation complete and current

---

## Task Checklist

- [ ] Phase 1: Tech Debt Liquidation
- [ ] Phase 2: Security Hardening
- [ ] Phase 3: Performance Baseline
- [ ] Phase 4: UX Verification
- [ ] Phase 5: Documentation Sync
- [ ] Final Verification (all commands pass)
- [ ] Production Deploy & Smoke Test

---

**Unresolved Questions:**
1. Current production URL for smoke testing?
2. Lighthouse CI configured or manual run?
3. Any pending PRs that might conflict?
