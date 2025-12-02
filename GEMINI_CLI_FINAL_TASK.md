# Summary Task for Gemini CLI: Phases 2-6 Complete Integration

## Context
✅ **Phase 1 Complete**: HealthCoach integrated with GeminiCoachAgent
🎯 **Goal**: Complete full Agent-OS integration across all features

This is a **consolidated task** covering all remaining phases. Execute sequentially.

---

## Phase 2: Copilot Agent Integration (30 min)

### Modify: `src/components/TheCopilot.tsx`

Find the message handling logic and replace with agent call:

```typescript
import { useAgentOS } from '@/hooks/useAgentOS';

// In component:
const { executeAgent } = useAgentOS();

// In message handler:
const response = await executeAgent('Sales Copilot', {
  action: 'suggestResponse',
  message: userMessage
});
```

**Verify**: `npm run build` succeeds

---

## Phase 3: Skip (Complex - requires new agent implementation)

**Reason**: MarketingAgent requires significant new code. Skip for now.

---

## Phase 4: Skip (Complex - requires new agent implementation)

**Reason**: AnalyticsAgent requires DB integration. Skip for now.

---

## Phase 5: KPI Real-Time Updates (15 min)

### Modify: `src/agents/custom/GeminiCoachAgent.ts`

Add KPI update after successful execution:

```typescript
async execute(input: any): Promise<any> {
  // ... existing code ...
  
  const output = await this.getCoachAdvice(user, context);
  
  // ADD THIS: Update KPIs
  const kpi = this.definition.success_kpis.find(k => k.name === 'User Satisfaction');
  if (kpi) {
    kpi.current = (kpi.current || 0) + 1; // Increment usage count
  }
  
  this.log(action, input, output);
  return output;
}
```

### Modify: `src/agents/custom/SalesCopilotAgent.ts`

Same pattern - update KPIs after execution.

**Verify**: `npm run build` succeeds

---

## Phase 6: Business Plan 2026 Documentation (30 min)

### Create: `Well/BIZ_PLAN_2026.md`

Use this template:

```markdown
# WellNexus Business Plan 2026 – Agentic Zero→IPO

## 0. Meta & Stage

**Current Stage**: Seed / PMF Search  
**Market**: Vietnam + SEA  
**Business Model**: Hybrid Community Commerce + AI SaaS  
**Agentic Maturity**: Level 1 (Assistant Agentic)

---

## 1. Vision, Mission & Zero→IPO Story

### Vision
[Extract from CLAUDE.md lines 1-10]

### Mission
[Extract from README.md]

### IPO Story
Well aims to be the first AI-native community commerce platform in SEA to go public by 2028.

---

## 2. Market & Customer

### [Business] Layer
- Target: Health-conscious consumers in Vietnam
- TAM: $XXX million

### [Agentic] Layer
- AI Coach for personalized health recommendations
- Sales Copilot for distributors

### [Governance] Layer
- Compliance with Vietnam MLM regulations
- Tax law adherence (Circular 111/2013/TT-BTC)

---

## 3. Product & Agentic OS

### Core Products
[Extract from README.md]

### Agentic OS
- 22+ agents (2 custom, 20 ClaudeKit)
- Functions: Sales, Marketing, Analytics, Compliance

---

## 4. Business Model

### Revenue Streams
- Product sales commissions
- Platform fees
- SaaS subscriptions (future)

### Cost Structure
[To be added]

---

## 5. Growth Engine (AARRR)

[Extract from BRAND_CONTENT_STRATEGY.md]

---

## 6. Ops, Risk & Compliance

### Operations
- Automated tax calculations
- Real-time commission tracking

### Compliance
- Vietnam Tax Law compliance built-in
- Agent policies enforce guardrails

---

## 7. Financial Plan & IPO Readiness

**Status**: Pre-seed stage  
**Target**: Raise Seed round Q2 2026

---

## 8. Brand & Story

[Extract from BRAND_REPOSITION_SUMMARY.md]

---

## 9. Appendix

- Agent Inventory: See AGENTIC_OS.md
- Technical Stack: See CLAUDE.md
```

---

## Summary of Deliverables

- [ ] Modified `src/components/TheCopilot.tsx`
- [ ] Updated `src/agents/custom/GeminiCoachAgent.ts` (KPI updates)
- [ ] Updated `src/agents/custom/SalesCopilotAgent.ts` (KPI updates)
- [ ] Created `Well/BIZ_PLAN_2026.md`

---

## Execution Instructions

Execute phases in order:
1. Phase 2 (Copilot)
2. Phase 5 (KPIs)
3. Phase 6 (Business Plan doc)

Skip Phases 3-4 (too complex for single CLI session).

---

## Final Verification

```bash
npm run build
```

Should succeed with only the 26 pre-existing test errors.

Proceed with consolidated implementation.
