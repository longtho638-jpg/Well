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
  visibility: 'user' | 'admin' | 'all';
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
  schema?: Record<string, unknown>;
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
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  humanApproved?: boolean;
  policyViolations?: string[];
}
