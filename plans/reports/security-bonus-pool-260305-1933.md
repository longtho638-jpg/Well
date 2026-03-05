# Security Audit: Phase 2C Bonus Pool Distribution

**Date:** 2026-03-05
**Auditor:** Security Reviewer Agent
**Scope:** `supabase/functions/_shared/commission/bonus-pool.ts`
**Status:** 🔴 CRITICAL VULNERABILITIES FOUND

---

## Executive Summary

| Category | Count | Severity |
|----------|-------|----------|
| Critical | 3 | 🔴 |
| High | 2 | 🟠 |
| Medium | 4 | 🟡 |
| Low | 2 | 🟢 |

**Overall Risk:** 🔴 **HIGH** - Cannot deploy to production without fixes

---

## 🔴 CRITICAL VULNERABILITIES

### 1. Race Condition - Double Distribution Attack

**Location:** `bonus-pool.ts:33-58`

```typescript
const { data: existingPool } = await supabase
  .from('bonus_pools')
  .select('id')
  .eq('month', month)
  .eq('year', year)
  .single();

if (existingPool) {
  await supabase.from('bonus_pools').update({...}).eq('id', existingPool.id);
} else {
  await supabase.from('bonus_pools').insert({...}); // ⚠️ RACE CONDITION
}
```

**Attack Vector:**
- Attacker calls bonus distribution function twice simultaneously
- Both checks return `existingPool = null` (before either insert completes)
- Result: 2 bonus pools created for same month/year → double payout

**Impact:** Financial loss, duplicate bonuses to same performers

**Fix Required:**
```typescript
// Use PostgreSQL UPSERT with unique constraint
const { data: bonusPool, error } = await supabase
  .from('bonus_pools')
  .upsert({
    month,
    year,
    total_pool_amount: totalPool,
    total_volume: totalVolume,
    status: 'calculating'
  }, {
    onConflict: 'month,year',
    ignoreDuplicates: false
  })
  .select('id')
  .single();
```

---

### 2. No Idempotency Guard - Replay Attack

**Location:** `bonus-pool.ts:12-109`

**Issue:** Function has no idempotency key or distributed lock

**Attack Vector:**
```bash
# Attacker triggers webhook multiple times
curl -X POST https://edge-function/calculate-bonus \
  -d '{"month": 3, "year": 2026}'

# Same request 10 times = 10x bonuses distributed
```

**Impact:** Each performer receives 10x bonus amount

**Fix Required:**
```typescript
// Add distributed lock using Supabase Mutex pattern
async function acquireLock(key: string, ttl: number): Promise<boolean> {
  const { data } = await supabase.rpc('try_advisory_lock', { lock_key: key });
  return data === true;
}

// Usage
const lockKey = `bonus_pool_${month}_${year}`;
if (!await acquireLock(lockKey, 300)) {
  throw new Error('Distribution already in progress');
}
```

---

### 3. Missing Authorization Check

**Location:** `bonus-pool.ts` (entire file)

**Issue:** No user role verification, no webhook secret validation

**Attack Vector:**
```typescript
// Any authenticated user can trigger:
const { data } = await supabase.functions.invoke('calculateMonthlyBonusPool', {
  body: { month: 3, year: 2026 }
});
```

**Impact:** Unauthorized users can trigger bonus distribution

**Fix Required:**
```typescript
// Add admin-only check
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('users')
  .select('role_id')
  .eq('id', user.id)
  .single();

if (!profile || profile.role_id > RANKS.DAI_SU) {
  throw new Error('Unauthorized: Admin only');
}
```

---

## 🟠 HIGH SEVERITY

### 4. Pool Exhaustion Not Handled

**Location:** `bonus-pool.ts:72-101`

```typescript
for (let i = 0; i < topPerformers.length; i++) {
  const bonusAmount = totalPool * (percentage / 100);

  await supabase.from('transactions').insert({...}); // ⚠️ No balance check
}
```

**Issue:** If `totalPool = 0` or insufficient funds, transactions still inserted

**Impact:** Negative balances, system insolvency

**Fix Required:**
```typescript
// Validate pool sufficiency BEFORE distribution
const requiredAmount = BONUS_PERCENTAGES.reduce(sum, 0); // Should = 100
if (totalPool < requiredAmount) {
  await supabase.from('bonus_pools').update({
    status: 'insufficient_funds'
  }).eq('id', bonusPoolId);
  throw new Error(`Insufficient pool: ${totalPool} < ${requiredAmount}`);
}
```

---

### 5. No Validation on Team Volume Manipulation

**Location:** `bonus-pool.ts:60-64`

