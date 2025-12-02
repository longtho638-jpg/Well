# Task for Gemini CLI: Implement "The Bee" Reward Agent

## Context
Based on CONTEXT.md and commission policy rules from Excel files (Code.csv, Sheet2.csv).

**Core Requirement:** Build an automated reward engine that calculates and distributes commissions when orders complete.

---

## Commission Policy Rules (Must Follow Exactly)

### Rank Definitions (8 Levels)
```typescript
enum UserRank {
  THIEN_LONG = 1,    // Thiên Long (Highest)
  PHUONG_HOANG = 2,  // Phượng Hoàng
  UNICORN = 3,       // Unicorn
  DIAMOND = 4,       // Kim Cương
  PLATINUM = 5,      // Bạch Kim
  AMBASSADOR = 6,    // Đại Sứ
  STARTUP = 7,       // Khởi Nghiệp
  CTV = 8            // CTV (Lowest - Affiliate)
}
```

### Commission Formulas

**1. Direct Sales Commission (Người bán)**
```
IF user.rank === CTV (8):
  commission = order_total * 0.21  // 21%
ELSE IF user.rank >= STARTUP (7 or lower number):
  commission = order_total * 0.25  // 25%
```

**2. Sponsor Bonus (F1 - Người giới thiệu trực tiếp)**
```
IF sponsor.rank <= AMBASSADOR (6):  // Đại Sứ or higher
  sponsor_bonus = order_total * 0.08  // 8%
```

**3. Nexus Points (Loyalty Mining)**
```
points = Math.floor(order_total / 100000)  // 1 point per 100K VND
```

### Rank Progression Rules

**Upgrade to STARTUP:**
```
IF lifetime_revenue >= 9_900_000 AND current_rank === CTV:
  UPDATE rank to STARTUP
  NOTIFY user: "Thăng cấp Khởi Nghiệp! Hoa hồng tăng lên 25%"
```

**Upgrade to AMBASSADOR:**
```
Requires:
- 2 downline branches with STARTUP rank
- Each branch revenue >= 125_000_000 VND
(Note: Implement in Phase 2, not MVP)
```

---

## Implementation Tasks

### Task 1: Create Database Schema Updates

**File:** `supabase/migrations/20241203_bee_agent.sql`

```sql
-- Add rank enum
CREATE TYPE user_rank AS ENUM (
  'THIEN_LONG', 'PHUONG_HOANG', 'UNICORN', 
  'DIAMOND', 'PLATINUM', 'AMBASSADOR', 
  'STARTUP', 'CTV'
);

-- Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS rank user_rank DEFAULT 'CTV';
ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_revenue BIGINT DEFAULT 0;

-- Add commission transactions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  order_id TEXT REFERENCES transactions(id),
  type TEXT NOT NULL, -- 'direct_sales', 'sponsor_bonus'
  amount BIGINT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'paid'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_direct_commission(
  p_rank user_rank,
  p_total BIGINT
) RETURNS BIGINT AS $$
BEGIN
  IF p_rank = 'CTV' THEN
    RETURN FLOOR(p_total * 0.21);
  ELSE
    RETURN FLOOR(p_total * 0.25);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to add commission
CREATE OR REPLACE FUNCTION add_commission(
  p_user_id UUID,
  p_order_id TEXT,
  p_type TEXT,
  p_amount BIGINT
) RETURNS UUID AS $$
DECLARE
  v_commission_id UUID;
BEGIN
  INSERT INTO commissions (user_id, order_id, type, amount)
  VALUES (p_user_id, p_order_id, p_type, p_amount)
  RETURNING id INTO v_commission_id;
  
  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rank upgrade
CREATE OR REPLACE FUNCTION check_rank_upgrade(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_lifetime_revenue BIGINT;
  v_current_rank user_rank;
  v_upgraded BOOLEAN := FALSE;
BEGIN
  SELECT lifetime_revenue, rank INTO v_lifetime_revenue, v_current_rank
  FROM users WHERE id = p_user_id;
  
  IF v_current_rank = 'CTV' AND v_lifetime_revenue >= 9900000 THEN
    UPDATE users SET rank = 'STARTUP' WHERE id = p_user_id;
    v_upgraded := TRUE;
  END IF;
  
  RETURN v_upgraded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Task 2: Create RewardBeeAgent (TypeScript)

**File:** `src/agents/custom/RewardBeeAgent.ts`

```typescript
import { BaseAgent } from '../core/BaseAgent';
import { AgentDefinition, AgentInput } from '@/types/agentic';
import { supabase } from '@/lib/supabase';

