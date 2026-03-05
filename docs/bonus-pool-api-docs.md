# Bonus Pool API Documentation

**Date:** 2026-03-05
**Version:** 1.0.0
**Status:** 🔴 Security Review Required

---

## Overview

Phase 2C: Performance Bonus Pool - Monthly 2% distribution to top 10 performers.

---

## Database Schema

### `bonus_pools` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `month` | INT | Month (1-12) |
| `year` | INT | Year (e.g., 2026) |
| `total_pool_amount` | DECIMAL(15,2) | 2% of monthly volume |
| `total_volume` | DECIMAL(15,2) | Total monthly volume |
| `status` | TEXT | `pending`, `calculating`, `distributed` |
| `distributed_at` | TIMESTAMPTZ | Distribution timestamp |
| `created_at` | TIMESTAMPTZ | Created timestamp |
| `updated_at` | TIMESTAMPTZ | Updated timestamp |

**Unique Constraint:** `(month, year)`

### `bonus_pool_winners` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `bonus_pool_id` | UUID | FK to bonus_pools |
| `user_id` | UUID | FK to users |
| `rank` | INT | Ranking (1-10) |
| `team_volume` | DECIMAL(15,2) | User's team volume |
| `bonus_amount` | DECIMAL(15,2) | Calculated bonus |
| `percentage_share` | DECIMAL(5,2) | % of pool |
| `created_at` | TIMESTAMPTZ | Created timestamp |

**Unique Constraint:** `(bonus_pool_id, user_id)`

---

## Distribution Percentages

| Rank | Percentage | Share of Pool |
|------|------------|---------------|
| 1st | 25% | Quarter of pool |
| 2nd | 20% | Fifth of pool |
| 3rd | 15% | |
| 4th | 12% | |
| 5th | 10% | |
| 6th | 8% | |
| 7th | 5% | |
| 8th | 3% | |
| 9th | 1.5% | |
| 10th | 0.5% | |
| **Total** | **100%** | |

---

## API Endpoints

### Edge Function: `calculateMonthlyBonusPool`

**Location:** `supabase/functions/_shared/commission/bonus-pool.ts`

**Trigger:** Manual invocation via Edge Function

**Method:** POST

**Authentication:** 🔴 **REQUIRED - Admin Only** (Currently Missing - See Security Report)

#### Request Body

```json
{
  "month": 3,
  "year": 2026
}
```

#### Function Flow

```typescript
async function calculateMonthlyBonusPool(
  supabase: SupabaseClient,
  month: number,
  year: number
) {
  // 1. Calculate total monthly volume
  const orders = await getCompletedOrders(month, year);
  const totalVolume = sum(orders.total_vnd);
  const totalPool = totalVolume * 0.02;

  // 2. Create/update bonus pool record
  const bonusPoolId = await upsertBonusPool(month, year, totalPool, totalVolume);

  // 3. Get top 10 performers by team_volume
  const topPerformers = await getTopPerformers(10);

  // 4. Distribute bonuses
  for (let i = 0; i < topPerformers.length; i++) {
    const percentage = BONUS_PERCENTAGES[i];
    const bonusAmount = totalPool * (percentage / 100);

    // 4a. Insert winner record
    await insertWinner(bonusPoolId, topPerformers[i], i + 1, bonusAmount, percentage);

    // 4b. Create transaction
    await insertTransaction(topPerformers[i].id, bonusAmount, 'performance_bonus');

    // 4c. Increment pending balance
    await incrementPendingBalance(topPerformers[i].id, bonusAmount);
  }

  // 5. Mark pool as distributed
  await markPoolDistributed(bonusPoolId);
}
```

#### RPC Functions Called

| Function | Parameters | Purpose |
|----------|------------|---------|
| `increment_pending_balance` | `(x_user_id UUID, x_amount BIGINT)` | Add bonus to user wallet |

#### Transaction Types

```typescript
{
  user_id: UUID,
  amount: DECIMAL,
  type: 'performance_bonus',
  description: `Top ${rank} performance bonus ${month}/${year} (${percentage}%)`,
  status: 'completed'
}
```

---

## SQL Functions

### `get_bonus_percentage(rank INT)`

Returns bonus percentage for given rank.

**Location:** `20260305203000_create_bonus_pools.sql`

```sql
SELECT get_bonus_percentage(1); -- Returns 30.00 (per DB function)
```

⚠️ **Note:** DB function uses different percentages than code (30% vs 25% for 1st place)

---

## Views

### `v_bonus_pool_summary`

Aggregated view of bonus pool status.

```sql
SELECT * FROM v_bonus_pool_summary;
```

| Column | Type | Description |
|--------|------|-------------|
| `month` | INT | Month |
| `year` | INT | Year |
| `total_pool_amount` | DECIMAL | Total pool |
| `total_volume` | DECIMAL | Total volume |
| `status` | TEXT | Distribution status |
| `distributed_at` | TIMESTAMPTZ | Distribution time |
| `winner_count` | BIGINT | Number of winners |
| `total_distributed` | DECIMAL | Total amount distributed |

---

## Security Vulnerabilities

🔴 **CRITICAL** - See `security-bonus-pool-260305-1933.md`

1. **Race Condition** - Double distribution attack possible
2. **No Idempotency** - Replay attacks can trigger multiple distributions
3. **Missing Authorization** - No admin-only check
4. **Pool Exhaustion** - No validation before distribution
5. **Team Volume Manipulation** - Fake orders can inflate rankings

---

## Testing

### Test File Location

`supabase/functions/__tests__/bonus-pool.test.ts`

### Test Coverage

- ✅ Bonus percentage distribution (3 tests)
- ✅ 2% pool calculation (3 tests)
- ✅ Individual bonus amounts (4 tests)
- ✅ Edge cases (6 tests)
- ✅ Pool exhaustion scenarios (4 tests)
- ✅ Team volume manipulation prevention (3 tests)
- ✅ Transaction type validation (1 test)
- ✅ Description format (2 tests)
- ✅ Month/year validation (2 tests)
- ✅ Rank validation (2 tests)

**Total:** 30 tests, all passing

---

## Environment Variables

```bash
# Required for Edge Function
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
WEBHOOK_SECRET=<secret-for-authentication> # ⚠️ Currently unused in bonus-pool.ts
```

---

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| `20260305203000_create_bonus_pools.sql` | 2026-03-05 | Initial schema |

---

## Related Files

```
supabase/
├── functions/
│   ├── _shared/commission/bonus-pool.ts      # Main logic
│   └── __tests__/bonus-pool.test.ts          # Tests
└── migrations/
    └── 20260305203000_create_bonus_pools.sql # Schema
```

---

## Unresolved Questions

1. Should distribution require 2-factor admin approval?
2. What's the recovery process for over-distribution?
3. Should there be a maximum bonus cap per user?
4. How to handle disputed orders affecting calculations?

---

## Next Steps

1. 🔴 Fix critical security vulnerabilities
2. 🔴 Add admin authorization check
3. 🟠 Implement distributed lock (idempotency)
4. 🟠 Add audit logging
5. 🟡 Move percentages to database config
6. 🟡 Add email notifications on completion