```typescript
const { data: topPerformers } = await supabase
  .from('users')
  .select('id, team_volume')
  .order('team_volume', { ascending: false })
  .limit(10);
```

**Issue:** `team_volume` can potentially be manipulated via fake orders

**Attack Vector:**
1. Create fake orders with guest checkout
2. Trigger bonus calculation
3. Rank in top 10 with inflated volume
4. Receive undeserved bonus

**Fix Required:**
```typescript
// Only count completed, non-refunded orders
const { data: topPerformers } = await supabase
  .from('users')
  .select('id, team_volume')
  .eq('is_volume_verified', true) // Add verification flag
  .order('team_volume', { ascending: false })
  .limit(10);
```

---

## 🟡 MEDIUM SEVERITY

### 6. Floating Point Precision Errors

**Location:** `bonus-pool.ts:76`

```typescript
const bonusAmount = totalPool * (percentage / 100);
```

**Issue:** JavaScript floating point can cause rounding errors

**Example:**
```javascript
2000000 * (0.5 / 100) = 10000.000000000001 // ⚠️
```

**Fix:** Use integer math or Decimal library
```typescript
const bonusAmount = Math.round(totalPool * percentage) / 100;
```

---

### 7. No Audit Trail for Distribution

**Location:** `bonus-pool.ts:103-106`

```typescript
await supabase.from('bonus_pools').update({
  status: 'distributed',
  distributed_at: new Date().toISOString()
}).eq('id', bonusPoolId);
```

**Issue:** No log of WHO triggered distribution, WHAT the final state was

**Fix:** Add audit log table
```sql
CREATE TABLE bonus_pool_audit_log (
  id UUID PRIMARY KEY,
  bonus_pool_id UUID REFERENCES bonus_pools(id),
  triggered_by UUID REFERENCES users(id),
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 8. Missing Unique Constraint on Winners

**Location:** `20260305203000_create_bonus_pools.sql:29`

```sql
UNIQUE(bonus_pool_id, user_id) -- ✅ EXISTS but...
```

**Issue:** What if same user wins multiple months? No cross-month validation

**Fix:** Already adequate for current scope

---

## 🟢 LOW SEVERITY

### 9. Hardcoded Percentages

**Location:** `bonus-pool.ts:10`

```typescript
const BONUS_PERCENTAGES = [25, 20, 15, 12, 10, 8, 5, 3, 1.5, 0.5];
```

**Issue:** Should be in database for easy adjustment

**Fix:** Fetch from `bonus_pool_config` table

---

### 10. No Graceful Degradation

**Location:** `bonus-pool.ts:66-70`

```typescript
if (!topPerformers || topPerformers.length === 0) {
  console.log('[Phase2C] No performers found, skipping bonus distribution');
  return;
}
```

**Issue:** Silent failure, no notification to admins

**Fix:** Send alert email to admin team

---

## RECOMMENDED EDGE CASE TESTS

### Pool Exhaustion Scenarios

```typescript
describe('Pool Exhaustion', () => {
  it('handles zero total volume gracefully', async () => {
    // Mock orders with total_vnd = 0
    // Expected: status = 'distributed', no transactions created
  });

  it('handles partial pool (less than 10 performers)', async () => {
    // Only 5 users with team_volume > 0
    // Expected: 5 winners only, remaining pool stays undistributed
  });

  it('prevents double distribution with concurrent calls', async () => {
    // Call calculateMonthlyBonusPool 10 times in parallel
    // Expected: Only 1 succeeds, 9 throw "already in progress"
  });

  it('rolls back on transaction failure', async () => {
    // Mock transaction insert to fail on 7th winner
    // Expected: All changes rolled back, status = 'failed'
  });

  it('handles negative team_volume (data corruption)', async () => {
    // Inject user with team_volume = -1000000
    // Expected: User filtered out or treated as 0
  });

  it('prevents manipulation via same-day orders', async () => {
    // Create 1000 small orders same day to inflate team_volume
    // Expected: Only count verified/completed orders after cooling period
  });
});
```

---

## SECURITY CHECKLIST (Before Production)

- [ ] Fix race condition with UPSERT
- [ ] Add distributed lock/idempotency
- [ ] Implement admin-only authorization
- [ ] Validate pool sufficiency before distribution
- [ ] Add audit logging
- [ ] Use integer math for calculations
- [ ] Add team volume verification
- [ ] Create edge case test suite
- [ ] Load test with 1000 concurrent users
- [ ] Manual penetration testing

---

## Unresolved Questions

1. Should bonus distribution require 2-factor admin approval?
2. What's the recovery process if pool is over-distributed?
3. Should there be a maximum bonus cap per user?
4. How to handle disputed orders that affected bonus calculations?
