# Phase 2: Pipeline Service Composition

## Context
- Parent: [plan.md](./plan.md)
- Inspired by: zx pipe operator + within() scoped contexts

## Overview
- **Date:** 2026-03-01 | **Priority:** P2 | **Status:** pending

Create composable service pipeline pattern. Chain operations like Unix pipes. Scoped contexts for transactions.

## Architecture

```typescript
// Pipeline: chain service calls
const result = await pipeline(
  () => validateOrder(input),
  (validated) => calculateTax(validated),
  (withTax) => storeOrder(withTax),
  (stored) => notifyDistributor(stored),
);

// Scoped context (like zx's within)
await withTransaction(async (tx) => {
  await tx.insert('orders', order);
  await tx.update('inventory', { stock: stock - qty });
  // auto-rollback on error
});
```

## Implementation Steps
1. Create `pipeline()` utility — sequential fn chain with typed output
2. Create `withTransaction()` — scoped Supabase transaction
3. Create `parallel()` — run independent calls simultaneously
4. Refactor order creation to use pipeline
5. Refactor commission calculation to use pipeline

## Todo
- [ ] pipeline() utility | - [ ] withTransaction() scope
- [ ] parallel() utility | - [ ] Refactor order flow | - [ ] Tests

## Success Criteria
- Order flow uses pipeline (validate → tax → store → notify)
- Transactions auto-rollback on error
- Independent API calls run in parallel
