import { z } from 'zod';
import { BaseService } from './base-service';
import { streamVibeText } from '../agent-vercel-ai-adapter';

/**
 * Zod schemas for AgentService inputs and outputs
 */
export const AgentCreateSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['coach', 'sales', 'reward', 'diagnostic']),
  config: z.record(z.unknown()).optional(),
  metadata: z.record(z.string()).optional(),
});

export const AgentResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(['idle', 'running', 'paused', 'error']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AgentCreateInput = z.infer<typeof AgentCreateSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;

/**
 * AgentService
 *
 * Example implementation of the Zod-based type-safe service layer pattern.
 */
export class AgentService extends BaseService<typeof AgentCreateSchema, typeof AgentResponseSchema> {
  protected inputSchema = AgentCreateSchema;
  protected outputSchema = AgentResponseSchema;

  protected async implementation(input: AgentCreateInput): Promise<AgentResponse> {
    // In a real application, this would interact with Supabase or another DB
    console.log(`[AgentService] Creating agent: ${input.name} of type ${input.type}`);

    // Mocking the creation process
    const mockAgent: AgentResponse = {
      id: crypto.randomUUID(),
      name: input.name,
      status: 'idle',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return mockAgent;
  }

  /**
   * Stream a response from an agent using Vercel AI SDK patterns.
   */
  public async stream(agentId: string, prompt: string) {
    return streamVibeText({
      model: agentId, // Router handles mapping agentId to model
      prompt,
    });
  }
}

/**
 * Export a singleton instance or use dependency injection
 */
export const agentService = new AgentService();
