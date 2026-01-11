# Agentic OS Design Plan

**Based on**: `02_SKILL-Agentic-Mapping-and-Design.json`

---

## Phase 1: Function Mapping

### Core Business Functions (from Well)
1. **Marketing & Growth** - Product discovery, content, ads
2. **Sales & Revenue** - Commission tracking, sales copilot
3. **Customer Success & Support** - AI Coach (Gemini)
4. **Operations & Logistics** - Wallet, withdrawals, tax
5. **Risk & Compliance** - Tax compliance, fraud detection
6. **Finance & FP&A** - Revenue tracking, projections
7. **Product & UX** - Feature development, design

---

## Phase 2: Agent Inventory

### Custom Agents (Already Built)
1. **Gemini Coach Agent**
   - Function: Customer Success & Support
   - Priority: HIGH
   - Status: Implemented in `src/services/geminiService.ts`

2. **Sales Copilot Agent**
   - Function: Sales & Revenue
   - Priority: HIGH
   - Status: Implemented in `src/services/copilotService.ts`

### Proposed Agents
3. **Growth Experiment Agent**
   - Function: Marketing & Growth
   - Priority: MEDIUM
   - Actions: A/B test management, bullseye framework

4. **Compliance Agent**
   - Function: Risk & Compliance
   - Priority: HIGH
   - Actions: Tax calculation validation, KYC checks

5. **FP&A Agent**
   - Function: Finance & FP&A
   - Priority: MEDIUM
   - Actions: Revenue forecasting, scenario planning

### ClaudeKit Agents (35 total)
Map to functions:
- `react-expert`, `typescript-expert` → **Product & UX**
- `postgres-expert`, `docker-expert` → **IT & Infra**
- `testing-expert`, `playwright-expert` → **Operations**
- ... (full mapping in `AGENTIC_OS.md`)

---

## Phase 3: Agent Design Table

For each HIGH priority agent, define:
- **Inputs**: Data sources (CRM, logs, user input)
- **Tools**: Systems accessed (Gemini API, database, CRM)
- **Core Actions**: What the agent can do
- **Outputs**: Reports, recommendations, automated actions
- **KPIs**: Success metrics (3-5 per agent)
- **Human-in-the-Loop**: When approval is required
- **Policies**: Hard constraints (what agent CANNOT do)

---

## Phase 4: Policy & Guardrails

### Global Policies
- **Scope**: Agents operate within assigned business function only
- **Data Access**: No PII access without explicit user consent
- **Action Limits**: 
  - Financial actions > 10M VND require human approval
  - Withdrawal requests always require human approval
  - Tax-related decisions must log audit trail
- **Change Management**: All agent logic changes go through staging first
- **Logging**: Every agent action must be logged with inputs/outputs

---

## Phase 5: Monitoring & KPIs

### System-Level KPIs
- Total agent actions per day
- Human override rate (target: <5%)
- Policy violation count (target: 0)
- Average response time

### Agent-Level KPIs
- Per-agent success rate
- Per-agent error rate
- User satisfaction (where applicable)

---

## Output

### [NEW] `AGENTIC_OS.md`
Complete Agentic Operating System documentation including:
- Full agent inventory
- Detailed agent definitions
- Policy framework
- Monitoring dashboard spec
