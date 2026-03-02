/**
 * AGI Commerce Orchestrator — Types
 *
 * Extracted from agi-commerce-orchestrator.ts.
 * Contains: OrchestratorStatus, CommerceGoal, OrchestratorResult.
 */

import type { ReasoningTrace } from './agi-react-reasoning-loop';

export type OrchestratorStatus = 'idle' | 'planning' | 'executing' | 'awaiting_approval' | 'completed' | 'failed';

export interface CommerceGoal {
  /** Natural language goal (e.g., "Find best water filter under 5M VND") */
  goal: string;
  /** Distributor context */
  distributorId?: string;
  /** Skip human approval gate (for low-value ops) */
  skipApproval?: boolean;
  /** Max reasoning steps */
  maxSteps?: number;
}

export interface OrchestratorResult {
  status: OrchestratorStatus;
  trace: ReasoningTrace;
  approvalRequired: boolean;
  domainEventsEmitted: string[];
  error?: string;
}
