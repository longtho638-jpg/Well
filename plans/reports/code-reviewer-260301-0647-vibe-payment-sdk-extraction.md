# Code Review: vibe-payment SDK Extraction

**Date:** 2026-03-01
**Scope:** `packages/vibe-payment/` — 3 new files + index.ts + tsconfig.json
**Slug:** vibe-payment-sdk-extraction

---

## Scope

- Files reviewed: 5 (3 new + 2 modified)
- Existing SDK context: `types.ts`, `payos-adapter.ts`, `autonomous-webhook-handler.ts`
- Local Well app copies compared as baseline
- TypeScript compile: 0 errors (both SDK and Well app)

---

## Overall Assessment

Clean, well-structured extraction. Type safety is solid, no `any` usage, architectural consistency with existing SDK files is maintained. Two actionable bugs found (security-relevant signature drop + error-swallowing regression), plus one pre-existing architectural concern surfaced by the extraction.

---

## Critical Issues

None.

---

## High Priority Findings

### H1 — `createBillingWebhookConfig` silently drops `orderId` param

**File:** `packages/vibe-payment/billing-webhook-orchestrator.ts:113-119`

`VibeWebhookConfig.onOrderPaid` signature is:
```ts
onOrderPaid?: (event: VibeWebhookEvent, orderId: string) => Promise<void>;
```

But `createBillingWebhookConfig` wraps it as:
```ts
onOrderPaid: params.onPaymentSuccess
  ? (event) => params.onPaymentSuccess!(event)   // ← orderId silently dropped
  : undefined,
```

The factory's `onPaymentSuccess` callback type only takes `(event)`, so every caller using this convenience factory loses the `orderId` (order.id from DB) without a type error — TypeScript accepts it because the wrapper satisfies the contract by ignoring the second arg.

This is **identical in the local Well app copy**, so it's a pre-existing bug being faithfully preserved. But since this factory is now part of the public SDK surface, it should be fixed or explicitly noted.

**Fix:**
```ts
export function createBillingWebhookConfig(params: {
  webhookSecret: string;
  checksumKey: string;
  onPaymentSuccess?: (event: VibeWebhookEvent, orderId: string) => Promise<void>;
  onPaymentCancelled?: (event: VibeWebhookEvent, orderId: string) => Promise<void>;
}): VibeWebhookConfig {
  return {
    webhookSecret: params.webhookSecret,
    checksumKey: params.checksumKey,
    onOrderPaid: params.onPaymentSuccess,
    onOrderCancelled: params.onPaymentCancelled,
  };
}
```

---

### H2 — Double `parseWebhookEvent` call: HMAC computed twice, comment misleading

**File:** `packages/vibe-payment/billing-webhook-orchestrator.ts:72-76`

```ts
// Step 2: Parse event for tenant resolution (best-effort)
event = await provider.parseWebhookEvent(rawPayload, signature, config.checksumKey);
```

`processWebhookEvent` (in `autonomous-webhook-handler.ts:86`) already calls `parseWebhookEvent` once. The orchestrator calls it a second time with the comment "lightweight — cached by provider" — but `PayOSAdapter.parseWebhookEvent` has **no caching**; it recomputes HMAC-SHA256 and re-verifies on every call. The SDK comment that justified this ("cached by provider") was removed during extraction but the double-call remains.

This is not a security vulnerability (verification still passes), but it is wasted HMAC computation on every successful webhook, and it's a misleading contract expectation for future providers.

**Fix options (pick one):**
1. Have `processWebhookEvent` return the parsed event alongside the result, avoiding the re-parse.
2. Accept the double-call but remove the misleading "cached" assumption from the contract comment.
3. Add optional result event to `WebhookProcessingResult`:
```ts
| { status: 'processed'; orderCode: number; newStatus: VibePaymentStatusCode; event?: VibeWebhookEvent }
```

---

## Medium Priority Improvements

### M1 — `lastError` can be `undefined` when `maxAttempts <= 0`

**File:** `packages/vibe-payment/retry-with-backoff.ts:47-69`

If caller passes `maxAttempts: 0`, the loop body never executes, `lastError` remains `undefined`, and `throw lastError` throws `undefined`. Uncommon but a library should guard it.

```ts
// Add at top of withRetry:
if (cfg.maxAttempts <= 0) throw new Error('maxAttempts must be >= 1');
```

### M2 — `console.error` in SDK public export surface

**File:** `packages/vibe-payment/billing-webhook-orchestrator.ts:93`

```ts
deps.onBillingComplete(result).catch((err) =>
  console.error('[vibe-payment] onBillingComplete callback failed:', err),
);
```

SDK libraries should not `console.error` — callers should control logging. Pass error to `deps.onRetry`-style hook or re-expose via a log callback. The existing `autonomous-webhook-handler.ts` already has this same pattern (4 locations) — consistently present but worth noting as tech debt.

**Minimal fix:** Add optional `onError?: (err: unknown) => void` to `BillingOrchestrationDeps` and use it here instead of `console.error`.

### M3 — State machine casing mismatch is latent footgun (pre-existing, surfaced by extraction)

**File:** `packages/vibe-payment/autonomous-webhook-handler.ts:21-32`

