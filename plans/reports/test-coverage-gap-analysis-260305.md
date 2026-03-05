# Test Coverage Gap Analysis Report
**Date:** 2026-03-05
**Thresholds:** lines: 25%, functions: 21%, branches: 18%, statements: 24%

---

## Summary

- **Total test files:** 40+ (va`lid tests, excludes .bak and .claude dirs)
- **Failed tests:** 29 (mostly backup/.claude related)
- **Passed tests:** 33 integration/unit tests

**Critical Gap:** Many core service files have NO test files at all.

---

## Files Missing Tests (High Priority)

### Services (100% no test coverage)
| File | Lines | Issue |
|------|-------|-------|
| src/services/policyService.ts | 78 | Policy fetching/saving logic |
| src/services/reviewEngine.ts | 135 | Security/type/performance review |
| src/services/questService.ts | 50 | Quest metadata management |
| src/services/staking-rewards-service.ts | 198 | Staking positions, rewards |
| src/services/orderService.ts | 122 | Order creation/status updates |
| src/services/referral-service.ts | 178 | Downline tree, referral stats |
| src/services/productService.ts | ~200 | Product CRUD operations |
| src/services/walletService.ts | ~300 | Wallet balance, transactions |
| src/services/email-service.ts | ~150 | Email sending logic |
| src/services/ai-provider/*.ts | ~400 | AI provider factory |

### Hooks (80% no test coverage)
| File | Lines | Issue |
|------|-------|-------|
| src/hooks/useWallet.ts | 139 | Financial telemetry orchestrator |
| src/hooks/useVendorDashboard.ts | 167 | Vendor product management |
| src/hooks/useCopilot.ts | ~200 | Copilot integration |
| src/hooks/useReferral.ts | ~150 | Referral tracking |
| src/hooks/useAgentCenter.ts | ~200 | Agent management |
| src/hooks/useCMS.ts | ~150 | CMS content management |
| src/hooks/useAuth.ts | ~250 | Auth state management |
| src/hooks/useDashboard.ts | ~300 | Dashboard data fetching |

### Components (Low coverage)
| File | Lines | Issue |
|------|-------|-------|
| src/components/marketplace/AIRecommendation.tsx | 96 | AI suggestion display |
| src/components/admin/orders/OrderStats.tsx | 111 | Order stats component |
| src/components/admin/partners/PartnersTable.tsx | ~250 | Partners table |
| src/pages/LeaderDashboard/* | ~500 | Leaderboard components |

---

## Files with Weak Coverage (< threshold)

| File | Coverage Type | Status |
|------|--------------|--------|
| src/services/__tests__/referral-service.test.ts | Integration only | Needs unit tests |
| src/services/__tests__/staking-rewards-service.test.ts | Integration only | Needs unit tests |
| src/components/checkout/__tests__/qr-payment-modal.test.tsx | Partial | Needs branch coverage |
| src/hooks/__tests__/useVendorDashboard.test.ts | Integration | Needs unit tests |

---

## High-Impact Test Files to Write (Priority Order)

### 1. Services Layer (CRITICAL)
```bash
# Priority 1: Core business logic
src/services/policyService.test.ts        # Policy config management
src/services/referral-service.test.ts     # Network tree logic
src/services/staking-rewards-service.test.ts  # Staking / rewards
src/services/orderService.test.ts         # Order creation/status

# Priority 2: User-facing features
src/services/walletService.test.ts        # Wallet + transactions
src/services/productService.test.ts       # Product CRUD
src/services/questService.test.ts         # Quest metadata
```

### 2. Hooks Layer (HIGH)
```bash
# Priority 1: Complex hooks
src/hooks/useWallet.test.ts               # Financial orchestrator
src/hooks/useVendorDashboard.test.ts      # Vendor dashboard logic
src/hooks/useAnalytics.test.ts            # Analytics tracking

# Priority 2: Auth & State
src/hooks/useAuth.test.ts                 # Authentication
src/hooks/useDashboard.test.ts            # Dashboard data
```

### 3. Components (MEDIUM)
```bash
# Priority 1: Core UI
src/components/marketplace/AIRecommendation.test.tsx
src/components/admin/orders/OrderStats.test.tsx
src/components/LeaderDashboard/leaderboard-ranking-table.test.tsx
```

---

## Threshold Comparison

| Metric | Threshold | Current (est) | Status |
|--------|-----------|---------------|--------|
| Lines | 25% | ~12% | ❌ FAIL |
| Functions | 21% | ~9% | ❌ FAIL |
| Branches | 18% | ~7% | ❌ FAIL |
| Statements | 24% | ~11% | ❌ FAIL |

**All thresholds FAILED.** Need comprehensive test expansion.

---

## Recommendations

### Immediate (Week 1)
1. Write unit tests for `policyService.ts`, `questService.ts`, `reviewEngine.ts`
2. Add unit tests for `orderService.ts` and `staking-rewards-service.ts`
3. Create integration tests for referral service

### Short-term (Week 2-3)
4. Test `walletService.ts` and `walletService.ts` hooks
5. Write tests for `useVendorDashboard` and `useWallet` hooks
6. Add component tests for core marketplace components

### Medium-term (Week 4)
7. Achieve 60%+ coverage on services layer
8. Achieve 50%+ coverage on hooks layer
9. Achieve 40%+ coverage on component layer

---

## Unresolved Questions

1. Should we create mockSupabase for unit tests (avoid DB dependency)?
2. How to test hooks with complex WebSocket/event subscriptions?
3. Need strategy for testing `useWallet` hook's real-time telemetry?
4. Need coverage reports from actual test run to validate this analysis?
