# Task for Gemini CLI: Phase 1 - Type System Foundation

## Objective
Implement Phase 1 of the Agent-OS integration: Create the TypeScript type system foundation.

## Context
You are working on the **Well** project, a Hybrid Community Commerce platform. We are integrating an "Agentic Operating System" framework based on the specifications in `.claude/Agent-OS/`. 

The complete implementation plan is in `implementation_plan.md`.

## Your Task: Phase 1 Only

### 1. Create `src/types/agentic.ts`

Create a new file with the following TypeScript interfaces:

```typescript
// Agent Definition Schema
export interface AgentDefinition {
  agent_name: string;
  business_function: AgentFunction;
  primary_objectives: string[];
  inputs: AgentInput[];
  tools_and_systems: string[];
  core_actions: string[];
  outputs: string[];
  success_kpis: AgentKPI[];
  risk_and_failure_modes: string[];
  human_in_the_loop_points: string[];
  policy_and_constraints: AgentPolicy[];
}

export type AgentFunction =
  | 'Market & Research'
  | 'Marketing & Growth'
  | 'Sales & Revenue'
  | 'Customer Success & Support'
  | 'Product & UX'
  | 'Operations & Logistics'
  | 'Risk, Fraud & Compliance'
  | 'Finance & FP&A'
  | 'HR & Talent'
  | 'Data & Analytics'
  | 'IT & Infra / DevOps';

export interface AgentInput {
  source: string;
  dataType: 'CRM' | 'logs' | 'events' | 'email' | 'API' | 'user_input';
  schema?: any;
}

export interface AgentKPI {
  name: string;
  target: number;
  current?: number;
  unit: string;
}

export interface AgentPolicy {
  rule: string;
  enforcement: 'hard' | 'soft';
  notes?: string;
}

export interface AgentState {
  activeAgents: Map<string, AgentDefinition>;
  agentLogs: AgentLog[];
  agentMetrics: Map<string, AgentKPI[]>;
}

export interface AgentLog {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
  inputs: any;
  outputs: any;
  humanApproved?: boolean;
  policyViolations?: string[];
}
```

### 2. Validation

After creating the file:
- Run `npm run build` to ensure TypeScript compiles without errors
- Check that the file is properly formatted
- Verify all exports are accessible

## Success Criteria
- ✅ File `src/types/agentic.ts` exists
- ✅ TypeScript compilation succeeds (`npm run build`)
- ✅ No linting errors
- ✅ All interfaces properly exported

## Important Notes
- Do NOT implement the full Agent Registry yet (that's Phase 2)
- Do NOT modify existing files
- Only create this single new file
- Follow the existing code style in the project

## Commands You Can Use
- `npm run build` - Build the project
- `npm run dev` - Start dev server (optional, to verify no runtime errors)

Start with this Phase 1 task only. We'll do Phase 2 next.