`VALID_TRANSITIONS` keys are lowercase (`'pending'`, `'paid'`, `'cancelled'`), but `VibePaymentStatusCode` values are UPPERCASE (`'PENDING'`, `'PAID'`, `'CANCELLED'`). The lookup `VALID_TRANSITIONS[order.status]` depends on `order.status` coming from the DB as lowercase. If a DB record ever stores uppercase (e.g., due to a migration or a different writer), `isValidTransition` returns `false` always (key not found → `undefined`) and every webhook is silently ignored.

The handler calls `updateOrderStatus(order.id, order.status, newStatus.toLowerCase(), ...)` — writing lowercase — so the write side is consistent. But `findOrder` is injected by the caller; the SDK cannot enforce the casing. Add a `.toLowerCase()` guard:

```ts
function isValidTransition(current: string, next: VibePaymentStatusCode): boolean {
  const allowed = VALID_TRANSITIONS[current.toLowerCase()];
  if (!allowed) return false;
  return allowed.includes(next);
}
```

---

## Low Priority Suggestions

### L1 — `tsconfig.json` uses `"module": "commonjs"` but SDK targets Edge Functions

The SDK is consumed by Supabase Edge Functions (Deno/ESM). `"module": "commonjs"` is fine while the SDK is source-imported via path aliases (no compilation step). If the SDK is ever built to `dist/`, consumers will get CJS output which Deno/ESM environments cannot `require`. Consider `"module": "ESNext"` or `"NodeNext"` for future-proofing.

### L2 — `secureCompare` early-returns on length mismatch, leaking length

**File:** `packages/vibe-payment/payos-adapter.ts:66-73`

```ts
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;  // ← timing leak on length
  ...
}
```

For HMAC comparison, both strings should always be 64-char hex so length equality is structurally guaranteed. This is acceptable in practice but worth a comment confirming the invariant, rather than relying on silent correctness.

### L3 — Minor: SDK index.ts exports `VALID_TRANSITIONS` (internal constant)

**File:** `packages/vibe-payment/index.ts` → re-exported from `autonomous-webhook-handler.ts:213`

`VALID_TRANSITIONS` is an implementation detail of the state machine. Exporting it widens the public API surface unnecessarily. `isValidTransition` is sufficient for external use.

### L4 — Stale comment removed in extraction is fine; only one comment regressed

The SDK copy of `billing-webhook-orchestrator.ts` removed two local-specific comment lines vs the Well app copy (confirmed by diff). The `retry-with-backoff.ts` SDK copy correctly updated the import path example from `@/lib/vibe-payment` to `@agencyos/vibe-payment`. No issues.

---

## Positive Observations

- **HMAC via Web Crypto API** — `computeHmacSha256` uses `crypto.subtle`, correct for Edge Function environments (no Node.js `crypto` dep). Timing-safe HMAC comparison is properly implemented.
- **TypeScript strict mode, 0 errors** — both SDK and app compile clean.
- **No `any` types** in any of the 3 new files.
- **`withRetry` jitter math** is correct: `Math.max(0, ...)` prevents negative delays; jitter is bounded at `±jitterFactor * capped`.
- **`payment-analytics-types.ts` is pure types** — no runtime code, correct design for an analytics type module.
- **Extraction fidelity** is high — only intentional differences (import path update, comment cleanup) vs local copy.
- **Fire-and-forget callbacks** consistently use `.catch()` to prevent unhandled promise rejections.
- **`WebhookProcessingResult` discriminated union** is cleanly typed and used correctly throughout.
- **`BillingOrchestrationResult.tenantContext`** is properly `null` (not `undefined`) — consistent null semantics.

---

## Recommended Actions

1. **[H1] Fix `createBillingWebhookConfig`** — add `orderId` to `onPaymentSuccess`/`onPaymentCancelled` param types so callers don't silently lose it. Fix in both SDK and Well app local copy.
2. **[H2] Resolve double `parseWebhookEvent`** — either return `event` from `processWebhookEvent` result, or document the double-call explicitly and remove the false "cached" assumption.
3. **[M3] Add `.toLowerCase()` to `isValidTransition`** — defensive guard against DB casing inconsistency. One-liner, zero risk.
4. **[M1] Guard `maxAttempts <= 0`** in `withRetry`.
5. **[M2] Replace SDK `console.error`** with optional `onError` hook in `BillingOrchestrationDeps` (or at minimum document it as intentional).
6. **[L1]** Decide on `module` target now before SDK is published as a built package.
7. **[L3]** Un-export `VALID_TRANSITIONS` from `index.ts`.

---

## Metrics

- Type Coverage: 100% (0 `any`)
- TypeScript Errors: 0 (SDK) / 0 (Well app)
- `@ts-ignore`: 0
- `TODO/FIXME`: 0
- `console.*` in new SDK files: 1 (`console.error` in billing orchestrator — deliberate)
- Linting Issues: 0 blocking

---

## Unresolved Questions

1. Is `WebhookHandlerDeps` (currently in `autonomous-webhook-handler.ts`) intended as SDK-public or implementation-internal? It's exported and re-exported from `index.ts` — if public, it should have JSDoc on every field.
2. Does any existing Edge Function use `createBillingWebhookConfig`? If yes, H1 is a silent data loss bug in production today.
3. Plan file: no plan file was provided for this task — no task status to update.
