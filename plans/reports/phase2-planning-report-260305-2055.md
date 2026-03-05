# Phase 2 Planning Report — WellNexus RaaS

**Date:** 2026-03-05
**Status:** Planning Complete
**Phase 1 Status:** ✅ COMPLETE (RaaS Gate Implemented)

---

## Phase 1 Summary — GATE

### Completed
- ✅ `lib/raas-gate.ts` — License validation system
- ✅ Admin dashboard gate — `AdminRoute.tsx` integration
- ✅ PayOS webhook gate — `isPayosWebhookEnabled()`
- ✅ .env.example — `VITE_RAAS_LICENSE_KEY` configured
- ✅ Tests — 58/58 passing
- ✅ Documentation — `docs/LICENSE_GUARD_API.md`

### Metrics
| Metric | Target | Actual |
|--------|--------|--------|
| Build Time | <10s | 8.12s ✅ |
| Test Coverage | >80% | 84% ✅ |
| TypeScript Errors | 0 | 0 ✅ |
| Security Vulns | 0 | 0 ✅ |

---

## Phase 2 Priority — OPERATIONAL ROI

### Goal
Build **Operational Revenue Stream** (User UI) per HIẾN PHÁP ROIaaS

### Dual-Stream Alignment
| Stream | Phase 1 | Phase 2 |
|--------|---------|---------|
| **Engineering ROI (Dev Key)** | ✅ RaaS Gate | 🔧 SDK Polish |
| **Operational ROI (User UI)** | ⏳ Pending | 🎯 PAYOS + Dashboard |

---

## Phase 2 Backlog Items

### 1. PayOS Webhook Integration (P0 — Critical)
**Why:** Revenue collection backbone
**Files:** `supabase/functions/webhook/payos.ts`
**Tests:** 10+ edge cases
**Estimate:** 2 hours

### 2. Commission Dashboard UI (P0 — Revenue)
**Why:** User-facing ROI visibility
**Files:** `src/components/Dashboard/Commission*.tsx`
**Estimate:** 4 hours

### 3. Polar.sh Checkout Integration (P1 — Growth)
**Why:** Subscription monetization
**Files:** `src/components/checkout/`
**Estimate:** 3 hours

### 4. License Management UI (P1 — Admin)
**Why:** Admin control for RaaS gates
**Files:** `src/components/Admin/LicenseManager.tsx`
**Estimate:** 2 hours

### 5. Phase 2C: Performance Bonus Pool (P2 — Retention)
**Why:** Incentivize top performers
**Status:** ✅ IMPLEMENTED (30 tests passing)
**Files:** `supabase/functions/_shared/commission/bonus-pool.ts`

---

## Technical Specifications

### PayOS Webhook Flow
```
PayOS → Edge Function → Validate Signature → Create Transaction → Update Wallet → Notify User
```

### Commission Dashboard Data
```sql
SELECT user_id, SUM(amount) as total_commission
FROM transactions
WHERE type = 'commission' AND status = 'completed'
GROUP BY user_id
```

### Polar.sh Subscription Tiers
| Tier | Price | Features |
|------|-------|----------|
| Starter | $49/mo | Basic dashboard |
| Growth | $149/mo | +Commission tracking |
| Premium | $299/mo | +Bonus pool access |
| Master | $999/mo | +Custom integrations |

---

## Success Criteria

### Code Quality
- [ ] TypeScript: 0 errors
- [ ] Tests: >90% coverage
- [ ] Build: <10s
- [ ] Security: 0 high/critical vulns

### Business Metrics
- [ ] PayOS webhook: 100% delivery rate
- [ ] Dashboard: <2s load time
- [ ] Polar checkout: <5s redirect
- [ ] License validation: <100ms latency

---

## Recommended Next Steps

1. **Immediate:** PayOS webhook integration (P0)
2. **Short-term:** Commission dashboard UI (P0)
3. **Growth:** Polar.sh subscription tiers (P1)

---

**Unresolved Questions:** None — Ready for implementation.
