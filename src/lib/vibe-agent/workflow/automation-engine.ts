import { z } from 'zod';
import { executeWorkflow, WorkflowStep, WorkflowState } from '../workflow-execution-context';
import { integrationRegistry } from '../registry/integration-registry';
import { agentLogger } from '@/utils/logger';

/**
 * Workflow Automation Engine — Foundations
 *
 * Inspired by Cal.com's automation patterns. This engine orchestrates
 * multi-step agent workflows based on triggers and actions.
 */

// ─── Schemas ──────────────────────────────────────────────────

export const TriggerSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['event', 'schedule', 'webhook', 'manual']),
  name: z.string(),
  config: z.record(z.unknown()).optional(),
});

export const ActionSchema = z.object({
  id: z.string().uuid(),
  integrationId: z.string(),
  capability: z.string(),
  params: z.record(z.unknown()).optional(),
  retryPolicy: z.object({
    maxAttempts: z.number().default(3),
    backoffCoefficient: z.number().default(2),
  }).optional(),
});

export const WorkflowDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  trigger: TriggerSchema,
  actions: z.array(ActionSchema),
  enabled: z.boolean().default(true),
});

export type Trigger = z.infer<typeof TriggerSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

// ─── Automation Engine ───────────────────────────────────────

export class AutomationEngine {
  /**
   * Triggers a workflow execution based on a definition and input data.
   * Maps Action items to WorkflowStep items for the execution context.
   */
  public async triggerWorkflow(
    definition: WorkflowDefinition,
    initialData: unknown
  ): Promise<WorkflowState> {
    agentLogger.info(`[AutomationEngine] Triggering workflow: ${definition.name} (${definition.id})`);

    if (!definition.enabled) {
      throw new Error(`Workflow ${definition.id} is disabled`);
    }

    // 1. Map definition actions to execution steps
    const steps: WorkflowStep[] = definition.actions.map((action, index) => {
      return {
        name: `Action_${index + 1}_${action.capability}`,
        retryPolicy: action.retryPolicy,
        execute: async (input, _ctx) => {
          // Verify integration availability
          const integration = integrationRegistry.getById(action.integrationId);
          if (!integration) {
            throw new Error(`Integration ${action.integrationId} not found`);
          }

          if (!integration.capabilities.includes(action.capability)) {
            throw new Error(`Integration ${integration.name} does not support capability: ${action.capability}`);
          }

          agentLogger.info(`[AutomationEngine] Executing ${action.capability} via ${integration.name}`);

          // In a real system, this would call the actual integration handler
          // For now, we simulate the execution and merge params with input
          return {
            ...action.params,
            ...(typeof input === 'object' ? input : { input }),
            processedAt: new Date().toISOString(),
          };
        },
        compensate: async (_input, _output, _ctx) => {
          // Rollback logic would go here
        }
      };
    });

    // 2. Delegate to the durable execution context
    return await executeWorkflow(definition.name, steps, initialData);
  }
}

/**
 * Singleton instance of the engine.
 */
export const automationEngine = new AutomationEngine();