interface OrderInput {
  orderId: string;
  userId: string;
  totalVnd: number;
}

export class RewardBeeAgent extends BaseAgent {
  constructor() {
    const definition: AgentDefinition = {
      agent_id: 'reward-bee-001',
      agent_name: 'The Bee (Reward Engine)',
      agent_function: 'Operations & Efficiency',
      agent_objective: 'Automate commission calculation and distribution',
      core_responsibility: 'Calculate commissions, update wallets, check rank upgrades',
      policy_constraints: [
        'Only process completed orders',
        'Commission rates: CTV=21%, STARTUP+=25%',
        'Sponsor bonus: 8% for AMBASSADOR+ ranks',
        'Points ratio: 1 point per 100K VND'
      ],
      human_in_loop_triggers: [
        'Manual commission adjustment requests',
        'Disputes over calculations'
      ],
      success_kpis: [
        { name: 'Commissions Processed', target: 100, current: 0, unit: 'orders' },
        { name: 'Total Amount Distributed', target: 100000000, current: 0, unit: 'VND' },
        { name: 'Processing Speed', target: 200, current: 0, unit: 'ms' }
      ]
    };
    super(definition);
  }

  async execute(input: AgentInput): Promise<any> {
    const { action } = input;

    if (action === 'processOrder') {
      return await this.processCompletedOrder(input as OrderInput);
    }

    throw new Error('Unknown action for RewardBeeAgent');
  }

  private async processCompletedOrder(input: OrderInput): Promise<any> {
    const startTime = Date.now();
    const { orderId, userId, totalVnd } = input;

    try {
      // 1. Get user profile with rank
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, rank, sponsor_id, lifetime_revenue')
        .eq('id', userId)
        .single();

      if (userError || !user) throw new Error('User not found');

      // 2. Calculate direct sales commission
      const directCommission = this.calculateDirectCommission(user.rank, totalVnd);

      // 3. Add commission record
      await supabase.rpc('add_commission', {
        p_user_id: userId,
        p_order_id: orderId,
        p_type: 'direct_sales',
        p_amount: directCommission
      });

      // 4. Update lifetime revenue
      const newLifetimeRevenue = (user.lifetime_revenue || 0) + totalVnd;
      await supabase
        .from('users')
        .update({ lifetime_revenue: newLifetimeRevenue })
        .eq('id', userId);

      // 5. Check for rank upgrade
      const { data: upgraded } = await supabase.rpc('check_rank_upgrade', {
        p_user_id: userId
      });

      let rankUpMessage = '';
      if (upgraded) {
        rankUpMessage = '🎉 Chúc mừng! Bạn đã thăng cấp KHỞI NGHIỆP! Hoa hồng tăng lên 25%';
      }

      // 6. Process sponsor bonus (if applicable)
      let sponsorBonus = 0;
      if (user.sponsor_id) {
        const { data: sponsor } = await supabase
          .from('users')
          .select('rank')
          .eq('id', user.sponsor_id)
          .single();

        if (sponsor && this.isSponsorEligible(sponsor.rank)) {
          sponsorBonus = Math.floor(totalVnd * 0.08); // 8%
          
          await supabase.rpc('add_commission', {
            p_user_id: user.sponsor_id,
            p_order_id: orderId,
            p_type: 'sponsor_bonus',
            p_amount: sponsorBonus
          });
        }
      }

      // 7. Award Nexus Points
      const points = Math.floor(totalVnd / 100000);
      await supabase.rpc('add_points', {
        p_user_id: userId,
        p_amount: points
      });

      // 8. Update KPIs
      const processingTime = Date.now() - startTime;
      this.updateKPI('Commissions Processed', 1);
      this.updateKPI('Total Amount Distributed', directCommission + sponsorBonus);
      this.updateKPI('Processing Speed', processingTime);

      const result = {
        success: true,
        orderId,
        calculations: {
          directCommission,
          sponsorBonus,
          nexusPoints: points
        },
        rankUpgrade: upgraded,
        message: rankUpMessage || `Đã tính hoa hồng thành công! Bạn nhận ${directCommission.toLocaleString()} VND + ${points} Points`,
        processingTimeMs: processingTime
      };

      this.log('processOrder', input, result);
      return result;

    } catch (error) {
      console.error('[RewardBeeAgent] Error:', error);
      throw error;
    }
  }

