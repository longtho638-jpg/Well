# Phase 2: Commission Distribution Logic

## Overview
Implement advanced commission distribution with multi-level overrides (F2-F5) and partner split rules.

## Current State (Phase 1)
- ✅ Direct Commission: 21% (CTV) / 25% (Leader+)
- ✅ F1 Sponsor Bonus: 8% (Dai Su+)
- ✅ Policy Engine v3.0: Dynamic DB config
- ✅ Idempotency guard
- ✅ Rank upgrade automation

## Phase 2 Requirements

### 1. Multi-Level Override Commission (F2-F5)

| Level | Min Rank | Override % | Condition |
|-------|----------|------------|-----------|
| F1 | Dai Su (6) | 8% | Direct downline |
| F2 | Dai Su Gold (4) | 5% | Team vol ≥ 50M |
| F3 | Dai Su Diamond (3) | 3% | Team vol ≥ 200M |
| F4 | Phuong Hoang (2) | 2% | Team vol ≥ 500M |
| F5 | Thien Long (1) | 1% | Team vol ≥ 1B |

**Formula:**
```
Override_Fn = OrderTotal × Override% × RankMultiplier
RankMultiplier = 1.0 if rank ≥ threshold else 0.0
```

### 2. Partner Split Rules

When order from shared partner link:
```
Total Commission = Direct Commission (25%)
Split:
  - Referrer: 60% of commission (15%)
  - Sponsor: 40% of commission (10%)
```

### 3. Performance Bonus Pool

Monthly bonus distribution:
```
BonusPool = SUM(OrderTotal) × 2%
TopPerformers = Top 10 by teamVolume
IndividualBonus = BonusPool × (PersonalVolume / TotalVolume)
```

## Database Schema Changes

### New Tables

```sql
-- Multi-level commission config
CREATE TABLE override_commission_config (
  id UUID PRIMARY KEY,
  level INT NOT NULL UNIQUE, -- F1-F5
  min_rank_id INT NOT NULL,
  override_percent DECIMAL(5,2) NOT NULL,
  team_volume_threshold DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner split tracking
CREATE TABLE partner_splits (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  referrer_id UUID REFERENCES users(id),
  sponsor_id UUID REFERENCES users(id),
  referrer_percent DECIMAL(5,2) DEFAULT 60,
  sponsor_percent DECIMAL(5,2) DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance bonus pool
CREATE TABLE bonus_pools (
  id UUID PRIMARY KEY,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  total_pool DECIMAL(15,2) DEFAULT 0,
  total_volume DECIMAL(15,2) DEFAULT 0,
  distributed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Phases

### Phase 2A: F2-F5 Override Commission
- [ ] Create override_commission_config table
- [ ] Update agent-reward/index.ts to traverse upline
- [ ] Add F2-F5 transaction types
- [ ] Write tests for each level

### Phase 2B: Partner Split Rules
- [ ] Create partner_splits table
- [ ] Track referrer on order creation
- [ ] Split commission calculation
- [ ] Email notifications for both parties

### Phase 2C: Performance Bonus Pool
- [ ] Create bonus_pools table
- [ ] Monthly cron job (pg_cron)
- [ ] Calculate top performers
- [ ] Distribute bonuses

## API Contracts

### License Guard (Phase 1 Reference)

```typescript
// lib/raas-gate.ts
interface LicenseValidationResult {
  isValid: boolean;
  features: {
    adminDashboard: boolean;
    payosWebhook: boolean;
    commissionDistribution: boolean; // Gated in production
    policyEngine: boolean;
  };
}

// Guards:
- checkRaasLicenseGuard(): boolean
- isAdminDashboardEnabled(): boolean
- isPayosWebhookEnabled(): boolean
```

### Commission Distribution (Phase 2)

```typescript
// lib/commission-distribution.ts (NEW)
interface CommissionBreakdown {
  directCommission: number;    // 21-25%
  f1Bonus: number;             // 8%
  f2Override?: number;         // 5%
  f3Override?: number;         // 3%
  partnerSplit?: {
    referrer: number;
    sponsor: number;
  };
}

// Functions:
- calculateMultiLevelCommission(orderId): Promise<CommissionBreakdown>
- distributePartnerSplit(orderId, referrerId, sponsorId): Promise<void>
- calculateMonthlyBonusPool(month, year): Promise<number>
```

## Testing Strategy

```typescript
// F2-F5 Override Tests
describe('Multi-Level Override', () => {
  it('F2: Dai Su Gold with 50M team vol gets 5%', () => {})
  it('F3: Dai Su Diamond with 200M team vol gets 3%', () => {})
  it('F4: Phuong Hoang with 500M team vol gets 2%', () => {})
  it('F5: Thien Long with 1B team vol gets 1%', () => {})
})

// Partner Split Tests
describe('Partner Split', () => {
  it('60/40 split between referrer and sponsor', () => {})
  it('Handles missing referrer gracefully', () => {})
})
```

## Migration Script

```sql
-- Insert default override config
INSERT INTO override_commission_config
  (id, level, min_rank_id, override_percent, team_volume_threshold)
VALUES
  ('gen_random_uuid()', 1, 6, 8.0, 0),
  ('gen_random_uuid()', 2, 4, 5.0, 50000000),
  ('gen_random_uuid()', 3, 3, 3.0, 200000000),
  ('gen_random_uuid()', 4, 2, 2.0, 500000000),
  ('gen_random_uuid()', 5, 1, 1.0, 1000000000);
```

## Success Criteria

- [ ] F2-F5 commissions calculated correctly
- [ ] Partner splits tracked and distributed
- [ ] Monthly bonus pool automated
- [ ] All new tables have RLS policies
- [ ] Email notifications for all commission types
- [ ] Tests coverage ≥ 90%

## Unresolved Questions

1. Should F2-F5 overrides be cumulative or highest-only?
2. Partner split: What if referrer = sponsor?
3. Bonus pool: How to handle ties in top performers?
