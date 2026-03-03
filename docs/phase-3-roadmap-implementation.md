# WellNexus Phase 3 — Implementation Roadmap

> 3 features chinh cho Phase 3. Founder quyet dinh thu tu uu tien.
> Cap nhat: 2026-03-03

---

## TONG QUAN

| # | Feature | Do kho | Thoi gian | Phu thuoc |
|---|---------|--------|-----------|-----------|
| 1 | Policy Engine | Medium | 2-3 tuan | Supabase Edge Functions |
| 2 | Strategic Simulator | High | 3-4 tuan | Policy Engine |
| 3 | HealthFi Wallet | High | 3-4 tuan | Supabase, PayOS |

**Tong thoi gian du kien:** 8-11 tuan (2-3 thang)

---

## 1. POLICY ENGINE

### Mo ta
He thong quan ly business rules (commission rates, rank requirements, promotions) qua Admin UI thay vi hardcode.

### Kien truc

```
Admin UI (React)
  → Policy Editor (CRUD rules)
  → Rule Preview (simulate before apply)
  → Version History (rollback)
      ↓
Supabase
  → policies table (rules JSON)
  → policy_versions table (history)
  → Edge Function: evaluate-policy (runtime)
      ↓
Distributor Portal
  → usePolicyEngine hook (fetch active rules)
  → Commission calculator (uses policy rules)
  → Rank upgrade logic (uses policy rules)
```

### Implementation Steps

1. **Database Schema**
   - Tao `policies` table (id, type, rules_json, active, version)
   - Tao `policy_versions` table (id, policy_id, rules_json, created_at)
   - RLS: chi Admin doc/ghi

2. **Admin UI**
   - Policy list page (CRUD)
   - Rule editor (JSON schema form)
   - Preview/simulate mode
   - Version history + rollback

3. **Runtime Engine**
   - Edge Function `evaluate-policy`
   - Client hook `usePolicyEngine`
   - Replace hardcoded commission rates
   - Replace hardcoded rank thresholds

4. **Testing**
   - Unit tests cho rule evaluation
   - Integration tests cho CRUD
   - E2E test cho admin workflow

### Files can tao/sua

```
src/services/policy-service.ts          # NEW - Policy CRUD
src/hooks/usePolicyEngine.ts            # UPDATE - connect real data
src/components/Admin/PolicyEngine/      # UPDATE - real CRUD UI
supabase/migrations/xxx_policies.sql    # NEW - DB schema
supabase/functions/evaluate-policy/     # NEW - Edge Function
```

---

## 2. STRATEGIC SIMULATOR

### Mo ta
Engine mo phong kich ban kinh doanh: "Neu tang commission 2% thi revenue thay doi the nao?"

### Kien truc

```
Admin UI
  → Scenario Builder (input parameters)
  → Simulation Runner (calculate outcomes)
  → Results Visualization (charts, tables)
      ↓
Calculation Engine (client-side)
  → Monte Carlo simulation (scenarios)
  → Revenue projection model
  → Network growth model
      ↓
Data Sources
  → Current policies (Policy Engine)
  → Historical data (Supabase)
  → Market assumptions (user input)
```

### Implementation Steps

1. **Simulation Engine** (client-side TypeScript)
   - Revenue projection model
   - Network growth simulation
   - Commission impact calculator
   - Monte Carlo scenario runner

2. **Admin UI**
   - Scenario builder form
   - Parameter sliders (commission%, growth%, churn%)
   - Results dashboard (charts, tables)
   - Save/compare scenarios

3. **Data Integration**
   - Fetch historical data tu Supabase
   - Integrate Policy Engine rules
   - Export reports (PDF)

### Files can tao

```
src/lib/simulation/                     # NEW - Simulation engine
  ├── revenue-model.ts
  ├── network-growth-model.ts
  ├── monte-carlo-runner.ts
  └── types.ts
src/components/Admin/Simulator/         # NEW - UI components
  ├── ScenarioBuilder.tsx
  ├── SimulationResults.tsx
  └── CompareScenarios.tsx
src/pages/Admin/StrategicSimulator.tsx   # NEW - Page
```

---

## 3. HEALTHFI WALLET

### Mo ta
He thong wallet voi dual-token (SHOP + GROW), staking, rewards, points ledger.

### Kien truc

```
Distributor Portal
  → Wallet Dashboard (balances, history)
  → Staking UI (lock tokens for rewards)
  → Rewards Claim (daily/weekly)
  → Transfer (peer-to-peer)
      ↓
Supabase
  → wallets table (user_id, shop_balance, grow_balance)
  → transactions table (type, amount, from, to)
  → staking_positions table (amount, lock_period, apy)
  → rewards_ledger table (earned, claimed, pending)
  → Edge Functions: process-stake, claim-rewards, transfer
      ↓
Integration
  → Commission payouts → wallet credit
  → Product purchases → SHOP deduction
  → Staking → GROW rewards
```

### Implementation Steps

1. **Database Schema**
   - `wallets` table (SHOP + GROW balances)
   - `wallet_transactions` table (all movements)
   - `staking_positions` table (locked amounts)
   - `rewards_ledger` table (earned/claimed)
   - RLS: users chi xem wallet cua minh

2. **Edge Functions**
   - `process-stake` — lock tokens, calculate APY
   - `claim-rewards` — distribute pending rewards
   - `transfer-tokens` — peer-to-peer with validation
   - `process-commission-payout` — commission → wallet

3. **Wallet UI**
   - UPDATE existing Wallet components
   - Staking interface (lock period, APY preview)
   - Rewards dashboard (earned, pending, claimed)
   - Transaction history (filterable)
   - Transfer form (recipient, amount, confirmation)

4. **Integration**
   - Commission payout → auto-credit wallet
   - Product purchase → SHOP deduction option
   - Rank upgrade → bonus GROW tokens

### Files can tao/sua

```
src/services/wallet-service.ts          # UPDATE - real Supabase calls
src/hooks/useWallet.ts                  # UPDATE - real data
src/components/Wallet/                  # UPDATE - staking, rewards UI
supabase/migrations/xxx_wallets.sql     # NEW - DB schema
supabase/functions/process-stake/       # NEW
supabase/functions/claim-rewards/       # NEW
supabase/functions/transfer-tokens/     # NEW
```

---

## THU TU UU TIEN KHUYEN NGHI

```
Thang 1: Policy Engine (nen lam dau tien — co so cho cac feature khac)
Thang 2: HealthFi Wallet (revenue-generating, user engagement)
Thang 3: Strategic Simulator (nice-to-have, cho Admin)
```

### Dieu kien bat dau

| Feature | Can truoc khi bat dau |
|---------|----------------------|
| Policy Engine | Supabase CLI linked, Edge Functions deployed |
| Strategic Simulator | Policy Engine DONE |
| HealthFi Wallet | PayOS webhook verified, Supabase Edge Functions |

---

## COST ESTIMATE

| Feature | Dev Cost (hours) | Infra Cost (monthly) |
|---------|-----------------|---------------------|
| Policy Engine | 40-60h | $0 (Supabase free tier) |
| Strategic Simulator | 60-80h | $0 (client-side calc) |
| HealthFi Wallet | 80-100h | $0-25 (Edge Function invocations) |
| **Total** | **180-240h** | **$0-25/month** |

---

> **Founder quyet dinh:** Chon feature nao lam truoc, allocate resource, va bat dau sprint.
