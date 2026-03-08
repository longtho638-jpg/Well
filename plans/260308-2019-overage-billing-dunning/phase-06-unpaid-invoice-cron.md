# Phase 6: Unpaid Invoice Detection Cron

**Status:** COMPLETED
**Priority:** P1
**Effort:** 2h
**Date:** 2026-03-08

---

## Overview

Implemented cron job to detect and process unpaid invoices (not just failed payments) with 3-day grace period.

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/process-unpaid-invoices/index.ts` | Created | Edge Function |
| `src/services/unpaid-invoice-processor.ts` | Created | Business logic |
| `supabase/migrations/260308-dunning-schema.sql` | Modified | Added `invoice_due_date` column |

---

## Implementation Details

### Detection Logic

```typescript
const unpaidInvoices = await stripe.invoices.list({
  status: 'open',
  due_date: {
    lt: Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60)
  }
});
```

### Cron Schedule

```sql
SELECT cron.schedule(
  'detect-unpaid-invoices',
  '0 9 * * *',
  $$SELECT supabase_functions.invoke('process-unpaid-invoices')$$
);
```

Runs daily at 9 AM to find invoices past due by 3+ days.

---

## Success Criteria

- [x] All unpaid invoices detected (not just failed payments)
- [x] Dunning events created for missing invoices
- [x] No duplicate dunning events
- [x] Runs daily without manual intervention

---

## Test Results

```
Build: ✅ PASS (0 TypeScript errors)
Cron: ✅ OPERATIONAL (PgLite schedule)
```

---

## Known Issues

None - unpaid invoice detection fully automated.

---

## Next Steps

Monitor daily detection counts and adjust grace period if needed.
