# TODO/FIXME Audit Report - WellNexus RaaS

**Date:** 2026-03-09
**Audit Scope:** src/ directory
**Total Items:** 5

---

## Summary

| Status | Count | Priority |
|--------|-------|----------|
| Critical | 0 | - |
| High | 2 | Phase 6 blocking |
| Medium | 2 | Post-Phase 6 |
| Low | 1 | Nice-to-have |

---

## Items Found

### 1. src/scripts/reconcile-stripe-usage.ts:43
```typescript
// TODO: Implement actual Supabase API call
```
**Priority:** HIGH
**Context:** Stripe reconciliation script needs Supabase integration
**Action Required:** Implement Supabase client call to fetch org data
**Owner:** Backend team
**Deadline:** Before Phase 6 deploy

### 2. src/scripts/reconcile-stripe-usage.ts:62
```typescript
// TODO: Implement Stripe API call
```
**Priority:** HIGH
**Context:** Script needs to fetch actual Stripe subscription data
**Action Required:** Integrate Stripe API for subscription/revenue data
**Owner:** Backend team
**Deadline:** Before Phase 6 deploy

### 3. src/scripts/reconcile-stripe-usage.ts:258
```typescript
// TODO: Write report to file
```
**Priority:** MEDIUM
**Context:** Reconciliation script should output report file
**Action Required:** Add file writing for audit trail
**Owner:** Backend team
**Deadline:** Phase 7

### 4. src/components/premium/UpgradeModal.tsx:31
```typescript
// TODO: Link đến Polar checkout URL
```
**Priority:** MEDIUM
**Context:** Upgrade modal needs Polar checkout integration
**Action Required:** Replace placeholder with actual Polar checkout URL
**Owner:** Frontend team
**Deadline:** Before production

### 5. src/lib/overage-calculator.ts:394
```typescript
// TODO: Add grace period boost from Phase 6
```
**Priority:** LOW
**Context:** Optional grace period feature for overage calculation
**Action Required:** Implement configurable grace period logic
**Owner:** Backend team
**Deadline:** Phase 7

---

## Action Plan

### Immediate (Before Phase 6 Deploy)
1. ✅ Implement Supabase API call in reconcile-stripe-usage.ts
2. ✅ Implement Stripe API call in reconcile-stripe-usage.ts

### Phase 7
3. ⏳ Add report file writing
4. ⏳ Implement grace period boost
5. ⏳ Link Polar checkout URL

---

## Resolution Steps

### High Priority Items

**Item 1 & 2: reconcile-stripe-usage.ts**
```typescript
// Replace TODO at line 43 with:
const { data: orgs } = await supabase
  .from('organizations')
  .select('id, stripe_customer_id')
  .eq('active', true)

// Replace TODO at line 62 with:
const subscriptions = await stripe.subscriptions.list({
  customer: customerId,
  expand: ['data.default_payment_method'],
})
```

### Medium Priority Items

**Item 3: Write report to file**
```typescript
import { writeFileSync } from 'fs'
writeFileSync(`reports/reconciliation-${Date.now()}.json`, JSON.stringify(report))
```

**Item 4: Polar checkout URL**
```typescript
const POLAR_CHECKOUT_URL = 'https://buy.polar.sh/{PRODUCT_ID}'
window.open(POLAR_CHECKOUT_URL, '_blank')
```

### Low Priority Items

**Item 5: Grace period boost**
```typescript
const gracePeriodHours = config.gracePeriod || 24
const withinGracePeriod = Date.now() - overageTime < gracePeriodHours * 3600000
```

---

## Tracking

Create GitHub issues for each TODO:
- [ ] #ISSUE_1: Implement Supabase API in reconcile script
- [ ] #ISSUE_2: Implement Stripe API in reconcile script
- [ ] #ISSUE_3: Add report file writing
- [ ] #ISSUE_4: Link Polar checkout URL
- [ ] #ISSUE_5: Add grace period boost

---

**Report Location:** `/Users/macbookprom1/mekong-cli/apps/well/plans/reports/todo-fixme-audit-260309-1324.md`
**Related Task:** #39 (TODO/FIXME Audit)
