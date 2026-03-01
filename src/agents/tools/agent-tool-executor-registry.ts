/**
 * Agent tool executor and registry
 * Runs tools by name with Zod-validated params; supports dynamic tool registration
 * Inspired by Vercel AI SDK multi-step tool execution pattern
 */
import type { AgentTool, ToolCallRequest, ToolCallResponse } from './agent-tool-types';
import { commissionTool } from './commission-lookup-tool';
import { productLookupTool } from './product-catalog-lookup-tool';
import { teamMetricsTool } from './team-performance-metrics-tool';

// Registry of available tools
const toolRegistry = new Map<string, AgentTool<unknown, unknown>>([
  [commissionTool.name, commissionTool as AgentTool<unknown, unknown>],
  [productLookupTool.name, productLookupTool as AgentTool<unknown, unknown>],
  [teamMetricsTool.name, teamMetricsTool as AgentTool<unknown, unknown>],
]);

export function getAvailableTools(): Array<{ name: string; description: string }> {
  return Array.from(toolRegistry.values()).map(t => ({
    name: t.name,
    description: t.description,
  }));
}

export async function executeTool(request: ToolCallRequest): Promise<ToolCallResponse> {
  const tool = toolRegistry.get(request.toolName);
  if (!tool) {
    return {
      toolName: request.toolName,
      result: null,
      error: `Tool "${request.toolName}" not found`,
    };
  }

  try {
    const validatedParams = tool.parameters.parse(request.args);
    const result = await tool.execute(validatedParams);
    return { toolName: request.toolName, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { toolName: request.toolName, result: null, error: message };
  }
}

export function registerTool(tool: AgentTool<unknown, unknown>): void {
  toolRegistry.set(tool.name, tool);
}