  private calculateDirectCommission(rank: string, totalVnd: number): number {
    // CTV gets 21%, others get 25%
    const rate = rank === 'CTV' ? 0.21 : 0.25;
    return Math.floor(totalVnd * rate);
  }

  private isSponsorEligible(rank: string): boolean {
    // AMBASSADOR (6) or higher (lower number) gets sponsor bonus
    const eligibleRanks = ['THIEN_LONG', 'PHUONG_HOANG', 'UNICORN', 'DIAMOND', 'PLATINUM', 'AMBASSADOR'];
    return eligibleRanks.includes(rank);
  }

  private updateKPI(name: string, increment: number): void {
    const kpi = this.definition.success_kpis.find(k => k.name === name);
    if (kpi) {
      if (name === 'Processing Speed') {
        // Average processing speed
        kpi.current = (kpi.current + increment) / 2;
      } else {
        kpi.current += increment;
      }
    }
  }
}
```

---

### Task 3: Register Agent

**Modify:** `src/agents/registry.ts`

```typescript
import { RewardBeeAgent } from './custom/RewardBeeAgent';

// In registerAllAgents():
registry.register(new RewardBeeAgent());
```

---

### Task 4: Create Test Script

**File:** `src/agents/__tests__/RewardBeeAgent.test.ts`

```typescript
import { RewardBeeAgent } from '../custom/RewardBeeAgent';

describe('RewardBeeAgent', () => {
  const agent = new RewardBeeAgent();

  test('Calculate commission for CTV (21%)', () => {
    const result = agent['calculateDirectCommission']('CTV', 10_000_000);
    expect(result).toBe(2_100_000); // 21% of 10M
  });

  test('Calculate commission for STARTUP (25%)', () => {
    const result = agent['calculateDirectCommission']('STARTUP', 10_000_000);
    expect(result).toBe(2_500_000); // 25% of 10M
  });

  test('Check sponsor eligibility', () => {
    expect(agent['isSponsorEligible']('AMBASSADOR')).toBe(true);
    expect(agent['isSponsorEligible']('CTV')).toBe(false);
  });

  test('Full order processing simulation', async () => {
    const input = {
      action: 'processOrder',
      orderId: 'TEST-001',
      userId: 'test-user-id',
      totalVnd: 10_000_000
    };

    const result = await agent.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.calculations.directCommission).toBeGreaterThan(0);
    expect(result.calculations.nexusPoints).toBe(100); // 10M / 100K = 100 points
  });
});
```

---

## Verification Steps

1. **Run SQL migration:**
   ```sql
   -- In Supabase SQL Editor
   \i supabase/migrations/20241203_bee_agent.sql
   ```

2. **Test commission calculation:**
   ```typescript
   // In Agent Dashboard
   const bee = agentRegistry.get('The Bee (Reward Engine)');
   const result = await bee.execute({
     action: 'processOrder',
     orderId: 'TEST-123',
     userId: 'user-abc',
     totalVnd: 10_000_000
   });
   console.log(result);
   ```

3. **Expected output for 10M VND order (CTV user):**
   ```json
   {
     "success": true,
     "calculations": {
       "directCommission": 2100000,
       "sponsorBonus": 0,
       "nexusPoints": 100
     },
     "rankUpgrade": true,
     "message": "🎉 Chúc mừng! Bạn đã thăng cấp..."
   }
   ```

---

## MVP Scope (Phase 1)

**INCLUDE:**
- ✅ CTV → STARTUP rank logic
- ✅ Direct commission (21%/25%)
- ✅ Sponsor bonus (8% for AMBASSADOR+)
- ✅ Nexus Points mining

**EXCLUDE (Phase 2):**
- ❌ Complex rank upgrades (AMBASSADOR → DIAMOND)
- ❌ Multi-level bonuses (F2, F3...)
- ❌ "Weak leg" calculations
- ❌ Team volume matching

**Reason:** 90% of users in first 3 months will be CTV/STARTUP. Focus on getting this rock-solid first.

---

## Success Criteria

- ✅ TypeScript compiles without errors
- ✅ All test cases pass
- ✅ Agent registered in Agent Dashboard
- ✅ Commission calculations match Excel formulas
- ✅ Processing time < 200ms per order

Proceed with implementation.
