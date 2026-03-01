/**
 * Workflow Node Graph Engine — n8n DAG-based execution pattern.
 *
 * Maps n8n's core architecture to agent workflow execution:
 * - WorkflowNode: Discrete work unit with typed inputs/outputs (n8n INode)
 * - NodeConnection: Directed edge, optionally branch-labelled (n8n IConnection)
 * - WorkflowGraph: Full DAG — nodes + edges + trigger entry point (n8n IWorkflowBase)
 * - GraphExecutor: Topological execution; parallel branching, conditional routing,
 *   merge-wait semantics (n8n WorkflowExecute.runPartialWorkflow2)
 * - NodeExecutionRecord: Per-node audit log (n8n IRunExecutionData)
 *
 * Pattern source: n8n-io/n8n packages/workflow/src/Workflow.ts + WorkflowExecute.ts
 *
 * Key differentiator from workflow-execution-context.ts (Temporal/saga pattern):
 * - Temporal: Sequential saga steps with compensation/rollback
 * - n8n (this file): DAG traversal — parallel branches, condition routing, merge nodes
 */

// ─── Types ───────────────────────────────────────────────────

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

// ─── Graph Analysis ──────────────────────────────────────────

/** Direct upstream node IDs for a given node (n8n: Workflow.getParentNodes) */
export function getNodeDependencies(graph: WorkflowGraph, nodeId: string): string[] {
  return graph.connections.filter((c) => c.targetNodeId === nodeId).map((c) => c.sourceNodeId);
}

/**
 * Topological sort via Kahn's algorithm.
 * All dependencies appear before their dependents. (n8n: Workflow.getNodeExecutionOrder)
 */
export function buildExecutionOrder(graph: WorkflowGraph): string[] {
  const inDegree = new Map<string, number>(graph.nodes.map((n) => [n.id, 0]));
  const adj = new Map<string, string[]>(graph.nodes.map((n) => [n.id, []]));

  for (const { sourceNodeId, targetNodeId } of graph.connections) {
    inDegree.set(targetNodeId, (inDegree.get(targetNodeId) ?? 0) + 1);
    adj.get(sourceNodeId)?.push(targetNodeId);
  }

  const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  const order: string[] = [];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    order.push(cur);
    for (const next of adj.get(cur) ?? []) {
      const deg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, deg);
      if (deg === 0) queue.push(next);
    }
  }

  return order;
}

// ─── Graph Executor ──────────────────────────────────────────

/**
 * Executes a WorkflowGraph in DAG topological order.
 *
 * Supports:
 * - Sequential chains  A → B → C
 * - Parallel branches  A → [B, C] → D (both B and C run, D waits for all)
 * - Conditional routing: condition node selects branch via output.branch
 * - Merge nodes: skipped if any required upstream node has no output
 */
class GraphExecutor {
  private runCounter = 0;

  async executeGraph(graph: WorkflowGraph, triggerInput: unknown = {}): Promise<GraphExecutionResult> {
    const runId = `run-${graph.id}-${++this.runCounter}-${Date.now()}`;
    const startedAt = Date.now();
    const records = new Map<string, NodeExecutionRecord>();
    const outputs = new Map<string, NodeOutput>();
    const skipped = new Set<string>();
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    outputs.set(graph.triggerNodeId, { data: triggerInput, branch: 'main' });

    for (const nodeId of buildExecutionOrder(graph)) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      if (skipped.has(nodeId)) {
        records.set(nodeId, makeRecord(node, 'skipped', null, null, 1));
        continue;
      }

      const deps = getNodeDependencies(graph, nodeId);
      const missingUpstream = deps.find((d) => !outputs.has(d) && !skipped.has(d));
      if (missingUpstream) {
        skipped.add(nodeId);
        records.set(nodeId, makeRecord(node, 'skipped', null, null, 1));
        continue;
      }

      const inputMap: Record<string, unknown> = {};
      for (const dep of deps) inputMap[dep] = outputs.get(dep)?.data ?? null;
      const primaryInput = outputs.get(deps[0] ?? graph.triggerNodeId)?.data ?? triggerInput;

      const ctx: NodeContext = { graphId: graph.id, runId, inputs: inputMap, parameters: node.parameters ?? {} };
      const record = await executeNodeWithRetry(node, primaryInput, ctx);
      records.set(nodeId, record);

      if (record.status === 'error') {
        markDownstream(graph, nodeId, skipped, records, nodeMap);
        continue;
      }

      outputs.set(nodeId, record.output!);

      // Condition routing — prune branches not selected by this node
      if (node.type === 'condition' && record.output?.branch) {
        const active = record.output.branch;
        for (const conn of graph.connections) {
          if (conn.sourceNodeId === nodeId && conn.branch !== active) {
            markDownstream(graph, conn.targetNodeId, skipped, records, nodeMap);
          }
        }
      }
    }

    const all = [...records.values()];
    const hasError = all.some((r) => r.status === 'error');
    const hasSkipped = all.some((r) => r.status === 'skipped');

    return {
      runId,
      graphId: graph.id,
      status: hasError ? (hasSkipped ? 'partial' : 'error') : 'success',
      startedAt,
      finishedAt: Date.now(),
      records: all,
    };
  }
}

// ─── Utilities ───────────────────────────────────────────────

async function executeNodeWithRetry(
  node: WorkflowNode,
  input: unknown,
  ctx: NodeContext,
): Promise<NodeExecutionRecord> {
  const max = node.retryPolicy?.maxAttempts ?? 1;
  const delay = node.retryPolicy?.delayMs ?? 0;
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      const output = await node.execute(input, ctx);
      return makeRecord(node, 'success', output, null, attempt, startedAt);
    } catch (err) {
      if (attempt < max && delay > 0) await new Promise<void>((r) => setTimeout(r, delay));
      if (attempt === max) {
        return makeRecord(node, 'error', null, err instanceof Error ? err.message : String(err), attempt, startedAt);
      }
    }
  }
  return makeRecord(node, 'error', null, 'Exhausted retries', max, startedAt);
}

function markDownstream(
  graph: WorkflowGraph,
  fromId: string,
  skipped: Set<string>,
  records: Map<string, NodeExecutionRecord>,
  nodeMap: Map<string, WorkflowNode>,
): void {
  if (skipped.has(fromId)) return;
  skipped.add(fromId);
  const node = nodeMap.get(fromId);
  if (node && !records.has(fromId)) records.set(fromId, makeRecord(node, 'skipped', null, null, 1));
  for (const conn of graph.connections) {
    if (conn.sourceNodeId === fromId) markDownstream(graph, conn.targetNodeId, skipped, records, nodeMap);
  }
}

function makeRecord(
  node: WorkflowNode,
  status: NodeStatus,
  output: NodeOutput | null,
  error: string | null,
  attempt: number,
  startedAt = Date.now(),
): NodeExecutionRecord {
  return { nodeId: node.id, nodeName: node.name, status, startedAt, finishedAt: Date.now(), output, error, attempt };
}

// ─── Singleton Export ────────────────────────────────────────

/** Global graph executor — n8n DAG workflow engine */
export const workflowGraphEngine = new GraphExecutor();
