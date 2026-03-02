/**
 * Workflow Node Graph Engine — Types (n8n DAG-based execution pattern)
 *
 * Extracted from workflow-node-graph-engine-n8n-pattern.ts.
 * Contains: NodeType, NodeStatus, NodeContext, NodeOutput, WorkflowNode,
 * NodeConnection, WorkflowGraph, NodeExecutionRecord, GraphExecutionResult.
 */

export type NodeType = 'trigger' | 'action' | 'condition' | 'merge' | 'output';
export type NodeStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped';

export interface NodeContext {
  graphId: string;
  runId: string;
  /** Outputs from all upstream nodes keyed by sourceNodeId */
  inputs: Record<string, unknown>;
  parameters: Record<string, unknown>;
}

export interface NodeOutput {
  data: unknown;
  /** Condition nodes set this to select which outgoing branch fires */
  branch?: string;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: NodeType;
  execute: (input: unknown, ctx: NodeContext) => Promise<NodeOutput>;
  parameters?: Record<string, unknown>;
  retryPolicy?: { maxAttempts: number; delayMs: number };
}

export interface NodeConnection {
  sourceNodeId: string;
  targetNodeId: string;
  /** Branch label for conditional routing (default: 'main') */
  branch: string;
}

export interface WorkflowGraph {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  triggerNodeId: string;
}

export interface NodeExecutionRecord {
  nodeId: string;
  nodeName: string;
  status: NodeStatus;
  startedAt: number;
  finishedAt: number | null;
  output: NodeOutput | null;
  error: string | null;
  attempt: number;
}

export interface GraphExecutionResult {
  runId: string;
  graphId: string;
  status: 'success' | 'error' | 'partial';
  startedAt: number;
  finishedAt: number;
  records: NodeExecutionRecord[];
}
