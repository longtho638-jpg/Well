/**
 * Agent Supervisor Orchestrator — Railway service composition pattern.
 * Central coordinator that receives user input, classifies intent,
 * routes to the correct agent, and manages the execution pipeline.
 *
 * Pattern: Nixpacks Plan→Build→Deploy mapped to Detect→Route→Execute
 * Railway Pattern: Service graph with automatic networking between agents
 */

import { agentRegistry } from '../registry';
import { classifyIntent, type ClassificationResult } from './agent-intent-classifier';
import { executeTool, getAvailableTools } from '../tools/agent-tool-executor-registry';
import type { ToolCallRequest } from '../tools/agent-tool-types';
import { agentLogger } from '@/utils/logger';
import { agentHealthMonitor } from '@/lib/vibe-agent/agent-health-monitor';

export interface OrchestratorInput {
  message: string;
  userId?: string;
  sessionId?: string;
  context?: Record<string, unknown>;
}

export interface OrchestratorResult {
  classification: ClassificationResult;
  agentName: string;
  response: string | Record<string, unknown>;
  toolResults?: Array<{ toolName: string; result: unknown }>;
  executionTimeMs: number;
}

/**
 * Execute the full orchestration pipeline: Detect → Route → Execute.
 * Supervisor pattern — single entry point for all agent interactions.
 */
export async function orchestrateAgentRequest(
  input: OrchestratorInput
): Promise<OrchestratorResult> {
  const startTime = Date.now();

  // Step 1: DETECT — Classify user intent (Nixpacks auto-detection)
  const classification = classifyIntent(input.message);
  agentLogger.debug(
    `[Orchestrator] Intent: ${classification.intent} → ${classification.agentName} (${(classification.confidence * 100).toFixed(0)}%)`
  );

  // Step 2: ROUTE — Find the target agent from registry
  const agent = agentRegistry.get(classification.agentName);
  if (!agent) {
    return {
      classification,
      agentName: classification.agentName,
      response: `Agent "${classification.agentName}" not found in registry.`,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Step 3: Check if tools should be invoked based on intent
  const toolResults = await executeIntentTools(classification, input);

  // Step 4: Health check — skip disabled agents (circuit breaker)
  if (!agentHealthMonitor.isEnabled(classification.agentName)) {
    agentLogger.warn(`[Orchestrator] Agent "${classification.agentName}" disabled by circuit breaker`);
    return {
      classification,
      agentName: classification.agentName,
      response: 'Agent tạm thời không khả dụng. Vui lòng thử lại sau.',
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Step 5: EXECUTE — Run the agent with enriched context + health tracking
  let response: string | Record<string, unknown>;
  const execStart = Date.now();
  try {
    const agentInput = buildAgentInput(classification, input, toolResults);
    const result = await agent.execute(agentInput);
    response = result as string | Record<string, unknown>;
    agentHealthMonitor.recordSuccess(classification.agentName, Date.now() - execStart);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Agent execution failed';
    agentHealthMonitor.recordError(classification.agentName, errorMsg, Date.now() - execStart);
    agentLogger.error(`[Orchestrator] Agent execution failed`, error);
    response = {
      error: errorMsg,
      fallback: 'Xin lỗi, tôi không thể xử lý yêu cầu này. Vui lòng thử lại.',
    };
  }

  return {
    classification,
    agentName: classification.agentName,
    response,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Execute tools relevant to the classified intent.
 * Commission inquiry → commission-lookup tool
 * Product search → product-catalog-lookup tool
 * Team management → team-performance-metrics tool
 */
async function executeIntentTools(
  classification: ClassificationResult,
  input: OrchestratorInput
): Promise<Array<{ toolName: string; result: unknown }>> {
  const results: Array<{ toolName: string; result: unknown }> = [];

  const toolRequests: ToolCallRequest[] = [];

  switch (classification.intent) {
    case 'commission-inquiry':
      toolRequests.push({
        toolName: 'commission-lookup',
        args: { distributorId: input.userId ?? 'current', period: '30d' },
      });
      break;

    case 'product-search':
      toolRequests.push({
        toolName: 'product-catalog-lookup',
        args: { query: input.message, limit: 5 },
      });
      break;

    case 'team-management':
      toolRequests.push({
        toolName: 'team-performance-metrics',
        args: { teamId: input.userId ?? 'current', metricType: 'overview' },
      });
      break;
  }

  for (const request of toolRequests) {
    const toolResponse = await executeTool(request);
    if (!toolResponse.error) {
      results.push({ toolName: toolResponse.toolName, result: toolResponse.result });
    }
  }

  return results;
}

/**
 * Build agent-specific input from orchestrator context.
 */
function buildAgentInput(
  classification: ClassificationResult,
  input: OrchestratorInput,
  toolResults: Array<{ toolName: string; result: unknown }>
): Record<string, unknown> {
  const toolContext = toolResults.length > 0
    ? `\n\nDữ liệu từ hệ thống:\n${toolResults.map(t => `${t.toolName}: ${JSON.stringify(t.result)}`).join('\n')}`
    : '';

  switch (classification.agentName) {
    case 'Gemini Coach':
      return {
        action: 'getCoachAdvice',
        user: input.context?.['user'] ?? { name: 'User', rank: 'CTV', totalSales: 0, teamVolume: 0 },
        context: input.message + toolContext,
      };

    case 'Sales Copilot':
      return {
        action: 'generateResponse',
        message: input.message + toolContext,
        history: (input.context?.['history'] as Array<{ role: string; content: string }>) ?? [],
      };

    default:
      return { action: 'execute', message: input.message + toolContext };
  }
}

/**
 * Get orchestrator status — available agents and tools.
 */
export function getOrchestratorStatus(): {
  agentCount: number;
  toolCount: number;
  tools: Array<{ name: string; description: string }>;
  health: ReturnType<typeof agentHealthMonitor.getSystemHealth>;
} {
  return {
    agentCount: agentRegistry.count(),
    toolCount: getAvailableTools().length,
    tools: getAvailableTools(),
    health: agentHealthMonitor.getSystemHealth(),
  };
}
