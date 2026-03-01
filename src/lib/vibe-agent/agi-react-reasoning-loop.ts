/**
 * AGI ReAct Reasoning Loop — Thought → Action → Observation cycle.
 *
 * Uses Vercel AI SDK v6 streamText with stopWhen: stepCountIs(N) for multi-turn tool-use.
 * Emits step events via agentEventBus for UI streaming.
 * Returns structured ReasoningTrace with all steps and final answer.
 */

import { streamText, stepCountIs, type ToolSet } from 'ai';
import { agentEventBus } from './agent-event-bus';
import { getVibeModel } from './agent-vercel-ai-adapter';
import { agiToolRegistry } from './agi-tool-registry';

// ─── Types ───────────────────────────────────────────────────

export type ReasoningStepType = 'thought' | 'action' | 'observation';

export interface ToolCallInfo {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface ReasoningStep {
  type: ReasoningStepType;
  content: string;
  toolCall?: ToolCallInfo;
  timestamp: string;
}

export interface ReasoningTrace {
  steps: ReasoningStep[];
  finalAnswer: string;
  totalSteps: number;
  durationMs: number;
}

export interface ReActLoopOptions {
  prompt: string;
  system?: string;
  model?: string;
  maxSteps?: number;
  tools?: ToolSet;
  onStepFinish?: (step: ReasoningStep) => void;
}

// ─── System Prompt ───────────────────────────────────────────

const REACT_SYSTEM_PROMPT = `You are an AGI agent for Well Distributor Portal. Think step by step.
Use tools when needed to answer questions about products, orders, commissions, and distributor ranks.
Always reason through your approach before taking action.
After using tools, synthesize the results into a clear, helpful response.`;

// ─── Helper ──────────────────────────────────────────────────

function ts(): string {
  return new Date().toISOString();
}

// ─── ReAct Loop ─────────────────────────────────────────────

/**
 * Execute a ReAct (Reason + Act) loop using Vercel AI SDK v6 streamText.
 * Tool calls use `input` field; tool results use `output` field (SDK v6 naming).
 */
export async function executeReActLoop(options: ReActLoopOptions): Promise<ReasoningTrace> {
  const {
    prompt,
    system = REACT_SYSTEM_PROMPT,
    model,
    maxSteps = 5,
    tools = agiToolRegistry,
    onStepFinish,
  } = options;

  const startMs = Date.now();
  const steps: ReasoningStep[] = [];

  function addStep(step: ReasoningStep): void {
    steps.push(step);
    onStepFinish?.(step);
    // Fire-and-forget — event bus is async but we don't block on it
    void agentEventBus.emit('tool:executed', step, 'agi-react-loop');
  }

  // Initial thought signals loop start
  addStep({ type: 'thought', content: `Processing: ${prompt}`, timestamp: ts() });

  const result = streamText({
    model: getVibeModel(model),
    system,
    prompt,
    tools,
    stopWhen: stepCountIs(maxSteps),
    onStepFinish: (stepResult) => {
      const text: string = stepResult.text ?? '';
      const toolCalls = stepResult.toolCalls ?? [];
      const toolResults = stepResult.toolResults ?? [];

      // Action step per tool call — SDK v6 uses `.input` for call args
      for (const call of toolCalls) {
        if (!call) continue;
        addStep({
          type: 'action',
          content: `Calling tool: ${call.toolName}`,
          toolCall: {
            toolName: call.toolName,
            args: (call.input as Record<string, unknown>) ?? {},
          },
          timestamp: ts(),
        });
      }

      // Observation step per tool result — SDK v6 uses `.output` for result
      for (const res of toolResults) {
        if (!res) continue;
        addStep({
          type: 'observation',
          content: `Tool result: ${JSON.stringify(res.output).slice(0, 200)}`,
          toolCall: {
            toolName: res.toolName,
            args: {},
            result: res.output,
          },
          timestamp: ts(),
        });
      }

      // Intermediate LLM text (no tool calls) → thought step
      if (text.trim() && toolCalls.length === 0) {
        addStep({ type: 'thought', content: text.trim(), timestamp: ts() });
      }
    },
  });

  const finalAnswer = await result.text;

  return {
    steps,
    finalAnswer,
    totalSteps: steps.length,
    durationMs: Date.now() - startMs,
  };
}
