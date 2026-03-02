# Payment & Checkout Flow Audit — RaaS Release
**Date:** 2026-03-02 | **Project:** WellNexus | **Scope:** Payment, Checkout, Commission, Wallet

---

## Executive Summary

5 bugs found. 2 CRITICAL (data corruption / broken UX), 2 HIGH (money logic), 1 MEDIUM.

---

## CRITICAL

### BUG-01: QR Code Always `undefined` → PayOS Modal Shows Broken Image
**File:** `src/services/payment/payos-client.ts:55` + `src/lib/vibe-payment/payos-adapter.ts:105`
**Severity:** CRITICAL

`createPayment` only returns `{ checkoutUrl, orderCode }` — `qrCode` is never populated:
```ts
// payos-client.ts:55 — qrCode silently dropped
return { checkoutUrl: result.checkoutUrl, orderCode: result.orderCode } as PaymentResponse;

// payos-adapter.ts:105 — SDK also omits qrCode (optional in VibePaymentResponse)
return { checkoutUrl: result.checkoutUrl as string, orderCode: result.orderCode as number };
```
`QRPaymentModal` renders `<img src={paymentData.qrCode} />` — renders broken `<img src={undefined}>`.
User sees an empty QR box; cannot complete PayOS bank payment.

**Fix:** Forward `qrCode` from Edge Function response through the adapter chain:
```ts
// payos-adapter.ts
return { checkoutUrl: ..., orderCode: ..., qrCode: result.qrCode as string | undefined };
// payos-client.ts
return { checkoutUrl: result.checkoutUrl, orderCode: result.orderCode, qrCode: result.qrCode } as PaymentResponse;
```

---

### BUG-02: Fake Withdrawal Submit — No Real RPC Call
**File:** `src/components/withdrawal/use-withdrawal-form-state-and-validation.ts:87`
**Severity:** CRITICAL

`handleSubmit` in the unused-but-present hook replaces real withdrawal with a 2-second fake delay:
```ts
// Line 87 — no RPC, no DB write
await new Promise(resolve => setTimeout(resolve, 2000));
setIsSubmitting(false);
setIsSuccess(true);  // user sees "success" — nothing actually happened
```
The active `WithdrawalForm` (used by `WithdrawalPage`) uses the Zod form and calls `withdrawalService.createWithdrawalRequest` correctly. However the **mock hook is still exported and can be imported by mistake** by any future developer, causing silent loss of withdrawal requests with no error surfaced.

**Fix:** Delete `use-withdrawal-form-state-and-validation.ts` entirely — it is dead code with a dangerous fake submit.

---

## HIGH

### BUG-03: Commission Rate Inconsistency — Higher Ranks Paid Less
**File:** `src/utils/business/commission.ts:10` vs `src/utils/business/index.ts:121`
**Severity:** HIGH

Two competing commission functions with contradictory rate tables:

| Source | THIEN_LONG (rank 1) | CTV (rank 8) |
|--------|---------------------|--------------|
| `business/commission.ts` | **21%** (LESS) | 25% (MORE) |
| `business/index.ts` | **30%** (MORE) | 21% (LESS) |

`commission.ts` has the logic **inverted**: top ranks (low enum value) get 21%, entry ranks get 25%. The comment reads `"Top ranks (21%)"` which confirms this design — but contradicts standard MLM practice where higher ranks earn more. `getCommissionRateByRank` in `index.ts` gives THIEN_LONG 30% — the opposite.

Neither function is imported in production financial flows (only in tests). If `commission.ts` is the canonical source and is ever wired up, top-rank distributors will receive 4-9% less commission than they earn.

**Fix:** Align both functions. If `index.ts` rates (30%→21% descending) are the business spec, delete `commission.ts` or invert its logic.

---

### BUG-04: GROW Token VND Rate Inconsistency — Portfolio Value Wrong by 5x
**File:** `src/pages/Wallet.tsx:13` vs `src/utils/business/wealthEngine.ts:22` and `src/utils/business/index.ts:38`
**Severity:** HIGH

```ts
// Wallet.tsx — rate: 1 GROW = 50,000 VND
const totalPortfolioVND = totalShopBalance / 1000 + (totalGrowBalance * 50000);

// wealthEngine.ts + business/index.ts — rate: 1 GROW = 10,000 VND
const GROW_TO_VND_RATE = 10000;
```

The displayed portfolio value uses 50,000 VND/GROW; all business logic calculations (equity valuation, staking rewards, business valuation) use 10,000 VND/GROW — a **5x discrepancy**. Users see inflated portfolio on the Wallet page.

**Fix:** Define a single `GROW_VND_RATE` constant in a shared `src/constants/tokenomics.ts` and import everywhere.

---

## MEDIUM

### BUG-05: Withdrawal Minimum Amount — Two Different Values (100K vs 2M)
**File:** `src/components/withdrawal/withdrawal-form-zod-schema-and-min-amount.ts:8` vs `src/components/withdrawal/use-withdrawal-form-state-and-validation.ts:29`
**Severity:** MEDIUM

```ts
// Zod schema (active WithdrawalForm): 2,000,000 VND
export const MIN_WITHDRAWAL = 2_000_000;

// Manual hook (dead code but document drift risk): 100,000 VND
const MIN_WITHDRAWAL = 100000;
```

Active form correctly enforces 2M VND minimum. The dead-code hook shows 100K minimum label to user if it were ever activated. Since BUG-02 exists (delete the hook), this resolves with BUG-02 fix.

---

## Non-Issues (Verified Safe)

- **OrderCode collision risk:** Max `99999999` (8 digits), well within PayOS int32 (2,147,483,647). At 1 order/sec, tsPart cycles every 100K seconds (~27h). With 3-digit random suffix, collision probability is low for current traffic. Acceptable.
- **Double-click submit:** `isSubmitting` guard properly set at line 80 before async work; `disabled={isSubmitting}` on submit button. Protected.
- **Webhook idempotency:** `VALID_TRANSITIONS` state machine in `autonomous-webhook-handler.ts` prevents re-processing terminal states. Safe.
- **Cancellation refund race:** `cancelWithdrawal` fallback uses `increment_pending_balance` RPC only after `status='cancelled'` update succeeds. Acceptable sequencing.
- **Cart cleared before order record:** `clearCart()` at line 69 runs **after** `orderService.createOrder()` at line 52 succeeds. Correct order.

---

## Summary Table

| ID | Severity | File | Impact |
|----|----------|------|--------|
| BUG-01 | CRITICAL | `payos-client.ts:55`, `payos-adapter.ts:105` | PayOS QR flow completely broken — no payment possible |
| BUG-02 | CRITICAL | `use-withdrawal-form-state-and-validation.ts:87` | Dead mock code silently swallows withdrawal; deletion risk |
| BUG-03 | HIGH | `business/commission.ts:10` vs `business/index.ts:121` | Top distributors underpaid if wrong function wired up |
| BUG-04 | HIGH | `Wallet.tsx:13` vs `wealthEngine.ts:22` | Portfolio value 5x inflated on wallet page |
| BUG-05 | MEDIUM | `withdrawal-form-zod-schema-and-min-amount.ts:8` | Duplicate min constant; resolves with BUG-02 fix |

---

## Unresolved Questions

1. What is the canonical GROW→VND rate? Business spec needed to reconcile 10,000 vs 50,000.
2. Is `commission.ts` the intended source of truth for rates, or `business/index.ts`? The two tables contradict each other and no production code currently imports either.
3. Does the PayOS Edge Function (`payos-create-payment`) return a `qrCode` field? If the Edge Function doesn't pass it back, BUG-01 fix requires Edge Function changes too.
